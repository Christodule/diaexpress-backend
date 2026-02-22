const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  // 📋 Produit
  productType: { type: String },
  productLocation: { type: String },
  contactPhone: { type: String },
  photoUrl: { type: String },
  pickupOption: { type: String, enum: ['pickup', 'dropoff'], default: 'pickup' },
  senderAddressId: { type: String },
  recipientAddressId: { type: String },
  billingAddressId: { type: String },
  recipientContactName: { type: String },
  recipientContactPhone: { type: String },
  recipientContactEmail: { type: String },

  // 🌍 Infos transport
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  transportType: {
    type: String,
    enum: ['air', 'sea', 'road'],
    required: true,
  },
  transportLineId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportLine' },

  provider: { type: String, default: 'internal' },

  // 🔹 Statut du devis
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'dispatched'],
    default: 'pending',
  },
  rejectionReason: { type: String },
  notes: { type: String },

  // 💰 Prix
  estimatedPrice: { type: Number },
  finalPrice: { type: Number },
  currency: { type: String, default: 'USD' },
  estimationMethod: { type: String },
  matchedPricingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pricing' },
  pricingAppliedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pricing' },
  pricingBreakdown: { type: mongoose.Schema.Types.Mixed },

  // 🔹 Paiement
  paymentMethod: { type: String, enum: ['crypto', 'fiat'], default: null },
  paymentStatus: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  transactionHash: { type: String },
  paymentDate: { type: Date },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

  // 🔹 Livraison & tracking
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  trackingNumber: { type: String },
  carrier: { type: String, enum: ['CMA CGM', 'DHL', 'UPS', 'Internal', 'FedEx', 'DiaExpress'], default: 'Internal' },
  deliveryStatus: {
    type: String,
    enum: ['not_assigned', 'assigned', 'dispatched', 'in_transit', 'delivered'],
    default: 'not_assigned',
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  deliveredAt: { type: Date },

  // 📦 Colis
  unitType: { type: String, enum: ['kg', 'm3'] },
  quantity: { type: Number },
  packageTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'PackageType' },

  // Dimensions
  length: Number,
  width: Number,
  height: Number,
  weight: Number,
  volume: Number,

  // 👤 Utilisateur
  userEmail: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestedBy: { type: String },
  requestedByType: { type: String, default: 'user' },
  requestedByLabel: { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.models.Quote || mongoose.model('Quote', quoteSchema);
