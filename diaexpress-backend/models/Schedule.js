const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  transportType: { type: String, required: true, enum: [ "sea"] },
  periodLabel: { type: String, required: true },
  departureDate: { type: Date, required: true },
  closingDate: { type: Date, required: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Schedule", ScheduleSchema);
