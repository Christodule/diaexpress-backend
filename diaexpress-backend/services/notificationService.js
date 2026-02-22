// Simple wrapper pour créer/ marquer lu / envoyer plus tard via mail/sms
const Notification = require('../models/Notification');

exports.push = async ({ userId, type, title, message, entity = {}, channels = {}, metadata = {} }) => {
  const notif = await Notification.create({
    user: userId,
    type,
    title,
    message,
    relatedEntity: {
      entityType: entity.entityType,
      entityId: entity.entityId || null
    },
    deliveryChannels: {
      inApp: channels.inApp ?? true,
      email: channels.email ?? false,
      sms: channels.sms ?? false,
      push: channels.push ?? false
    },
    metadata
  });
  // TODO: brancher mailer/SMS/push ici si channels.* = true
  return notif;
};

exports.markAsRead = async (id, userId) => {
  return Notification.findOneAndUpdate({ _id: id, user: userId }, { read: true }, { new: true });
};

exports.listForUser = async (userId, limit = 50) => {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(limit);
};
