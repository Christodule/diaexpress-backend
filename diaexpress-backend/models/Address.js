const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    provider: { type: String, trim: true },
    capturedAt: { type: Date },
  },
  { _id: false }
);

const AddressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    marketPointId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketPoint', default: null },
    principalId: { type: String, index: true },
    // Ces adresses servent aussi de points relais / agences pour les expéditions
    // afin de préparer l'intégration future avec Google Maps.
    type: {
      type: String,
      enum: [
        'pickup',
        'dropoff',
        'billing',
        'warehouse_proxy',
        'contact',
        'other',
        'agency',
        'pickup_point',
        'warehouse',
      ],
      default: 'pickup',
    },
    label: { type: String, trim: true },
    contactName: { type: String, trim: true },
    company: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
    countryCode: { type: String, trim: true, uppercase: true },
    addressText: { type: String, trim: true },
    geo: {
      lat: { type: Number },
      lng: { type: Number },
    },
    latitude: { type: Number },
    longitude: { type: Number },
    notes: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    tags: {
      type: [String],
      default: undefined,
      set: (values) =>
        Array.from(
          new Set(
            (values || [])
              .map((value) => (typeof value === 'string' ? value.trim() : ''))
              .filter(Boolean)
          )
        ),
    },
    gpsLocation: LocationSchema,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

AddressSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

AddressSchema.set('toObject', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

AddressSchema.virtual('isActive').get(function () {
  return this.active;
});

module.exports = mongoose.models.Address || mongoose.model('Address', AddressSchema);
