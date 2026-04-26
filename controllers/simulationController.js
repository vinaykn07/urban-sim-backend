// Simulation controller
const Simulation = require("../models/Simulation");
const Node = require("../models/Node");

// GET all simulations
exports.getAllSimulations = async (req, res) => {
  try {
    const simulations = await Simulation.find().sort({ createdAt: -1 });
    res.json({ success: true, count: simulations.length, data: simulations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET single simulation
exports.getSimulationById = async (req, res) => {
  try {
    const sim = await Simulation.findById(req.params.id);
    if (!sim) return res.status(404).json({ success: false, error: "Simulation not found" });
    res.json({ success: true, data: sim });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST create & start simulation
exports.createSimulation = async (req, res) => {
  try {
    const { scenarioName, triggerNode, failureIntensity } = req.body;

    // BFS cascade logic
    const allNodes = await Node.find();
    const nodeMap = {};
    allNodes.forEach(n => nodeMap[n.nodeId] = n);

    const affectedNodes = [];
    const cascadeLog = [];
    const queue = [triggerNode];
    const visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      affectedNodes.push(current);

      cascadeLog.push({
        nodeId: current,
        event: "failed",
        message: `${current} has failed due to cascading failure`,
        timestamp: new Date(),
      });

      // Find nodes that depend on current
      const dependents = allNodes.filter(n => n.dependencies.includes(current));
      dependents.forEach(dep => {
        if (!visited.has(dep.nodeId)) queue.push(dep.nodeId);
      });
    }

    const sim = await Simulation.create({
      scenarioName,
      triggerNode,
      failureIntensity: failureIntensity || "medium",
      status: "completed",
      affectedNodes,
      cascadeLog,
      metrics: {
        totalDowntime: affectedNodes.length * 8,
        responseDelay: affectedNodes.length * 3,
        recoveryTime: affectedNodes.length * 5,
        cascadeDepth: affectedNodes.length,
        resilienceScore: Math.max(0, 100 - affectedNodes.length * 12),
      },
    });

    res.status(201).json({ success: true, data: sim });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// DELETE simulation
exports.deleteSimulation = async (req, res) => {
  try {
    const sim = await Simulation.findByIdAndDelete(req.params.id);
    if (!sim) return res.status(404).json({ success: false, error: "Simulation not found" });
    res.json({ success: true, message: "Simulation deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET simulation metrics summary
exports.getMetricsSummary = async (req, res) => {
  try {
    const simulations = await Simulation.find({ status: "completed" });
    const total = simulations.length;
    const avgDowntime = simulations.reduce((a, b) => a + b.metrics.totalDowntime, 0) / (total || 1);
    const avgRecovery = simulations.reduce((a, b) => a + b.metrics.recoveryTime, 0) / (total || 1);
    const avgResilience = simulations.reduce((a, b) => a + b.metrics.resilienceScore, 0) / (total || 1);

    res.json({
      success: true,
      data: { total, avgDowntime, avgRecovery, avgResilience: Math.round(avgResilience) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};