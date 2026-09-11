/**
 * Orders Controller
 */

const store = require("../services/store");

/**
 * POST /api/orders
 * Place a new coffee/food order
 */
async function createOrder(req, res, next) {
  try {
    const {
      items,
      orderType = "dine-in",
      tableNumber,
      customerInfo = {},
      notes
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "An order must contain at least one item."
        }
      });
    }

    // Resolve customer information
    const userId = req.user ? req.user.id : (customerInfo.userId || "guest");
    const resolvedCustomer = {
      name: (req.user && req.user.displayName) || customerInfo.name || "Kissaten Guest",
      email: (req.user && req.user.email) || customerInfo.email || "",
      phone: (req.user && req.user.phone) || customerInfo.phone || ""
    };

    // Validate items and calculate totals
    let subtotal = 0;
    const validatedItems = [];

    for (const requestedItem of items) {
      const menuItem = await store.findById("menuItems", requestedItem.menuItemId);
      if (!menuItem) {
        return res.status(400).json({
          success: false,
          error: {
            code: "ITEM_NOT_FOUND",
            message: `Menu item with ID '${requestedItem.menuItemId}' does not exist.`
          }
        });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          error: {
            code: "ITEM_UNAVAILABLE",
            message: `'${menuItem.name}' is currently unavailable.`
          }
        });
      }

      const qty = Math.max(1, parseInt(requestedItem.quantity || 1, 10));
      let itemPrice = menuItem.price;

      // Customization extra price handling
      const customizations = requestedItem.customizations || {};
      if (customizations.cream && customizations.cream.includes("+¥50")) {
        itemPrice += 50;
      }
      if (customizations.milkChoice && customizations.milkChoice.includes("+¥80")) {
        itemPrice += 80;
      }
      if (customizations.butterAmount && customizations.butterAmount.includes("+¥80")) {
        itemPrice += 80;
      }

      const itemTotal = itemPrice * qty;
      subtotal += itemTotal;

      validatedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        japaneseName: menuItem.japaneseName,
        unitPrice: itemPrice,
        quantity: qty,
        customizations,
        itemTotal
      });
    }

    const tax = Math.round(subtotal * 0.10); // 10% consumption tax
    const discount = 0;
    const total = subtotal + tax - discount;

    const orderNumberSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `YORU-ORD-${orderNumberSuffix}`;

    const newOrder = await store.create("orders", {
      orderCode,
      userId,
      customerInfo: resolvedCustomer,
      orderType,
      tableNumber: orderType === "dine-in" ? (tableNumber || "Bar-01") : null,
      items: validatedItems,
      subtotal,
      tax,
      discount,
      total,
      currency: "JPY",
      status: "received", // received | preparing | ready | completed | cancelled
      notes: notes || "",
      timeline: [
        {
          status: "received",
          timestamp: new Date().toISOString(),
          note: "Order received and queued at the counter"
        }
      ]
    });

    // Award loyalty points if registered user
    if (req.user && req.user.id !== "guest") {
      const earnedPoints = Math.floor(total / 100) * 10;
      const currentPoints = req.user.loyaltyPoints || 0;
      await store.update("users", req.user.id, {
        loyaltyPoints: currentPoints + earnedPoints
      });
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      data: newOrder
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders
 * List orders with filtering
 */
async function getAllOrders(req, res, next) {
  try {
    const { status, userId, orderType, limit } = req.query;

    const filterFn = (order) => {
      if (status && order.status.toLowerCase() !== status.toLowerCase()) return false;
      if (userId && order.userId !== userId) return false;
      if (orderType && order.orderType.toLowerCase() !== orderType.toLowerCase()) return false;
      return true;
    };

    const orders = await store.find("orders", filterFn, {
      sortBy: "createdAt",
      sortOrder: "desc",
      limit: limit ? parseInt(limit, 10) : undefined
    });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/my-orders
 * Get current authenticated user's order history
 */
async function getMyOrders(req, res, next) {
  try {
    const userId = req.user.id;
    const orders = await store.find("orders", order => order.userId === userId, {
      sortBy: "createdAt",
      sortOrder: "desc"
    });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:id
 * Retrieve single order details with live status tracking
 */
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const order = await store.findById("orders", id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Order with ID '${id}' was not found.`
        }
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/orders/:id/status
 * Update order status (Barista / Staff / Admin)
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ["received", "preparing", "ready", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: `Status must be one of: [${validStatuses.join(", ")}].`
        }
      });
    }

    const order = await store.findById("orders", id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Order with ID '${id}' was not found.`
        }
      });
    }

    const newStatus = status.toLowerCase();
    const timeline = order.timeline || [];
    timeline.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || `Order status updated to '${newStatus}'`
    });

    const updated = await store.update("orders", id, {
      status: newStatus,
      timeline
    });

    res.json({
      success: true,
      message: `Order status updated to '${newStatus}'.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus
};
