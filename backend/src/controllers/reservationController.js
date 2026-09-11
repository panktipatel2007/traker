/**
 * Reservations Controller
 */

const store = require("../services/store");

/**
 * Standard operating time slots (Kissaten dusk-till-dawn: 18:00 - 02:00)
 */
const STANDARD_SLOTS = [
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00", "01:00"
];

/**
 * POST /api/reservations
 * Book a listening table or booth
 */
async function createReservation(req, res, next) {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      partySize = 1,
      date,
      timeSlot,
      seatingArea = "vinyl-listening-bar",
      specialOccasion,
      notes
    } = req.body;

    if (!customerName || !customerPhone || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "customerName, customerPhone, date (YYYY-MM-DD), and timeSlot are required."
        }
      });
    }

    const numGuests = parseInt(partySize, 10);
    if (isNaN(numGuests) || numGuests < 1 || numGuests > 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PARTY_SIZE",
          message: "Party size must be between 1 and 8 guests."
        }
      });
    }

    // Find candidate tables
    const allTables = await store.find("tables");
    const suitableTables = allTables.filter(t => {
      if (seatingArea && t.area !== seatingArea) return false;
      return t.capacity >= numGuests;
    });

    if (suitableTables.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_SUITABLE_TABLE",
          message: `No seating tables found matching area '${seatingArea}' and party size ${numGuests}.`
        }
      });
    }

    // Check existing reservations for that date & time slot
    const existingReservations = await store.find("reservations", r =>
      r.date === date &&
      r.timeSlot === timeSlot &&
      r.status !== "cancelled"
    );

    const bookedTableIds = new Set(existingReservations.map(r => r.assignedTableId));
    const availableTable = suitableTables.find(t => !bookedTableIds.has(t.id));

    if (!availableTable) {
      return res.status(409).json({
        success: false,
        error: {
          code: "SLOT_UNAVAILABLE",
          message: `The ${timeSlot} slot on ${date} for ${seatingArea} is fully booked. Please select another time slot or seating area.`
        }
      });
    }

    const reservationCodeSuffix = Math.floor(2000 + Math.random() * 8000);
    const reservationCode = `YORU-RES-${reservationCodeSuffix}`;

    const reservation = await store.create("reservations", {
      reservationCode,
      userId: req.user ? req.user.id : "guest",
      customerName,
      customerEmail: customerEmail || "",
      customerPhone,
      partySize: numGuests,
      date,
      timeSlot,
      seatingArea,
      assignedTableId: availableTable.id,
      assignedTableName: availableTable.name,
      status: "confirmed", // pending | confirmed | seated | completed | cancelled
      specialOccasion: specialOccasion || "",
      notes: notes || ""
    });

    res.status(201).json({
      success: true,
      message: "Reservation confirmed successfully.",
      data: reservation
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reservations/availability
 * Check slot availability for date, party size, and seating area
 */
async function checkAvailability(req, res, next) {
  try {
    const { date, partySize = 2, seatingArea } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Query parameter 'date' (YYYY-MM-DD) is required."
        }
      });
    }

    const numGuests = parseInt(partySize, 10);
    const allTables = await store.find("tables");
    const suitableTables = allTables.filter(t => {
      if (seatingArea && t.area !== seatingArea) return false;
      return t.capacity >= numGuests;
    });

    const reservationsOnDate = await store.find("reservations", r =>
      r.date === date && r.status !== "cancelled"
    );

    const slotAvailability = STANDARD_SLOTS.map(slot => {
      const bookedOnSlot = reservationsOnDate
        .filter(r => r.timeSlot === slot)
        .map(r => r.assignedTableId);

      const openTables = suitableTables.filter(t => !bookedOnSlot.includes(t.id));
      return {
        timeSlot: slot,
        available: openTables.length > 0,
        remainingTables: openTables.length
      };
    });

    res.json({
      success: true,
      date,
      partySize: numGuests,
      seatingArea: seatingArea || "all",
      slots: slotAvailability
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reservations
 * List reservations (Staff / Admin)
 */
async function getAllReservations(req, res, next) {
  try {
    const { date, status, seatingArea, limit } = req.query;

    const filterFn = (resv) => {
      if (date && resv.date !== date) return false;
      if (status && resv.status.toLowerCase() !== status.toLowerCase()) return false;
      if (seatingArea && resv.seatingArea !== seatingArea) return false;
      return true;
    };

    const reservations = await store.find("reservations", filterFn, {
      sortBy: "date",
      sortOrder: "asc",
      limit: limit ? parseInt(limit, 10) : undefined
    });

    res.json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reservations/:id
 * Retrieve single reservation
 */
async function getReservationById(req, res, next) {
  try {
    const { id } = req.params;
    let reservation = await store.findById("reservations", id);

    if (!reservation) {
      // Also try matching reservationCode
      const match = await store.find("reservations", r => r.reservationCode === id);
      reservation = match[0];
    }

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Reservation '${id}' was not found.`
        }
      });
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/reservations/:id/status
 * Update reservation status
 */
async function updateReservationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "seated", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: `Status must be one of: [${validStatuses.join(", ")}].`
        }
      });
    }

    const reservation = await store.findById("reservations", id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Reservation with ID '${id}' was not found.`
        }
      });
    }

    const updated = await store.update("reservations", id, {
      status: status.toLowerCase()
    });

    res.json({
      success: true,
      message: `Reservation status updated to '${status}'.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/reservations/:id
 * Cancel reservation
 */
async function cancelReservation(req, res, next) {
  try {
    const { id } = req.params;
    const reservation = await store.findById("reservations", id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Reservation with ID '${id}' was not found.`
        }
      });
    }

    const updated = await store.update("reservations", id, {
      status: "cancelled"
    });

    res.json({
      success: true,
      message: "Reservation has been cancelled.",
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReservation,
  checkAvailability,
  getAllReservations,
  getReservationById,
  updateReservationStatus,
  cancelReservation
};
