const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let isUsingRealFirebase = false;
let db = null;
let auth = null;

try {
  const serviceAccountKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  let credential = null;

  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      credential = admin.credential.cert(parsed);
      console.log("🔥 [Firebase] Authenticated using FIREBASE_SERVICE_ACCOUNT_JSON environment variable.");
    } catch (e) {
      console.warn("⚠️ [Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e.message);
    }
  } else if (serviceAccountKeyPath) {
    const resolvedPath = path.isAbsolute(serviceAccountKeyPath)
      ? serviceAccountKeyPath
      : path.resolve(process.cwd(), serviceAccountKeyPath);

    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = require(resolvedPath);
      credential = admin.credential.cert(serviceAccount);
      console.log(`🔥 [Firebase] Authenticated using service account file at: ${resolvedPath}`);
    } else {
      console.warn(`⚠️ [Firebase] Service account file not found at: ${resolvedPath}`);
    }
  }

  // Fallback to application default credentials if project ID is provided
  if (!credential && (projectId || process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    try {
      credential = admin.credential.applicationDefault();
      console.log("🔥 [Firebase] Using Application Default Credentials.");
    } catch (e) {
      console.warn("⚠️ [Firebase] Application default credentials not available:", e.message);
    }
  }

  if (credential) {
    admin.initializeApp({
      credential,
      projectId: projectId || credential.projectId
    });
    db = admin.firestore();
    auth = admin.auth();
    isUsingRealFirebase = true;
    console.log("✅ [Firebase] Connected to live Firebase Firestore & Auth successfully.");
  } else {
    console.log("ℹ️ [Firebase] No service account key provided. Starting in Dev Fallback In-Memory Mode.");
    console.log("ℹ️ [Firebase] All REST APIs will function with full persistence during server runtime.");
    console.log("ℹ️ [Firebase] To connect live Firebase, set FIREBASE_SERVICE_ACCOUNT_KEY in backend/.env.");
  }
} catch (error) {
  console.error("❌ [Firebase] Initialization error:", error.message);
  console.log("ℹ️ [Firebase] Falling back to Dev In-Memory Storage Mode.");
}

module.exports = {
  admin,
  db,
  auth,
  isUsingRealFirebase
};
