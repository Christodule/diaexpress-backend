// 📁 routes/user.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const syncUser = require('../middleware/syncUser');

const toNullOrTrimmed = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toBoolean = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (['true', '1', 'yes', 'on'].includes(value.toLowerCase())) return true;
    if (['false', '0', 'no', 'off'].includes(value.toLowerCase())) return false;
  }
  return undefined;
};

const sanitizeUserUpdate = (payload = {}) => {
  const updates = {};

  const phone = toNullOrTrimmed(payload.phone);
  if (phone !== undefined) updates.phone = phone;

  if (payload.fullName !== undefined) updates.fullName = toNullOrTrimmed(payload.fullName);
  if (payload.firstName !== undefined) updates.firstName = toNullOrTrimmed(payload.firstName);
  if (payload.lastName !== undefined) updates.lastName = toNullOrTrimmed(payload.lastName);
  if (payload.avatarUrl !== undefined) updates.avatarUrl = toNullOrTrimmed(payload.avatarUrl);
  if (payload.timezone !== undefined) updates.timezone = toNullOrTrimmed(payload.timezone);
  if (payload.notes !== undefined) updates.notes = toNullOrTrimmed(payload.notes);

  if (payload.company && typeof payload.company === 'object') {
    ['name', 'jobTitle'].forEach((key) => {
      if (payload.company[key] !== undefined) {
        updates[`company.${key}`] = toNullOrTrimmed(payload.company[key]);
      }
    });
  }

  if (payload.address && typeof payload.address === 'object') {
    ['line1', 'line2', 'city', 'state', 'postalCode', 'country'].forEach((key) => {
      if (payload.address[key] !== undefined) {
        updates[`address.${key}`] = toNullOrTrimmed(payload.address[key]);
      }
    });
  }

  if (payload.preferences && typeof payload.preferences === 'object') {
    if (payload.preferences.language !== undefined) {
      updates['preferences.language'] = toNullOrTrimmed(payload.preferences.language) || 'fr';
    }

    if (payload.preferences.notifications && typeof payload.preferences.notifications === 'object') {
      ['email', 'sms', 'push'].forEach((key) => {
        if (payload.preferences.notifications[key] !== undefined) {
          const boolValue = toBoolean(payload.preferences.notifications[key]);
          if (boolValue !== undefined) {
            updates[`preferences.notifications.${key}`] = boolValue;
          }
        }
      });
    }

    if (payload.preferences.channels !== undefined) {
      const channels = Array.isArray(payload.preferences.channels)
        ? payload.preferences.channels
        : [payload.preferences.channels];

      const cleanedChannels = Array.from(
        new Set(
          channels
            .map((channel) => (typeof channel === 'string' ? channel.trim() : ''))
            .filter((channel) => channel.length)
        )
      );

      updates['preferences.channels'] = cleanedChannels;
    }
  }

  return Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
};

router.get('/me', requireAuth, syncUser, async (req, res) => {
  const user = req.dbUser.toObject();
  const identity = req.identity || req.auth || null;

  res.json({
    ...user,
    user,
    identity,
  });
});

const updateHandler = async (req, res) => {
  const sanitizedUpdates = sanitizeUserUpdate(req.body);

  if (!Object.keys(sanitizedUpdates).length) {
    return res.status(400).json({ message: 'Aucune donnée valide fournie' });
  }

  Object.entries(sanitizedUpdates).forEach(([path, value]) => {
    req.dbUser.set(path, value);
  });

  await req.dbUser.save();
  const updatedUser = req.dbUser.toObject();

  res.json(updatedUser);
};

router.put('/me', requireAuth, syncUser, updateHandler);
router.patch('/me', requireAuth, syncUser, updateHandler);

module.exports = router;
