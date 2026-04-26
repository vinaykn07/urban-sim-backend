// MitigationStrategy model
const mongoose = require("mongoose");

const MitigationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["backup_power", "traffic_rerouting", "emergency_prioritization"],
    required: true,
  },
  simulationId: { type: mongoose.Schema.Types.ObjectId, ref: "Simulation" },
  targetNodes: [{ type: String }],
  status: {
    type: String,
    enum: ["inactive", "active"],
    default: "inactive",
  },
  effectivenessScore: { type: Number, default: 0 }, // 0-100
  appliedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("MitigationStrategy", MitigationSchema);