// Simulation model
const mongoose = require("mongoose");

const SimulationSchema = new mongoose.Schema({
  scenarioName: { type: String, required: true },
  triggerNode: { type: String, required: true },
  failureIntensity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  status: {
    type: String,
    enum: ["pending", "running", "completed", "stopped"],
    default: "pending",
  },
  affectedNodes: [{ type: String }],
  cascadeLog: [
    {
      timestamp: { type: Date, default: Date.now },
      nodeId: String,
      event: String, // "failed", "degraded", "restored"
      message: String,
    },
  ],
  metrics: {
    totalDowntime: { type: Number, default: 0 },
    responseDelay: { type: Number, default: 0 },
    recoveryTime: { type: Number, default: 0 },
    cascadeDepth: { type: Number, default: 0 },
    resilienceScore: { type: Number, default: 0 },
  },
  mitigationsApplied: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model("Simulation", SimulationSchema);