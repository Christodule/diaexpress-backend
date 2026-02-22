// 📁 backend/models/ExternalPricing.js
const mongoose = require('mongoose');

const externalPricingSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  transportType: {
    type: String,
    enum: ['air', 'sea', 'road', 'rail', 'drone', 'camion', 'train'],
    required: true
  },
  containerType: { type: String }, // exemple: '20FT', '40FT'
  price: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
  source: { type: String, default: 'cma-cgm' },
  meta: { type: Object },
}, {
  timestamps: true
});

module.exports = mongoose.model('ExternalPricing', externalPricingSchema);
