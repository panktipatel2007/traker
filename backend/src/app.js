/**
 * Express Application Setup
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

// Route imports
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const userRoutes = require("./routes/userRoutes");
const aiRoutes = require("./routes/aiRoutes");

// Middleware imports
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { isUsingRealFirebase } = require("./config/firebase");

// Swagger documentation
const swaggerDocument = require("./docs/swagger.json");

const app = express();

// CORS configuration for cross-origin frontend requests
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : ["*"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS error: Origin ${origin} not allowed.`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-dev-user-id"]
}));

// Request logger
app.use(morgan("dev"));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "Smart Café (YORU) Backend REST API",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      provider: isUsingRealFirebase ? "Firebase Firestore (Cloud)" : "In-Memory Dev Store (Persistent during runtime)",
      status: "connected"
    },
    auth: {
      provider: isUsingRealFirebase ? "Firebase Authentication" : "Dev Mock Auth (Token / x-dev-user-id)"
    },
    documentationUrl: "/api/docs"
  });
});

// Raw Swagger JSON endpoint
app.get("/api/docs/swagger.json", (req, res) => {
  res.json(swaggerDocument);
});

// Swagger Interactive Documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: "Smart Café REST API Docs",
  customCss: ".swagger-ui .topbar { background-color: #161B22; border-bottom: 2px solid #C9A227; } .swagger-ui .topbar .topbar-wrapper a { content: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"40\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"46\" fill=\"%23161B22\" stroke=\"%23C9A227\" stroke-width=\"4\"/><text x=\"50\" y=\"64\" font-family=\"serif\" font-size=\"42\" fill=\"%23EDE6D6\" text-anchor=\"middle\">夜</text></svg>'); }"
}));

// API Routes
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recommendations", aiRoutes);

// Root route redirect to docs
app.get("/", (req, res) => {
  res.redirect("/api/docs");
});

// 404 and Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
