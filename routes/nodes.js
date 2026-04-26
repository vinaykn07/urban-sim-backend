// Nodes routes
const express = require("express");
const router = express.Router();
const {
  getAllNodes, getNodeById, createNode,
  updateNode, deleteNode, updateNodeStatus
} = require("../controllers/nodeController");

router.get("/", getAllNodes);
router.get("/:nodeId", getNodeById);
router.post("/", createNode);
router.put("/:nodeId", updateNode);
router.delete("/:nodeId", deleteNode);
router.patch("/:nodeId/status", updateNodeStatus);

module.exports = router;