// 📁 backend/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // destinataire
  type: {
    type: String,
    enum: ['quote', 'shipment', 'payment', 'system', 'message'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedEntity: {
    entityType: { type: String, enum: ['Quote', 'Shipment', 'Payment', 'Pricing', 'Message'] },
    entityId: { type: mongoose.Schema.Types.ObjectId }
  },
  read: { type: Boolean, default: false },
  deliveryChannels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  metadata: { type: mongoose.Schema.Types.Mixed } // flexible (ex: lien tracking, URL CMA CGM…)
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
