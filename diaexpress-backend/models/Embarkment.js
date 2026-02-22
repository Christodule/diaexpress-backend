const mongoose = require('mongoose');

const embarkmentSchema = new mongoose.Schema(
  {
    transportLineId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportLine', required: true },
    expeditionLineId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpeditionLine', default: null },
    transportType: { type: String, enum: ['air', 'sea', 'road'], required: true },
    departureWindowStart: { type: Date, required: true },
    departureWindowEnd: { type: Date, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    cutoffDate: { type: Date },
    label: { type: String, trim: true },
    allowedPackageTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PackageType' }],
    status: {
      type: String,
      enum: ['planned', 'booking_open', 'closed', 'completed', 'cancelled', 'open'],
      default: 'planned',
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

embarkmentSchema.virtual('isActive').get(function () {
  return this.active;
});

embarkmentSchema.set('toJSON', { virtuals: true });
embarkmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Embarkment || mongoose.model('Embarkment', embarkmentSchema);
