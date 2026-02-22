const mongoose = require('mongoose');

const MarketPointSchema = new mongoose.Schema(
  {
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', default: null },
    countryCode: { type: String, uppercase: true, trim: true },
    countryName: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    label: { type: String, trim: true },
    type: {
      type: String,
      enum: ['agency', 'hub', 'relay', 'country_hub', 'pickup_point'],
      default: 'agency',
    },
    contactName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    addressText: { type: String, trim: true },
    geo: {
      lat: { type: Number },
      lng: { type: Number },
    },
    lat: { type: Number },
    lng: { type: Number },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MarketPointSchema.virtual('isActive').get(function () {
  return this.active;
});

MarketPointSchema.set('toJSON', { virtuals: true });
MarketPointSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MarketPoint', MarketPointSchema);
