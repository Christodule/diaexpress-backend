
const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const adminQuoteController = require('../controllers/adminQuoteController');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');



// Public - Créer un devis (auth optionnelle)
router.post("/", optionalAuth, quoteController.createQuote);

// Admin - liste complète (alias de /all pour compatibilité API partagée)
router.get("/", requireAuth, requireRole("admin"), quoteController.getAllQuotes);

// Estimation rapide
router.post("/estimateQuote", quoteController.estimateQuote);

// Alias pour compatibilité avec l'app logistique
router.post("/estimate", quoteController.estimateQuote);

router.get("/all", requireAuth, requireRole("admin"), quoteController.getAllQuotes);
// Infos meta
router.get("/meta", quoteController.getQuoteMeta);

// Utilisateur connecté → ses devis
router.get("/me", requireAuth, quoteController.getUserQuotes);

// Récupération détaillée (admin ou propriétaire)
router.get("/:id", requireAuth, quoteController.getQuoteById);

// ✅ Actions admin
router.post("/:quoteId/confirm", requireAuth, requireRole("admin"), quoteController.confirmQuote);
router.post("/:quoteId/reject", requireAuth, requireRole("admin"), quoteController.rejectQuote);
router.post("/:quoteId/dispatch", requireAuth, requireRole("admin"), quoteController.dispatchQuote);

// Supprimer un devis
router.delete("/:id", requireAuth, requireRole("admin"), quoteController.deleteQuote);

// 🔹 Mise à jour du statut d’un devis (admin)
router.patch("/:id/status", requireAuth, requireRole("admin"), quoteController.updateQuoteStatus);

// 🔹 Mise à jour des détails d’un devis (admin, compat API legacy)
router.patch("/:id", requireAuth, requireRole("admin"), adminQuoteController.updateByAdmin);

// 🔹 Paiement d’un devis (client)
router.post("/:id/pay", requireAuth, quoteController.payQuote);

module.exports = router;
