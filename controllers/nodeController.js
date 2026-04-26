// Node controller
const Node = require("../models/Node");

// GET all nodes
exports.getAllNodes = async (req, res) => {
  try {
    const nodes = await Node.find();
    res.json({ success: true, count: nodes.length, data: nodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET single node
exports.getNodeById = async (req, res) => {
  try {
    const node = await Node.findOne({ nodeId: req.params.nodeId });
    if (!node) return res.status(404).json({ success: false, error: "Node not found" });
    res.json({ success: true, data: node });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST create node
exports.createNode = async (req, res) => {
  try {
    const node = await Node.create(req.body);
    res.status(201).json({ success: true, data: node });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// PUT update node
exports.updateNode = async (req, res) => {
  try {
    const node = await Node.findOneAndUpdate(
      { nodeId: req.params.nodeId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!node) return res.status(404).json({ success: false, error: "Node not found" });
    res.json({ success: true, data: node });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// DELETE node
exports.deleteNode = async (req, res) => {
  try {
    const node = await Node.findOneAndDelete({ nodeId: req.params.nodeId });
    if (!node) return res.status(404).json({ success: false, error: "Node not found" });
    res.json({ success: true, message: "Node deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PATCH update node status (operational/degraded/failed)
exports.updateNodeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const node = await Node.findOneAndUpdate(
      { nodeId: req.params.nodeId },
      { status },
      { new: true }
    );
    if (!node) return res.status(404).json({ success: false, error: "Node not found" });
    res.json({ success: true, data: node });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};