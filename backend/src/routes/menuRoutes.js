/**
 * Menu Routes
 * Base path: /api/menu
 */

const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const { requireAuth, requireRole } = require("../middleware/auth");

// Public routes
router.get("/categories", menuController.getCategories);
router.get("/featured", menuController.getFeatured);
router.get("/", menuController.getAllItems);
router.get("/:id", menuController.getItemById);

// Admin / Staff protected routes
router.post("/", requireAuth, requireRole(["admin", "staff"]), menuController.createItem);
router.put("/:id", requireAuth, requireRole(["admin", "staff"]), menuController.updateItem);
router.delete("/:id", requireAuth, requireRole("admin"), menuController.deleteItem);

module.exports = router;
