const mongoose = require('mongoose');

const expeditionLineSchema = new mongoose.Schema(
  {
    originCountry: { type: String, required: true, trim: true, uppercase: true },
    destinationCountry: { type: String, required: true, trim: true, uppercase: true },
    originCountryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', default: null },
    destinationCountryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', default: null },
    originMarketPointId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketPoint', default: null },
    destinationMarketPointId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketPoint', default: null },
    originAddressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },
    destinationAddressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },
    transportType: { type: String, enum: ['air', 'sea', 'road'], default: 'air' },
    transportTypes: {
      type: [String],
      enum: ['air', 'sea', 'road'],
      default: [],
      validate: (value) => Array.isArray(value) && value.length > 0,
    },
    label: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

expeditionLineSchema.index(
  { originCountry: 1, destinationCountry: 1, transportTypes: 1 },
  { partialFilterExpression: { active: true } }
);

expeditionLineSchema.virtual('isActive').get(function () {
  return this.active;
});

expeditionLineSchema.set('toJSON', { virtuals: true });
expeditionLineSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.ExpeditionLine || mongoose.model('ExpeditionLine', expeditionLineSchema);
