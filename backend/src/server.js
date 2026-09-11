/**
 * Server Entry Point
 */

require("dotenv").config();
const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log("\n=======================================================");
  console.log(" ☕ YORU (夜) — Smart Café Backend REST API Active");
  console.log("=======================================================");
  console.log(` 🚀 Server running at:       http://localhost:${PORT}`);
  console.log(` 📖 Interactive API Docs:    http://localhost:${PORT}/api/docs`);
  console.log(` 🩺 Health Check:            http://localhost:${PORT}/api/health`);
  console.log(` 📜 Menu Repertoire:         http://localhost:${PORT}/api/menu`);
  console.log(` 🤖 AI Recommendations:      http://localhost:${PORT}/api/recommendations/trending`);
  console.log("=======================================================\n");
});

// Handle graceful termination
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    process.exit(0);
  });
});
