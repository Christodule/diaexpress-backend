// services/paymentWorkflowService.js
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Quote = require("../models/Quote");
const { getPaymentById: getDiaPayPayment } = require("../services/diapayClient");

const DIA_PAY_SUCCESS = new Set(["succeeded"]);
const DIA_PAY_FAILURE = new Set(["failed"]);

function isValidObjectId(value) {
  return Boolean(value) && mongoose.isValidObjectId(value);
}

function normaliseWorkflowUpdates(updates = {}) {
  if (!updates || typeof updates !== "object") {
    return {};
  }

  if (updates.workflow && typeof updates.workflow === "object") {
    return updates.workflow;
  }

  return updates;
}

function mergeLegacy(existingLegacy, { providerRef, reason, workflow }) {
  const base =
    existingLegacy && typeof existingLegacy === "object" ? { ...existingLegacy } : {};
  let mutated = false;

  if (providerRef && typeof providerRef === "object" && Object.keys(providerRef).length > 0) {
    base.providerRef = { ...(base.providerRef || {}), ...providerRef };
    mutated = true;
  }

  if (typeof reason === "string" && reason.length > 0) {
    base.failureReason = reason;
    mutated = true;
  }

  if (workflow && typeof workflow === "object" && Object.keys(workflow).length > 0) {
    base.workflow = { ...(base.workflow || {}), ...workflow };
    mutated = true;
  }

  return mutated ? base : existingLegacy;
}

function mapQuoteUpdateForStatus(status, statusSyncedAt) {
  if (DIA_PAY_SUCCESS.has(status)) {
    return {
      $set: {
        paymentStatus: "confirmed",
        status: "confirmed",
        paymentDate: statusSyncedAt ?? new Date(),
      },
    };
  }

  if (DIA_PAY_FAILURE.has(status)) {
    return {
      $set: {
        paymentStatus: "failed",
        status: "rejected",
      },
      $unset: { paymentDate: "" },
    };
  }

  if (status === "pending" || status === "processing") {
    return {
      $set: {
        paymentStatus: "pending",
        status: "pending",
      },
      $unset: { paymentDate: "" },
    };
  }

  return null;
}

async function updateQuoteStatus(quoteId, status, paymentId, statusSyncedAt) {
  if (!quoteId) {
    return;
  }

  const update = mapQuoteUpdateForStatus(status, statusSyncedAt);
  if (!update) {
    return;
  }

  if (paymentId) {
    update.$set = { ...(update.$set || {}), paymentId };
  }

  await Quote.findByIdAndUpdate(quoteId, update);
}

async function fetchRemotePayment(remoteId) {
  if (!remoteId) {
    return null;
  }

  try {
    return await getDiaPayPayment(remoteId);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }

    console.warn("Unable to fetch diaPay payment", {
      remoteId,
      error: error.message,
    });
    return null;
  }
}

function buildUpdatePayload({
  existing,
  remotePayment,
  status,
  diapayPaymentId,
  providerRef,
  updates,
  reason,
  statusSyncedAt,
}) {
  const payload = {
    status,
    statusSyncedAt,
  };

  if (remotePayment?.id) {
    payload.diapayPaymentId = remotePayment.id;
  } else if (diapayPaymentId) {
    payload.diapayPaymentId = diapayPaymentId;
  }

  const workflowPatch = normaliseWorkflowUpdates(updates);
  const legacy = mergeLegacy(existing.legacy, {
    providerRef,
    reason,
    workflow: workflowPatch,
  });

  if (legacy !== existing.legacy && legacy !== undefined) {
    payload.legacy = legacy;
  }

  return payload;
}

function parseStatusSyncedAt(remotePayment) {
  if (!remotePayment || typeof remotePayment !== "object") {
    return null;
  }

  const candidates = [
    remotePayment.status_updated_at,
    remotePayment.statusUpdatedAt,
    remotePayment.statusUpdated_at,
    remotePayment.status_updatedAt,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (candidate instanceof Date) {
      return Number.isNaN(candidate.getTime()) ? null : candidate;
    }

    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

async function applyStatusUpdate({
  existing,
  remotePayment,
  status,
  diapayPaymentId,
  providerRef,
  updates,
  reason,
}) {
  const statusSyncedAt = parseStatusSyncedAt(remotePayment) || new Date();

  const payload = buildUpdatePayload({
    existing,
    remotePayment,
    status,
    diapayPaymentId,
    providerRef,
    updates,
    reason,
    statusSyncedAt,
  });

  const payment = await Payment.findByIdAndUpdate(existing._id, payload, { new: true });
  if (payment) {
    await updateQuoteStatus(payment.quote, status, payment._id, statusSyncedAt);
  }
  return payment;
}

async function resolvePayment({ paymentId, diapayPaymentId, fallbackPaymentId }) {
  if (isValidObjectId(paymentId)) {
    const payment = await Payment.findById(paymentId);
    if (payment) {
      return payment;
    }
  }

  if (diapayPaymentId) {
    const payment = await Payment.findOne({ diapayPaymentId });
    if (payment) {
      return payment;
    }
  }

  if (isValidObjectId(fallbackPaymentId)) {
    return Payment.findById(fallbackPaymentId);
  }

  return null;
}

async function syncDiaPayStatus({
  paymentId,
  diapayPaymentId,
  status,
  updates = {},
  providerRef,
  reason,
  fallbackStatus,
  fallbackPaymentId,
}) {
  const existing = await resolvePayment({ paymentId, diapayPaymentId, fallbackPaymentId });
  if (!existing) {
    return null;
  }

  const remoteId = diapayPaymentId || existing.diapayPaymentId;
  const remotePayment = await fetchRemotePayment(remoteId);

  const resolvedStatus =
    remotePayment?.status || status || fallbackStatus || existing.status || "pending";

  return applyStatusUpdate({
    existing,
    remotePayment,
    status: resolvedStatus,
    diapayPaymentId: remoteId || diapayPaymentId,
    providerRef,
    updates,
    reason,
  });
}

function withRemoteProviderRef(remotePaymentId, providerRef) {
  if (!remotePaymentId) {
    return providerRef;
  }

  return { diapayPaymentId: remotePaymentId, ...(providerRef || {}) };
}

async function confirmPayment({ paymentId, diapayPaymentId, providerRef, updates = {} }) {
  return syncDiaPayStatus({
    paymentId,
    diapayPaymentId,
    updates,
    providerRef,
    status: "succeeded",
    fallbackStatus: "succeeded",
  });
}

async function failPayment({ paymentId, diapayPaymentId, reason, providerRef, updates = {} }) {
  return syncDiaPayStatus({
    paymentId,
    diapayPaymentId,
    updates,
    providerRef,
    reason,
    status: "failed",
    fallbackStatus: "failed",
  });
}

async function confirmPaymentByRemoteId({
  remotePaymentId,
  providerRef,
  updates = {},
  fallbackPaymentId,
}) {
  return syncDiaPayStatus({
    paymentId: fallbackPaymentId,
    diapayPaymentId: remotePaymentId,
    fallbackPaymentId,
    updates,
    providerRef: withRemoteProviderRef(remotePaymentId, providerRef),
    status: "succeeded",
    fallbackStatus: "succeeded",
  });
}

async function failPaymentByRemoteId({
  remotePaymentId,
  reason,
  providerRef,
  updates = {},
  fallbackPaymentId,
}) {
  return syncDiaPayStatus({
    paymentId: fallbackPaymentId,
    diapayPaymentId: remotePaymentId,
    fallbackPaymentId,
    updates,
    providerRef: withRemoteProviderRef(remotePaymentId, providerRef),
    reason,
    status: "failed",
    fallbackStatus: "failed",
  });
}

async function syncPaymentStatusByRemoteId({
  remotePaymentId,
  remoteStatus,
  providerRef,
  fallbackPaymentId,
}) {
  return syncDiaPayStatus({
    paymentId: fallbackPaymentId,
    diapayPaymentId: remotePaymentId,
    fallbackPaymentId,
    providerRef: withRemoteProviderRef(remotePaymentId, providerRef),
    status: remoteStatus,
    fallbackStatus: remoteStatus,
  });
}

module.exports = {
  confirmPayment,
  failPayment,
  confirmPaymentByRemoteId,
  failPaymentByRemoteId,
  syncPaymentStatusByRemoteId,
  syncDiaPayStatus,
};
