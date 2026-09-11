/**
 * Reservations Routes
 * Base path: /api/reservations
 */

const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const { requireAuth, optionalAuth, requireRole } = require("../middleware/auth");

// Public slot availability check
router.get("/availability", reservationController.checkAvailability);

// Book a table (optional auth for guest bookings or signed-in users)
router.post("/", optionalAuth, reservationController.createReservation);

// View reservation by ID or reservationCode
router.get("/:id", reservationController.getReservationById);

// Cancel reservation (customer or staff)
router.delete("/:id", optionalAuth, reservationController.cancelReservation);

// Staff / Admin: List all reservations and update seated/confirmed status
router.get("/", requireAuth, requireRole(["staff", "admin"]), reservationController.getAllReservations);
router.patch("/:id/status", requireAuth, requireRole(["staff", "admin"]), reservationController.updateReservationStatus);

module.exports = router;
