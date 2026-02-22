/*const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  status: String,
  date: { type: Date, default: Date.now }
}, { _id: false });

const ShipmentSchema = new mongoose.Schema({
  // 🔐 Identifiants utilisateurs
  userClerkId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // 🔄 Devis lié
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true },

  // 🌍 Infos de transport
  origin: String,
  destination: String,
  transportType: String,

  // 📦 Colis
  length: Number,
  width: Number,
  height: Number,
  weight: Number,
  volume: Number,

  packageTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'PackageType' },

  // 💰 Estimation
  estimatedPrice: Number,
  estimationMethod: String,

  // 🔄 Suivi
  status: { type: String, default: 'pending' },
  events: [EventSchema],
  trackingCode: { type: String, unique: true },

  // 👤 Destinataire
  receiverName: String,
  receiverPhone: String,
  deliveryAddress: String,

  // 📋 Produit
  productType: String,
  productLocation: String,
  contactPhone: String,
  photoUrl: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Shipment', ShipmentSchema);
*/
// backend/models/Shipment.js
const mongoose = require('mongoose');

const ShipmentHistorySchema = new mongoose.Schema({
  location: String,
  status: {
    type: String,
    enum: [
      'pending',
      'booked',
      'dispatched',
      'in_transit',
      'arrived',
      'delivered',
      'cancelled'
    ],
  },
  note: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ShipmentSchema = new mongoose.Schema({
  // 🔗 Liens
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  principalId: { type: String, index: true },
  principalLabel: { type: String },

  // 🚚 Transporteur
  provider: { type: String, default: 'internal' }, // ex: 'internal', 'cma-cgm', 'dhl'
  carrier: { type: String }, // nom affiché du transporteur (si différent)
  bookingReference: { type: String },
  serviceType: { type: String },

  // 📦 Suivi
  trackingCode: { type: String, unique: true, required: true },
  status: {
    type: String,
    enum: [
      'pending',
      'booked',
      'dispatched',
      'in_transit',
      'arrived',
      'delivered',
      'cancelled'
    ],
    default: 'pending'
  },
  currentLocation: { type: String },
  estimatedDelivery: { type: Date },

  // 📐 Dimensions
  weight: Number,
  volume: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },

  // 📜 Historique / timeline
  trackingUpdates: { type: [ShipmentHistorySchema], default: [] },

  // 🔹 Metadata libre (étiquettes, données spécifiques)
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  embarkmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Embarkment', default: null },
}, {
  timestamps: true
});

module.exports = mongoose.models.Shipment || mongoose.model('Shipment', ShipmentSchema);
