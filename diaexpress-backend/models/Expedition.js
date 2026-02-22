const mongoose = require('mongoose');

const expeditionSchema = new mongoose.Schema(
  {
    quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
    transportLineId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportLine', required: true },
    plannedDepartureDate: { type: Date },
    plannedArrivalDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    voyageCode: { type: String },
    notes: { type: String },
    shipments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Expedition || mongoose.model('Expedition', expeditionSchema);
