const {
  listProviders,
  listProviderConfigs,
  createProviderConfig,
  updateProviderConfig,
  deleteProviderConfig,
  listProviderErrors,
} = require('../../services/diapayAdminClient');

exports.list = async (_req, res) => {
  try {
    const data = await listProviders();
    res.json(data);
  } catch (error) {
    console.error('Erreur listProviders', error);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Erreur lors de la récupération des providers' });
  }
};

exports.listConfigs = async (req, res) => {
  try {
    const data = await listProviderConfigs(req.query);
    res.json(data);
  } catch (error) {
    console.error('Erreur listProviderConfigs', error);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Erreur lors de la récupération des configurations provider' });
  }
};

exports.createConfig = async (req, res) => {
  try {
    const data = await createProviderConfig(req.body);
    res.status(201).json(data);
  } catch (error) {
    console.error('Erreur createProviderConfig', error);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Erreur lors de la création de la configuration provider' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const { configId } = req.params;
    const data = await updateProviderConfig(configId, req.body);
    res.json(data);
  } catch (error) {
    console.error('Erreur updateProviderConfig', error);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erreur lors de la mise à jour de la configuration provider" });
  }
};

exports.deleteConfig = async (req, res) => {
  try {
    const { configId } = req.params;
    const data = await deleteProviderConfig(configId);
    res.json(data);
  } catch (error) {
    console.error('Erreur deleteProviderConfig', error);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Erreur lors de la suppression de la configuration provider" });
  }
};

exports.listErrors = async (req, res) => {
  try {
    const data = await listProviderErrors(req.query);
    res.json(data);
  } catch (error) {
    console.error('Erreur listProviderErrors', error);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Erreur lors de la récupération des erreurs provider' });
  }
};
