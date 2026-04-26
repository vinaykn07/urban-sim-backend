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

// GET single simulation by ID
exports.getSimulationById = async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({ success: false, error: "Simulation not found" });
    }
    res.json({ success: true, data: simulation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE simulation by ID
exports.deleteSimulation = async (req, res) => {
  try {
    const simulation = await Simulation.findByIdAndDelete(req.params.id);
    if (!simulation) {
      return res.status(404).json({ success: false, error: "Simulation not found" });
    }
    res.json({ success: true, message: "Simulation deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET aggregated metrics summary across all completed simulations
exports.getMetricsSummary = async (req, res) => {
  try {
    const simulations = await Simulation.find({ status: "completed" });
    const total = simulations.length;

    if (total === 0) {
      return res.json({
        success: true,
        data: {
          totalSimulations: 0,
          averageResilienceScore: 0,
          averageCascadeDepth: 0,
          averageTotalDowntime: 0,
          averageRecoveryTime: 0,
          averageResponseDelay: 0,
        },
      });
    }

    const sum = simulations.reduce(
      (acc, sim) => {
        acc.resilienceScore += sim.metrics.resilienceScore || 0;
        acc.cascadeDepth += sim.metrics.cascadeDepth || 0;
        acc.totalDowntime += sim.metrics.totalDowntime || 0;
        acc.recoveryTime += sim.metrics.recoveryTime || 0;
        acc.responseDelay += sim.metrics.responseDelay || 0;
        return acc;
      },
      { resilienceScore: 0, cascadeDepth: 0, totalDowntime: 0, recoveryTime: 0, responseDelay: 0 }
    );

    res.json({
      success: true,
      data: {
        totalSimulations: total,
        averageResilienceScore: parseFloat((sum.resilienceScore / total).toFixed(2)),
        averageCascadeDepth: parseFloat((sum.cascadeDepth / total).toFixed(2)),
        averageTotalDowntime: parseFloat((sum.totalDowntime / total).toFixed(2)),
        averageRecoveryTime: parseFloat((sum.recoveryTime / total).toFixed(2)),
        averageResponseDelay: parseFloat((sum.responseDelay / total).toFixed(2)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST create simulation
exports.createSimulation = async (req, res) => {
  try {
    const { scenarioName, triggerNode, failureIntensity } = req.body;
    const io = req.app.get("io");

    const allNodes = await Node.find();
    const affectedNodes = [];
    const cascadeLog = [];
    const queue = [triggerNode];
    const visited = new Set();

    // Create simulation as "running"
    const sim = await Simulation.create({
      scenarioName,
      triggerNode,
      failureIntensity: failureIntensity || "medium",
      status: "running",
      affectedNodes: [],
      cascadeLog: [],
      metrics: {},
    });

    // Emit simulation started
    io.emit("simulation_started", {
      simulationId: sim._id,
      scenarioName,
      triggerNode,
      timestamp: new Date(),
    });

    // BFS with real-time emit per step
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      affectedNodes.push(current);

      const logEntry = {
        nodeId: current,
        event: "failed",
        message: `${current} has failed due to cascading failure`,
        timestamp: new Date(),
      };
      cascadeLog.push(logEntry);

      // Emit each failure in real time
      io.emit("node_failed", {
        simulationId: sim._id,
        ...logEntry,
      });

      // Update node status in DB
      await Node.findOneAndUpdate(
        { nodeId: current },
        { status: "failed" }
      );

      // Emit node status change
      io.emit("node_status_changed", {
        nodeId: current,
        status: "failed",
      });

      await delay(1000); // 1 second between each cascade step

      const dependents = allNodes.filter(
        (n) => n.dependencies.includes(current)
      );
      dependents.forEach((dep) => {
        if (!visited.has(dep.nodeId)) queue.push(dep.nodeId);
      });
    }

    // Calculate metrics
    const metrics = {
      totalDowntime: affectedNodes.length * 8,
      responseDelay: affectedNodes.length * 3,
      recoveryTime: affectedNodes.length * 5,
      cascadeDepth: affectedNodes.length,
      resilienceScore: Math.max(0, 100 - affectedNodes.length * 12),
    };

    // Update simulation as completed
    await Simulation.findByIdAndUpdate(sim._id, {
      status: "completed",
      affectedNodes,
      cascadeLog,
      metrics,
    });

    // Emit simulation completed
    io.emit("simulation_completed", {
      simulationId: sim._id,
      affectedNodes,
      metrics,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      data: { ...sim.toObject(), affectedNodes, cascadeLog, metrics },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};