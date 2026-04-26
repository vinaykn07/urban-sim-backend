// Simulation controller
const Simulation = require("../models/Simulation");
const Node = require("../models/Node");

// GET all simulations
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