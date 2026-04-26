require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

connectDB();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
}));

// Handle preflight requests
app.options("*", cors());
app.use(express.json());
app.use(morgan("dev"));

// Make io accessible in controllers
app.set("io", io);

// Routes
app.use("/api/nodes", require("./routes/nodes"));
app.use("/api/simulations", require("./routes/simulations"));
app.use("/api/mitigation", require("./routes/mitigation"));

// Health check
app.get("/", (req, res) => res.json({ status: "Urban Simulator API running" }));

// WebSocket events
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  // Client can join a simulation room
  socket.on("join_simulation", (simulationId) => {
    socket.join(simulationId);
    console.log(`👥 Client joined simulation: ${simulationId}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));