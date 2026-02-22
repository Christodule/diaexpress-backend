/*
const mongoose = require("mongoose");

const PackagePricingSchema = new mongoose.Schema({
  packageTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PackageType", // si tu as un modèle séparé pour les types de colis
    required: true,
  },
  basePrice: { type: Number, required: true },
});

const DimensionRangeSchema = new mongoose.Schema({
  minLength: { type: Number },
  maxLength: { type: Number },
  minWidth: { type: Number },
  maxWidth: { type: Number },
  minHeight: { type: Number },
  maxHeight: { type: Number },
  minWeight: { type: Number },
  maxWeight: { type: Number },
  minVolume: { type: Number },
  maxVolume: { type: Number },
  price: { type: Number, required: true },
  priority: { type: Number, default: 1 },
  description: { type: String },
});

const TransportPriceSchema = new mongoose.Schema({
  transportType: {
    type: String,
    enum: ["air", "sea", "road", "rail", "drone", "camion", "train"],
    required: true,
  },
  unitType: {
    type: String,
    enum: ["kg", "m3"],
    required: false,
  },
  pricePerUnit: { type: Number },
  dimensionRanges: [DimensionRangeSchema], // plages dimensionnelles
  packagePricing: [PackagePricingSchema], // tarifs spécifiques aux colis
});

const PricingSchema = new mongoose.Schema(
  {
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    transportPrices: [TransportPriceSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pricing", PricingSchema);*/

const mongoose = require('mongoose');

// --- Sous-schema pour les dimensions / ranges ---
const DimensionRangeSchema = new mongoose.Schema(
  {
    minLength: Number,
    maxLength: Number,
    minWidth: Number,
    maxWidth: Number,
    minHeight: Number,
    maxHeight: Number,
    minWeight: Number,
    maxWeight: Number,
    minVolume: Number,
    maxVolume: Number,
    price: { type: Number, required: true },
    priority: { type: Number, default: 1 },
    description: String,
  },
  { _id: false }
);

// --- Package prédéfini ---
const PackagePricingSchema = new mongoose.Schema(
  {
    packageTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'PackageType', required: true },
    name: { type: String, required: true },
    basePrice: { type: Number, required: true },
    multipliers: {
      fragile: { type: Number, default: 1 },
      express: { type: Number, default: 1 },
      refrigerated: { type: Number, default: 1 },
    },
  },
  { _id: false }
);

// --- Container maritime prédéfini ---
const ContainerPricingSchema = new mongoose.Schema(
  {
    containerType: { type: String, required: true }, // ex: FCL 20ft, FCL 40ft, LCL
    basePrice: { type: Number, required: true }, // prix fixe
    cbmPrice: { type: Number, default: null }, // ✅ prix par CBM
    multipliers: {
      fragile: { type: Number, default: 1 },
      express: { type: Number, default: 1 },
      refrigerated: { type: Number, default: 1 },
    },
  },
  { _id: false }
);

// --- Conditions dynamiques ---
const ConditionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['fuel_surcharge', 'peak_season', 'customs_tax', 'insurance', 'other'],
      required: true,
    },
    value: Number,
    unit: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  },
  { _id: false }
);

const AddressDetailsSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false }
);

const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
  },
  { _id: false }
);

const GeoSchema = new mongoose.Schema(
  {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    provider: { type: String, trim: true },
    updatedAt: Date,
    capturedAt: Date,
  },
  { _id: false }
);

const WarehouseSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    instructions: { type: String, trim: true },
    copyHint: { type: String, trim: true },
    contact: ContactSchema,
    address: AddressDetailsSchema,
    geo: GeoSchema,
    openingHours: { type: String, trim: true },
    services: {
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
  },
  { _id: false }
);

const FeeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['per_km', 'flat'],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'XAF', trim: true },
    minAmount: Number,
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const CustomerAddressGuidelineSchema = new mongoose.Schema(
  {
    allowedCountries: {
      type: [String],
      default: undefined,
      set: (values) =>
        Array.from(
          new Set(
            (values || [])
              .map((value) => (typeof value === 'string' ? value.trim().toUpperCase() : ''))
              .filter(Boolean)
          )
        ),
    },
    requiredFields: {
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
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const LastMileOptionSchema = new mongoose.Schema(
  {
    allowWarehouseDropoff: { type: Boolean, default: true },
    allowWarehousePickup: { type: Boolean, default: true },
    allowHomePickup: { type: Boolean, default: false },
    allowHomeDelivery: { type: Boolean, default: false },
    gpsRequiredForHome: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

// --- Bloc transport spécifique ---
const TransportPricingSchema = new mongoose.Schema(
  {
    transportType: {
      type: String,
      required: true,
      enum: ['air', 'sea', 'road', 'rail', 'drone', 'camion', 'train'],
    },
    allowedUnits: {
      type: [String],
      enum: ['kg', 'm3'],
      default: ['kg'],
    },
    unitType: {
      type: String,
      enum: ['kg', 'm3'],
      required: true,
    },
    pricePerUnit: { type: Number, default: null }, // fallback simple
    dimensionRanges: [DimensionRangeSchema], // règles avancées
    packagePricing: [PackagePricingSchema], // colis standard air / route
    containerPricing: [ContainerPricingSchema], // containers maritimes
    conditions: [ConditionSchema],
  },
  { _id: false }
);

// --- Schéma principal Pricing ---
const PricingSchema = new mongoose.Schema(
  {
    origin: { type: String, required: true, trim: true },
    originAddressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },
    originLocation: GeoSchema,
    destination: { type: String, required: true, trim: true },
    destinationAddressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },
    destinationLocation: GeoSchema,
    transportLineId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportLine', default: null },
    expeditionLineId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpeditionLine', default: null },
    transportPrices: [TransportPricingSchema],
    originWarehouse: WarehouseSchema,
    destinationWarehouse: WarehouseSchema,
    pickupFee: FeeSchema,
    deliveryFee: FeeSchema,
    lastMileOptions: LastMileOptionSchema,
    customerAddressGuidelines: CustomerAddressGuidelineSchema,
    source: {
      type: String,
      enum: ['internal', 'cma-cgm', 'maersk', 'dhl'],
      default: 'internal',
    },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date },
  },
  {
    timestamps: true,
  }
);

PricingSchema.index({ transportLineId: 1 });

module.exports = mongoose.model('Pricing', PricingSchema);
