/**
 * Orders Routes
 * Base path: /api/orders
 */

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { requireAuth, optionalAuth, requireRole } = require("../middleware/auth");

// Place an order (optional auth so guests or registered users can order)
router.post("/", optionalAuth, orderController.createOrder);

// Authenticated user order history
router.get("/my-orders", requireAuth, orderController.getMyOrders);

// Get single order details (public with order ID or code for customer tracking)
router.get("/:id", orderController.getOrderById);

// Staff / Admin: List all orders and update status
router.get("/", requireAuth, requireRole(["staff", "admin"]), orderController.getAllOrders);
router.patch("/:id/status", requireAuth, requireRole(["staff", "admin"]), orderController.updateOrderStatus);

module.exports = router;
