require("dotenv").config();
const mongoose = require("mongoose");
const Node = require("./models/Node");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");
};

const seedNodes = [
  {
    nodeId: "PG-01",
    name: "Main Power Substation",
    type: "power",
    status: "operational",
    resilienceWeight: 0.85,
    recoveryTime: 20,
    dependencies: [],
  },
  {
    nodeId: "TN-01",
    name: "Central Transport Hub",
    type: "transportation",
    status: "operational",
    resilienceWeight: 0.75,
    recoveryTime: 15,
    dependencies: ["PG-01"],
  },
  {
    nodeId: "WS-01",
    name: "Water Treatment Plant",
    type: "water",
    status: "operational",
    resilienceWeight: 0.90,
    recoveryTime: 25,
    dependencies: ["PG-01"],
  },
  {
    nodeId: "HC-01",
    name: "City Hospital Network",
    type: "healthcare",
    status: "operational",
    resilienceWeight: 0.95,
    recoveryTime: 10,
    dependencies: ["PG-01", "TC-01"],
  },
  {
    nodeId: "TC-01",
    name: "Telecom Central Node",
    type: "telecom",
    status: "operational",
    resilienceWeight: 0.80,
    recoveryTime: 12,
    dependencies: ["PG-01"],
  },
  {
    nodeId: "ER-01",
    name: "Emergency Response Center",
    type: "emergency",
    status: "operational",
    resilienceWeight: 0.92,
    recoveryTime: 8,
    dependencies: ["PG-01", "TC-01", "TN-01"],
  },
];

const seed = async () => {
  try {
    await connectDB();
    await Node.deleteMany();
    console.log("🗑️  Cleared existing nodes");
    await Node.insertMany(seedNodes);
    console.log("✅ Seeded 6 infrastructure nodes successfully");
    console.log("\n📋 Nodes created:");
    seedNodes.forEach(n => console.log(`  - [${n.nodeId}] ${n.name} (${n.type})`));
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
};

seed();