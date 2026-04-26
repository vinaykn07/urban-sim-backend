// Entry point for the backend server
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

const app = express();
connectDB();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/nodes", require("./routes/nodes"));
app.use("/api/simulations", require("./routes/simulations"));
app.use("/api/mitigation", require("./routes/mitigation"));

// Health check
app.get("/", (req, res) => res.json({ status: "Urban Simulator API running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));