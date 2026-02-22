const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

countrySchema.virtual('isActive').get(function () {
  return this.active;
});

countrySchema.set('toJSON', { virtuals: true });
countrySchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Country || mongoose.model('Country', countrySchema);
