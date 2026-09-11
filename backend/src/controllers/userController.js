/**
 * Users Controller
 * Handles Firebase User Synchronization, Profiles, Preferences, and Loyalty Tiers
 */

const store = require("../services/store");

/**
 * Kissaten Club Loyalty Tiers
 */
const LOYALTY_TIERS = {
  BRONZE: { name: "Kissaten Novice", minPoints: 0, perk: "Complimentary bean sample on third visit" },
  SILVER: { name: "Vinyl Connoisseur", minPoints: 200, perk: "Priority listening booth booking & 5% reward on beans" },
  GOLD: { name: "Master Brewer Circle", minPoints: 500, perk: "Invitation to rare album unboxing & private siphon tastings" }
};

function calculateTier(points = 0) {
  if (points >= LOYALTY_TIERS.GOLD.minPoints) return LOYALTY_TIERS.GOLD.name;
  if (points >= LOYALTY_TIERS.SILVER.minPoints) return LOYALTY_TIERS.SILVER.name;
  return LOYALTY_TIERS.BRONZE.name;
}

/**
 * POST /api/users/sync
 * Sync Firebase Auth user into the database
 */
async function syncUser(req, res, next) {
  try {
    const { email, displayName, photoUrl, phone } = req.body;
    const firebaseUid = (req.firebaseUser && req.firebaseUser.uid) || req.body.firebaseUid;

    if (!firebaseUid && !email) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Firebase UID or email is required to sync user profile."
        }
      });
    }

    // Check if user already exists
    let existingUser = null;
    if (firebaseUid) {
      const match = await store.find("users", u => u.firebaseUid === firebaseUid);
      existingUser = match[0];
    }
    if (!existingUser && email) {
      const match = await store.find("users", u => u.email === email);
      existingUser = match[0];
    }

    if (existingUser) {
      // Update with any newer information
      const updated = await store.update("users", existingUser.id, {
        displayName: displayName || existingUser.displayName,
        photoUrl: photoUrl || existingUser.photoUrl,
        phone: phone || existingUser.phone,
        lastLoginAt: new Date().toISOString()
      });

      return res.json({
        success: true,
        message: "User profile synced successfully.",
        isNewUser: false,
        data: updated
      });
    }

    // Create new user document with welcome bonus
    const newUser = await store.create("users", {
      firebaseUid: firebaseUid || `uid_${Date.now()}`,
      email: email || "guest@smart-cafe.local",
      displayName: displayName || "Smart Café Guest",
      photoUrl: photoUrl || "",
      phone: phone || "",
      role: "customer", // default
      loyaltyPoints: 50, // Welcome gift!
      loyaltyTier: calculateTier(50),
      preferences: {
        favoriteBean: "",
        roastPreference: "Dark",
        preferredSeating: "vinyl-listening-bar",
        dietary: []
      },
      lastLoginAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: "New user registered and welcome loyalty points credited.",
      isNewUser: true,
      data: newUser
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/profile
 * Get current authenticated user profile
 */
async function getProfile(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_REQUIRED", message: "Authentication required." }
      });
    }

    // Fetch user order count
    const orders = await store.find("orders", o => o.userId === user.id);

    res.json({
      success: true,
      data: {
        ...user,
        loyaltyTier: calculateTier(user.loyaltyPoints),
        orderCount: orders.length,
        recentOrders: orders.slice(0, 3)
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/users/profile
 * Update profile & preferences
 */
async function updateProfile(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_REQUIRED", message: "Authentication required." }
      });
    }

    const { displayName, phone, preferences } = req.body;
    const updates = {};

    if (displayName) updates.displayName = displayName;
    if (phone) updates.phone = phone;
    if (preferences) {
      updates.preferences = {
        ...(user.preferences || {}),
        ...preferences
      };
    }

    const updated = await store.update("users", user.id, updates);

    res.json({
      success: true,
      message: "Profile updated successfully.",
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/loyalty
 * Get current user's loyalty rewards details
 */
async function getLoyaltyInfo(req, res, next) {
  try {
    const user = req.user;
    const points = user ? (user.loyaltyPoints || 0) : 0;
    const currentTier = calculateTier(points);

    res.json({
      success: true,
      data: {
        pointsBalance: points,
        currentTier,
        allTiers: LOYALTY_TIERS,
        pointsToNextTier: points < 200 ? 200 - points : (points < 500 ? 500 - points : 0),
        rewardsCatalog: [
          { id: "rw_01", title: "Free Cold Ice Sphere Upgrade", pointsRequired: 50 },
          { id: "rw_02", title: "Complimentary Thick-Cut Ogura Toast", pointsRequired: 150 },
          { id: "rw_03", title: "Single-Origin Geisha Tasting Flight", pointsRequired: 300 }
        ]
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users
 * Admin endpoint to list all users
 */
async function getAllUsers(req, res, next) {
  try {
    const users = await store.find("users", {}, { sortBy: "createdAt", sortOrder: "desc" });
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  syncUser,
  getProfile,
  updateProfile,
  getLoyaltyInfo,
  getAllUsers
};
