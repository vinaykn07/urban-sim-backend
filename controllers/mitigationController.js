// Mitigation controller
const MitigationStrategy = require("../models/MitigationStrategy");
const Simulation = require("../models/Simulation");

// GET all strategies
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

      // Emit node restored for each target
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