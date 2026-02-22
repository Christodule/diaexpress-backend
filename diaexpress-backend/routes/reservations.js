const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const { requireAuth, requireRole } = require("../middleware/auth");
const syncUser = require("../middleware/syncUser");

// 🔹 Client
router.post("/", requireAuth, syncUser, reservationController.createReservation);
router.get("/me", requireAuth, syncUser, reservationController.getMyReservations);

// 🔹 Admin
router.get("/", requireAuth, requireRole("admin"), reservationController.getAllReservations);
router.patch("/:id/status", requireAuth, requireRole("admin"), reservationController.updateStatus);

// 🔹 Documents (client peut uploader ses docs)
router.post("/:id/documents", requireAuth, syncUser, reservationController.uploadDocument);

module.exports = router;
