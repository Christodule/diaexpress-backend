const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  type: { type: String, enum: ["invoice", "packing_list", "certificate", "customs"], required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const ReservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["FCL", "LCL"], required: true }, // FCL = conteneur complet, LCL = groupage
  containerSize: { type: String, enum: ["20FT", "40FT", "40HC"], required: false },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departureDate: { type: Date, required: true },
  arrivalDate: { type: Date },
  provider: { type: String, enum: ["CMA_CGM", "INTERNAL"], required: true },
  status: { type: String, enum: ["pending", "confirmed", "in_transit", "delivered"], default: "pending" },
  trackingNumber: { type: String },
  documents: [DocumentSchema]
}, { timestamps: true });

module.exports = mongoose.model("Reservation", ReservationSchema);
