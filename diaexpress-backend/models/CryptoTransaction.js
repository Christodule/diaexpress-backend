const mongoose = require('mongoose');

const amountSchema = new mongoose.Schema(
  {
    value: { type: Number },
    currency: { type: String },
  },
  { _id: false }
);

const complianceSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
    },
    amlScore: { type: Number },
    sanctions: {
      status: {
        type: String,
        enum: ['clear', 'blocked', 'review'],
        default: 'clear',
      },
      lists: [{ type: String }],
      provider: { type: String },
      checkedAt: { type: Date },
    },
    travelRule: {
      status: {
        type: String,
        enum: ['not_required', 'pending', 'submitted', 'approved', 'rejected'],
        default: 'not_required',
      },
      reference: { type: String },
      checkedAt: { type: Date },
    },
    flags: [{ type: String }],
  },
  { _id: false }
);

const cryptoTransactionSchema = new mongoose.Schema(
  {
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    custodian: { type: String, required: true },
    type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
    assetSymbol: { type: String },
    address: { type: String },
    txId: { type: String, index: true },
    status: {
      type: String,
      enum: ['AWAITING_FUNDS', 'PENDING', 'CONFIRMED', 'FAILED', 'REJECTED', 'CANCELLED'],
      default: 'AWAITING_FUNDS',
    },
    confirmations: { type: Number, default: 0 },
    requiredConfirmations: { type: Number, default: 1 },
    amountFiat: amountSchema,
    amountCrypto: amountSchema,
    compliance: complianceSchema,
    metadata: { type: mongoose.Schema.Types.Mixed },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.CryptoTransaction ||
  mongoose.model('CryptoTransaction', cryptoTransactionSchema);
