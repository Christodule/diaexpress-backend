// backend/controllers/scheduleController.js
const Schedule = require("../models/Schedule");

exports.createSchedule = async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    await schedule.save();
    res.status(201).json(schedule);
  } catch (error) {
    console.error("Erreur création schedule:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getSchedules = async (req, res) => {
  try {
    const { origin, destination } = req.query;
    let query = {};
    if (origin && destination) query = { origin, destination };

    const schedules = await Schedule.find(query).sort({ departureDate: 1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: "Erreur récupération schedules", error: err.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: "Schedule supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur suppression schedule", error: err.message });
  }
};
