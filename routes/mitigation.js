// Mitigation routes
const express = require("express");
const router = express.Router();
const {
  getAllStrategies, applyStrategy, deactivateStrategy
} = require("../controllers/mitigationController");

router.get("/", getAllStrategies);
router.post("/", applyStrategy);
router.patch("/:id/deactivate", deactivateStrategy);

module.exports = router;