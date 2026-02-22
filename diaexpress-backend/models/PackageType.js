// 📁 backend/models/PackageType.js
const mongoose = require('mongoose');

const packageTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  allowedTransportTypes: {
    type: [String],
    enum: ['air', 'sea', 'road', 'rail', 'drone', 'camion', 'train'],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PackageType', packageTypeSchema);
