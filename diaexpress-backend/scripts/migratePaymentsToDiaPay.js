#!/usr/bin/env node

require("dotenv").config();
const mongoose = require("mongoose");
const Payment = require("../models/Payment");

const MIGRATION_FIELDS = [
  "provider",
  "method",
  "fiatAmount",
  "fiatCurrency",
  "cryptoAmount",
  "cryptoCurrency",
  "amounts",
  "custodian",
  "blockchain",
  "network",
  "onChain",
  "compliance",
  "providerRef",
  "onChainMetadata",
  "cryptoTransaction",
  "transactionHash",
  "confirmedAt",
  "failedAt",
  "reason",
];

const DIA_PAY_STATUSES = new Set(["pending", "processing", "succeeded", "failed"]);

function mapStatus(status) {
  if (!status) {
    return "pending";
  }
  const normalized = status.toString().toUpperCase();
  switch (normalized) {
    case "CONFIRMED":
      return "succeeded";
    case "FAILED":
      return "failed";
    case "ON_HOLD":
      return "processing";
    case "WAITING":
    case "PENDING":
      return "pending";
    default: {
      const lower = status.toString().toLowerCase();
      return DIA_PAY_STATUSES.has(lower) ? lower : "pending";
    }
  }
}

function extractLegacy(raw, newStatus) {
  const existingLegacy = raw.legacy && typeof raw.legacy === "object" ? raw.legacy : undefined;
  const previousSchema = {};

  for (const field of MIGRATION_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(raw, field) && raw[field] !== undefined) {
      previousSchema[field] = raw[field];
    }
  }

  const statusChanged = raw.status && raw.status !== newStatus;
  const hasPreviousSchema = Object.keys(previousSchema).length > 0;

  if (!hasPreviousSchema && !statusChanged) {
    return { value: existingLegacy, changed: false };
  }

  const merged = {
    ...(existingLegacy || {}),
    migratedAt: new Date(),
  };

  if (hasPreviousSchema) {
    merged.previousSchema = {
      ...(existingLegacy?.previousSchema || {}),
      ...previousSchema,
    };
  }

  if (statusChanged) {
    merged.previousStatus = raw.status;
  }

  return { value: merged, changed: true };
}

function sanitizeUnset(raw) {
  const unset = {};
  for (const field of MIGRATION_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(raw, field)) {
      unset[field] = "";
    }
  }
  return unset;
}

async function run() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_CONNECTION_STRING;

  if (!uri) {
    console.error("Missing MongoDB connection string. Set MONGODB_URI before running the script.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const payments = await Payment.collection.find({}).toArray();
  console.log(`Inspecting ${payments.length} payments...`);

  let migrated = 0;

  for (const raw of payments) {
    const amount = typeof raw.amount === "number" ? raw.amount : raw.fiatAmount ?? null;
    const currencySource = raw.currency || raw.fiatCurrency || "USD";
    const currency = currencySource ? currencySource.toString().toUpperCase() : "USD";
    const status = mapStatus(raw.status);
    const statusSyncedAt = raw.statusSyncedAt
      ? new Date(raw.statusSyncedAt)
      : raw.updatedAt
      ? new Date(raw.updatedAt)
      : new Date();

    const { value: legacy, changed: legacyChanged } = extractLegacy(raw, status);
    const unset = sanitizeUnset(raw);

    if (amount == null) {
      console.warn(`Payment ${raw._id} missing amount, defaulting to 0 during migration`);
    }

    const updateDoc = {
      $set: {
        amount: amount ?? 0,
        currency,
        status,
        statusSyncedAt,
      },
    };

    if (legacyChanged) {
      updateDoc.$set.legacy = legacy;
    }

    if (Object.keys(unset).length > 0) {
      updateDoc.$unset = unset;
    }

    const hasStatusDiff = !DIA_PAY_STATUSES.has((raw.status || "").toString().toLowerCase());
    const hasAmountDiff = amount != null && raw.amount !== amount;
    const hasCurrencyDiff = raw.currency?.toString().toUpperCase() !== currency;

    if (hasStatusDiff || Object.keys(unset).length > 0 || legacyChanged || hasAmountDiff || hasCurrencyDiff) {
      await Payment.collection.updateOne({ _id: raw._id }, updateDoc);
      migrated += 1;
    }
  }

  await mongoose.disconnect();
  console.log(`Migration complete. Updated ${migrated} payment(s).`);
}

run().catch((error) => {
  console.error("Migration failed", error);
  process.exit(1);
});
