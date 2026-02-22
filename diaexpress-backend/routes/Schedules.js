// backend/routes/scheduleRoutes.js
const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const { requireAuth, requireRole } = require("../middleware/auth");
const Schedule = require("../models/Schedule");

// Admin → gérer les schedules
router.post("/", requireAuth, requireRole("admin"), scheduleController.createSchedule);
router.delete("/:id", requireAuth, requireRole("admin"), scheduleController.deleteSchedule);

// Public → voir les schedules disponibles
router.get("/", scheduleController.getSchedules);
// Récupérer toutes les périodes d’embarquement (publiques)
router.get('/public', async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


module.exports = router;
