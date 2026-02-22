const {
  listApiKeys,
  getApiKeyById,
  createApiKey,
  updateApiKeyName,
  revokeApiKey,
} = require('../../services/diapayAdminClient');

exports.list = async (req, res) => {
  try {
    const includeRevoked = req.query.includeRevoked === 'true';
    const result = await listApiKeys({ includeRevoked });
    res.json(result);
  } catch (error) {
    console.error('Erreur listApiKeys', error);
    const status = error.status || 500;
    if (status >= 400 && status < 500) {
      return res
        .status(status)
        .json({ message: error.message || 'Erreur lors de la récupération des clés API' });
    }
    res.status(500).json({ message: 'Erreur lors de la récupération des clés API' });
  }
};

exports.detail = async (req, res) => {
  try {
    const apiKey = await getApiKeyById(req.params.keyId);
    if (!apiKey) {
      return res.status(404).json({ message: 'Clé API introuvable' });
    }
    res.json({ apiKey });
  } catch (error) {
    console.error('Erreur detailApiKey', error);
    if (error.status === 404) {
      return res.status(404).json({ message: 'Clé API introuvable' });
    }
    res.status(500).json({ message: 'Erreur lors de la récupération de la clé API' });
  }
};

exports.create = async (req, res) => {
  try {
    const { merchantId, name } = req.body;
    if (!merchantId || !name) {
      return res.status(400).json({ message: 'merchantId et name sont requis' });
    }
    const { apiKey } = await createApiKey({ merchantId, name });
    res.status(201).json({ apiKey });
  } catch (error) {
    console.error('Erreur createApiKey', error);
    const status = error.status || 500;
    if (status >= 400 && status < 500) {
      return res
        .status(status)
        .json({ message: error.message || 'Erreur lors de la création de la clé API' });
    }
    res.status(500).json({ message: 'Erreur lors de la création de la clé API' });
  }
};

exports.update = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'name est requis' });
    }
    const result = await updateApiKeyName(keyId, name);
    const updated = result?.apiKey || result;
    if (!updated) {
      return res.status(404).json({ message: 'Clé API introuvable' });
    }
    res.json({ apiKey: updated });
  } catch (error) {
    console.error('Erreur updateApiKey', error);
    if (error.status === 404) {
      return res.status(404).json({ message: 'Clé API introuvable' });
    }
    const status = error.status || 500;
    if (status >= 400 && status < 500) {
      return res
        .status(status)
        .json({ message: error.message || 'Erreur lors de la mise à jour de la clé API' });
    }
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la clé API' });
  }
};

exports.revoke = async (req, res) => {
  try {
    const { keyId } = req.params;
    const result = await revokeApiKey(keyId);
    const revoked = result?.apiKey || result;
    if (!revoked) {
      return res.status(404).json({ message: 'Clé API introuvable ou déjà révoquée' });
    }
    res.json({ apiKey: revoked });
  } catch (error) {
    console.error('Erreur revokeApiKey', error);
    if (error.status === 404) {
      return res.status(404).json({ message: 'Clé API introuvable ou déjà révoquée' });
    }
    const status = error.status || 500;
    if (status >= 400 && status < 500) {
      return res
        .status(status)
        .json({ message: error.message || 'Erreur lors de la révocation de la clé API' });
    }
    res.status(500).json({ message: 'Erreur lors de la révocation de la clé API' });
  }
};
