const MitigationStrategy = require("../models/MitigationStrategy");
const Simulation = require("../models/Simulation");
const Node = require("../models/Node");

// GET all strategies
exports.getAllStrategies = async (req, res) => {
  try {
    const strategies = await MitigationStrategy.find().sort({ createdAt: -1 });
    res.json({ success: true, data: strategies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST apply a mitigation strategy
exports.applyStrategy = async (req, res) => {
  try {
    const { type, simulationId, targetNodes } = req.body;
    const io = req.app.get("io");

    const effectivenessMap = {
      backup_power: 85,
      traffic_rerouting: 72,
      emergency_prioritization: 78,
    };

    const strategy = await MitigationStrategy.create({
      type,
      simulationId,
      targetNodes,
      status: "active",
      effectivenessScore: effectivenessMap[type] || 70,
      appliedAt: new Date(),
    });

    if (simulationId) {
      await Simulation.findByIdAndUpdate(simulationId, {
        $push: { mitigationsApplied: type },
      });
    }

    // Restore target nodes to operational
    if (targetNodes && targetNodes.length > 0) {
      await Node.updateMany(
        { nodeId: { $in: targetNodes } },
        { status: "operational" }
      );

      targetNodes.forEach((nodeId) => {
        io.emit("node_status_changed", {
          nodeId,
          status: "operational",
        });
      });
    }

    // Emit mitigation applied
    io.emit("mitigation_applied", {
      type,
      targetNodes,
      effectivenessScore: effectivenessMap[type] || 70,
      timestamp: new Date(),
    });

    res.status(201).json({ success: true, data: strategy });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// PATCH deactivate strategy
exports.deactivateStrategy = async (req, res) => {
  try {
    const strategy = await MitigationStrategy.findByIdAndUpdate(
      req.params.id,
      { status: "inactive" },
      { new: true }
    );
    if (!strategy) return res.status(404).json({ success: false, error: "Strategy not found" });
    res.json({ success: true, data: strategy });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};