// 📁 backend/controllers/packageTypeController.js
const PackageType = require('../models/PackageType');


exports.getAllPackageTypes = async (req, res) => {
  try {
    const packageTypes = await PackageType.find().lean();
    // ⚠️ Ici on renvoie un objet { packageTypes }
    res.json({ packageTypes });
  } catch (err) {
    console.error('Erreur récupération des colis :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


// ➕ POST créer un nouveau type de colis
exports.createPackageType = async (req, res) => {
  try {
    const { name, description, allowedTransportTypes } = req.body;

    const newPackage = new PackageType({
      name,
      description,
      allowedTransportTypes: allowedTransportTypes || []
    });

    await newPackage.save();
    res.status(201).json({ message: 'Type de colis créé avec succès', packageType: newPackage });
  } catch (err) {
    console.error('Erreur création colis :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updatePackageType = async (req, res) => {
  try {
    const updated = await PackageType.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        description: req.body.description,
        allowedTransportTypes: req.body.allowedTransportTypes || []
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Type non trouvé' });
    res.json({ message: 'Type mis à jour', packageType: updated });
  } catch (err) {
    res.status(400).json({ message: 'Erreur: ' + err.message });
  }
};

exports.deletePackageType = async (req, res) => {
  try {
    await PackageType.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Type supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
