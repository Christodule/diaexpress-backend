// models/Payment.js
const mongoose = require("mongoose");

const DIA_PAY_STATUSES = ["pending", "processing", "succeeded", "failed"];

const paymentSchema = new mongoose.Schema(
  {
    diapayPaymentId: { type: String, index: true, unique: true, sparse: true },
    quote: { type: mongoose.Schema.Types.ObjectId, ref: "Quote", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, enum: ["diapay", "stripe", "crypto"], required: true },
    method: { type: String, enum: ["card", "usdc", "btc", "eth"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    fiatAmount: { type: Number },
    fiatCurrency: { type: String },
    cryptoAmount: { type: Number },
    cryptoCurrency: { type: String },
    custodian: {
      type: String,
      enum: ["fireblocks", "coinbase-commerce", "coinbase"],
      default: undefined,
    },
    blockchain: { type: String },
    network: { type: String },
    amounts: {
      fiat: {
        value: { type: Number },
        currency: { type: String },
      },
      crypto: {
        value: { type: Number },
        currency: { type: String },
      },
    },
    onChain: {
      depositAddress: { type: String },
      withdrawalAddress: { type: String },
      txId: { type: String, index: true },
      status: {
        type: String,
        enum: [
          "AWAITING_FUNDS",
          "PENDING",
          "CONFIRMED",
          "FAILED",
          "REJECTED",
          "CANCELLED",
          null,
        ],
        default: null,
      },
      confirmations: { type: Number, default: 0 },
      requiredConfirmations: { type: Number, default: 1 },
      lastCheckedAt: { type: Date },
    },
    compliance: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", "flagged"],
        default: "pending",
      },
      amlScore: { type: Number },
      flags: [{ type: String }],
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
      sanctions: {
        status: {
          type: String,
          enum: ["clear", "blocked", "review"],
          default: "clear",
        },
        lists: [{ type: String }],
        provider: { type: String },
        checkedAt: { type: Date },
        notes: { type: String },
      },
      travelRule: {
        status: {
          type: String,
          enum: ["not_required", "pending", "submitted", "approved", "rejected"],
          default: "not_required",
        },
        reference: { type: String },
        checkedAt: { type: Date },
        notes: { type: String },
      },
    },
    status: { type: String, enum: DIA_PAY_STATUSES, default: "pending" },
    statusSyncedAt: { type: Date },
    legacy: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

paymentSchema.statics.DIA_PAY_STATUSES = DIA_PAY_STATUSES;

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
