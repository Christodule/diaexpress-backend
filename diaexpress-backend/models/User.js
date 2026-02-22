const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    clerkUserId: { type: String, sparse: true, default: null },
    externalId: { type: String, sparse: true, default: null },
    email: { type: String, unique: true, sparse: true, trim: true, lowercase: true, default: null },
    role: { type: String, enum: ['client', 'admin', 'delivery'], default: 'client' },
    name: { type: String, default: null, trim: true },
    username: {
      type: String,
      unique: true,
      sparse: true, // ✅ évite les erreurs si null
      default: null,
      trim: true,
    },
    phone: { type: String, default: null, trim: true },
    company: {
      name: { type: String, default: null, trim: true },
      jobTitle: { type: String, default: null, trim: true },
    },
    address: {
      line1: { type: String, default: null, trim: true },
      line2: { type: String, default: null, trim: true },
      city: { type: String, default: null, trim: true },
      state: { type: String, default: null, trim: true },
      postalCode: { type: String, default: null, trim: true },
      country: { type: String, default: null, trim: true },
    },
    preferences: {
      language: { type: String, default: 'fr', trim: true },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: false },
      },
      channels: {
        type: [String],
        default: ['email'],
        set: (channels) => Array.from(new Set((channels || []).map((c) => String(c).trim()))),
      },
    },
    fullName: { type: String, default: null, trim: true },
    firstName: { type: String, default: null, trim: true },
    lastName: { type: String, default: null, trim: true },
    avatarUrl: { type: String, default: null, trim: true },
    timezone: { type: String, default: null, trim: true },
    lastSyncedAt: { type: Date, default: null },
    notes: { type: String, default: null, trim: true },
  },
  {
    timestamps: true,
  }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

userSchema.set('toObject', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
