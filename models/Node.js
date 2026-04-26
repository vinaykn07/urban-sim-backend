// Node 
const mongoose = require("mongoose");

const NodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["power", "transportation", "water", "healthcare", "telecom", "emergency"],
    required: true,
  },
  status: {
    type: String,
    enum: ["operational", "degraded", "failed"],
    default: "operational",
  },
  resilienceWeight: { type: Number, min: 0, max: 1, default: 0.8 },
  recoveryTime: { type: Number, default: 10 }, // in minutes
  dependencies: [{ type: String }], // array of nodeIds this node depends on
}, { timestamps: true });

module.exports = mongoose.model("Node", NodeSchema);