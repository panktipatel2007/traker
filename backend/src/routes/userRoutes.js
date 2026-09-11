/**
 * Users Routes
 * Base path: /api/users
 */

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { requireAuth, optionalAuth, requireRole } = require("../middleware/auth");

// Sync Firebase User with database
router.post("/sync", optionalAuth, userController.syncUser);

// Profile and Preferences
router.get("/profile", requireAuth, userController.getProfile);
router.put("/profile", requireAuth, userController.updateProfile);

// Loyalty Points & Tier
router.get("/loyalty", optionalAuth, userController.getLoyaltyInfo);

// Admin: List all users
router.get("/", requireAuth, requireRole("admin"), userController.getAllUsers);

module.exports = router;
