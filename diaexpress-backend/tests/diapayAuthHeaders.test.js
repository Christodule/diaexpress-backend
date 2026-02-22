const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const SERVICE_MODULES = [
  "../services/diapayAdminClient",
  "../services/diapayClient",
];

function backupEnv(keys) {
  const snapshot = {};
  for (const key of keys) {
    snapshot[key] = process.env[key];
  }
  return snapshot;
}

function restoreEnv(snapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function clearServiceCaches() {
  for (const modulePath of SERVICE_MODULES) {
    const resolved = require.resolve(modulePath);
    delete require.cache[resolved];
  }
}

function loadServices() {
  clearServiceCaches();
  const diapayClient = require("../services/diapayClient");
  const diapayAdminClient = require("../services/diapayAdminClient");
  return { diapayClient, diapayAdminClient };
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, () => {
      server.off("error", reject);
      const address = server.address();
      resolve(typeof address === "object" && address ? address.port : address);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

test("diaPay admin requests omit API key while merchant calls retain it", async (t) => {
  const envSnapshot = backupEnv([
    "DIAPAY_API_URL",
    "DIAPAY_API_KEY",
    "DIAPAY_BEARER_TOKEN",
  ]);

  t.after(() => {
    restoreEnv(envSnapshot);
    clearServiceCaches();
  });

  restoreEnv(envSnapshot);

  const requests = [];
  const server = http.createServer((req, res) => {
    const record = {
      method: req.method,
      url: req.url,
      headers: { ...req.headers },
    };
    requests.push(record);

    if (req.method === "GET" && req.url.startsWith("/admin/payments")) {
      res.setHeader("Content-Type", "application/json");
      if (req.headers["x-api-key"]) {
        res.statusCode = 403;
        res.end(JSON.stringify({ message: "admin must not include API key" }));
        return;
      }
      if (req.headers.authorization !== "Bearer admin-token") {
        res.statusCode = 401;
        res.end(JSON.stringify({ message: "missing bearer" }));
        return;
      }
      res.end(JSON.stringify({ payments: [] }));
      return;
    }

    if (req.method === "POST" && req.url === "/payments") {
      let body = "";
      req.setEncoding("utf8");
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        res.setHeader("Content-Type", "application/json");
        if (req.headers["x-api-key"] !== "merchant-key") {
          res.statusCode = 403;
          res.end(JSON.stringify({ message: "merchant requires API key" }));
          return;
        }
        try {
          JSON.parse(body || "{}");
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ message: "invalid json" }));
          return;
        }
        res.end(JSON.stringify({ paymentId: "pay_123", status: "pending" }));
      });
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ message: "not found" }));
  });

  const port = await listen(server);
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    process.env.DIAPAY_API_URL = baseUrl;
    process.env.DIAPAY_API_KEY = "merchant-key";
    process.env.DIAPAY_BEARER_TOKEN = "admin-token";

    const { diapayClient, diapayAdminClient } = loadServices();
    const { listPayments } = diapayAdminClient;
    const { createPayment } = diapayClient;

    const adminResponse = await listPayments({ status: "pending" });
    assert.deepStrictEqual(adminResponse, { payments: [] });

    const paymentResponse = await createPayment({ amount: 10, currency: "USD" });
    assert.strictEqual(paymentResponse.status, "pending");

    assert.strictEqual(requests.length, 2);

    const adminRequest = requests.find((req) => req.url.startsWith("/admin/payments"));
    assert.ok(adminRequest, "expected admin payments request");
    assert.strictEqual(adminRequest.headers["x-api-key"], undefined);
    assert.strictEqual(adminRequest.headers.authorization, "Bearer admin-token");

    const merchantRequest = requests.find((req) => req.method === "POST" && req.url === "/payments");
    assert.ok(merchantRequest, "expected merchant payment creation request");
    assert.strictEqual(merchantRequest.headers["x-api-key"], "merchant-key");
    assert.strictEqual(merchantRequest.headers.authorization, "Bearer admin-token");
  } finally {
    await close(server);
  }
});
