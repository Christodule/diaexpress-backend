/*const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', pricingController.getAllPricings);
router.get('/locations', pricingController.getDistinctLocations); 


router.post('/', requireAuth, requireRole('admin'), pricingController.createPricing);
router.put('/:id', requireAuth, requireRole('admin'), pricingController.updatePricing);
router.delete('/:id', requireAuth, requireRole('admin'), pricingController.deletePricing);

module.exports = router;
*/
// backend/routes/pricing.js
const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');
const { requireAuth, requireRole } = require('../middleware/auth'); // ton middleware role admin
const Pricing = require("../models/Pricing");


// Récupérer toutes les routes publiques (couples origin + destination existants)
router.get('/public/routes', async (req, res) => {
  try {
    const pricings = await Pricing.find();
    const routes = pricings.map(p => ({
      origin: p.origin,
      destination: p.destination
    }));
    res.json(routes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Route publique pour couples origine/destination existants
router.get("/routes", async (req, res) => {
  try {
    const pricing = await Pricing.find({}, "origin destination transportType");

    const routes = pricing.map((p) => ({
      origin: p.origin,
      destination: p.destination,
      transportType: p.transportType,
    }));

    res.json({ routes });
  } catch (err) {
    console.error("Erreur récupération routes:", err);
    res.status(500).json({ message: "Erreur récupération des routes" });
  }
});
// Route publique pour origines/destinations
router.get("/locations", async (req, res) => {
  try {
    const pricing = await Pricing.find({}, "origin destination transportType");

    // transformer en sets uniques
    const origins = [...new Set(pricing.map((p) => p.origin))];
    const destinations = [...new Set(pricing.map((p) => p.destination))];

    res.json({ origins, destinations });
  } catch (err) {
    res.status(500).json({ message: "Erreur récupération locations" });
  }
});

router.get('/warehouses', pricingController.getWarehouses);
router.get('/meta', requireAuth, requireRole('admin'), pricingController.getPricingMeta);
// ✅ Récupérer toutes les grilles de prix
router.get('/', requireAuth, requireRole('admin'), pricingController.getAllPricing);

// ✅ Récupérer une grille de prix par ID
router.get('/:id', requireAuth, requireRole('admin'), pricingController.getPricingById);

// ✅ Créer une nouvelle grille de prix
router.post('/', requireAuth, requireRole('admin'), pricingController.createPricing);

// ✅ Mettre à jour une grille de prix existante
router.put('/:id', requireAuth, requireRole('admin'), pricingController.updatePricing);

// ✅ Supprimer une grille de prix
router.delete('/:id', requireAuth, requireRole('admin'), pricingController.deletePricing);

module.exports = router;
