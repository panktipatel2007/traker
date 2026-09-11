/**
 * Firebase Authentication & Role Authorization Middleware
 */

const { auth, isUsingRealFirebase } = require("../config/firebase");
const store = require("../services/store");

/**
 * Authenticate user via Firebase ID Token
 * Supports:
 * 1. Authorization: Bearer <Firebase_ID_Token> (verified via Firebase Admin SDK)
 * 2. In Dev Mode: x-dev-user-id header (e.g. "usr_guest_demo", "usr_admin_demo")
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const devUserId = req.headers["x-dev-user-id"];

    // 1. Check for standard Bearer token
    if (authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split(" ")[1];

      if (isUsingRealFirebase && auth) {
        try {
          const decodedToken = await auth.verifyIdToken(idToken);
          // Look up user document in store
          let user = await store.find("users", u => u.firebaseUid === decodedToken.uid);
          user = user && user[0];

          if (!user) {
            // Auto-provision user profile if not yet in database
            user = await store.create("users", {
              firebaseUid: decodedToken.uid,
              email: decodedToken.email || "guest@smart-cafe.local",
              displayName: decodedToken.name || "Smart Café Guest",
              role: decodedToken.role || "customer",
              loyaltyPoints: 50,
              loyaltyTier: "Vinyl Connoisseur",
              preferences: {}
            });
          }

          req.user = user;
          req.firebaseUser = decodedToken;
          return next();
        } catch (tokenErr) {
          return res.status(401).json({
            success: false,
            error: {
              code: "AUTH_INVALID_TOKEN",
              message: "Invalid or expired Firebase ID token.",
              details: tokenErr.message
            }
          });
        }
      } else {
        // Dev mode token handling
        const user = (await store.findById("users", "usr_guest_demo")) || {
          id: "usr_guest_demo",
          role: "customer",
          displayName: "Dev Café Guest"
        };
        req.user = user;
        return next();
      }
    }

    // 2. Dev mode bypass header for rapid frontend developer testing
    if (!isUsingRealFirebase && devUserId) {
      const user = await store.findById("users", devUserId);
      if (user) {
        req.user = user;
        return next();
      }
    }

    // 3. Unauthorized
    return res.status(401).json({
      success: false,
      error: {
        code: "AUTH_REQUIRED",
        message: "Authentication required. Please provide a valid Firebase ID token in the 'Authorization: Bearer <token>' header.",
        hint: !isUsingRealFirebase
          ? "In local dev mode, you can also pass header 'x-dev-user-id: usr_admin_demo' or 'x-dev-user-id: usr_guest_demo'."
          : undefined
      }
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Optional Authentication: Attaches req.user if token is present, continues otherwise
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const devUserId = req.headers["x-dev-user-id"];

    if (authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split(" ")[1];
      if (isUsingRealFirebase && auth) {
        try {
          const decodedToken = await auth.verifyIdToken(idToken);
          const users = await store.find("users", u => u.firebaseUid === decodedToken.uid);
          req.user = users[0] || null;
          req.firebaseUser = decodedToken;
        } catch (e) {
          // Ignore invalid token in optional auth
        }
      } else {
        req.user = await store.findById("users", "usr_guest_demo");
      }
    } else if (!isUsingRealFirebase && devUserId) {
      req.user = await store.findById("users", devUserId);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/**
 * Require specific user role(s)
 * @param {string|string[]} roles
 */
function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "Authentication required before checking roles."
        }
      });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Required role(s): [${allowed.join(", ")}]. Current role: '${req.user.role}'`
        }
      });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole
};
