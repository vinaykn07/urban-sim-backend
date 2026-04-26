// Simulations routes
const express = require("express");
const router = express.Router();
const {
  getAllSimulations, getSimulationById,
  createSimulation, deleteSimulation, getMetricsSummary
} = require("../controllers/simulationController");

router.get("/", getAllSimulations);
router.get("/metrics/summary", getMetricsSummary);
router.get("/:id", getSimulationById);
router.post("/", createSimulation);
router.delete("/:id", deleteSimulation);

module.exports = router;