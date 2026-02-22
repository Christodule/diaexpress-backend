const User = require('../../models/User');

function buildSearchFilter(search) {
  if (!search) return null;
  const regex = new RegExp(search, 'i');
  return {
    $or: [{ email: regex }, { username: regex }],
  };
}

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 25, role, search } = req.query;
    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);

    const filters = {};
    if (role) filters.role = role;
    const searchFilter = buildSearchFilter(search);
    if (searchFilter) Object.assign(filters, searchFilter);

    const [users, total] = await Promise.all([
      User.find(filters)
        .sort({ createdAt: -1 })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      User.countDocuments(filters),
    ]);

    res.json({
      data: users,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error('Erreur listUsers', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
};

exports.detail = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ user });
  } catch (error) {
    console.error('Erreur detailUser', error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur" });
  }
};

exports.create = async (req, res) => {
  try {
    const { email, role = 'client', username, externalId, clerkUserId } = req.body;
    const normalisedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalisedEmail) {
      return res.status(400).json({ message: 'email est requis' });
    }
    const existing = await User.findOne({ email: normalisedEmail });
    if (existing) {
      return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }
    const payload = { email: normalisedEmail, role, username };
    const resolvedClerkId = clerkUserId || externalId;
    if (resolvedClerkId) {
      payload.clerkUserId = resolvedClerkId;
      payload.externalId = resolvedClerkId;
    }

    const user = await User.create(payload);
    res.status(201).json({ user });
  } catch (error) {
    console.error('Erreur createUser', error);
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur" });
  }
};

exports.update = async (req, res) => {
  try {
    const { role, username } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (username !== undefined) updates.username = username;

    const user = await User.findByIdAndUpdate(req.params.userId, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Erreur updateUser', error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.userId);
    if (!deleted) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteUser', error);
    res.status(500).json({ message: "Erreur lors de la suppression de l'utilisateur" });
  }
};
