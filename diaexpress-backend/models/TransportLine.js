const mongoose = require('mongoose');

const transportLineSchema = new mongoose.Schema(
  {
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    transportTypes: {
      type: [String],
      enum: ['air', 'sea', 'road'],
      default: [],
      validate: (value) => Array.isArray(value) && value.length > 0,
    },
    lineCode: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
    estimatedTransitDays: { type: Number },
  },
  {
    timestamps: true,
  }
);

transportLineSchema.index({ origin: 1, destination: 1, lineCode: 1 }, { unique: false });

module.exports = mongoose.models.TransportLine || mongoose.model('TransportLine', transportLineSchema);
