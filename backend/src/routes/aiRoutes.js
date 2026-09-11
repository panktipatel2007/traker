/**
 * AI Recommendations Routes
 * Base path: /api/recommendations
 */

const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

// Personalized Sommelier recommendation
router.post("/personalize", aiController.getPersonalizedRecommendation);

// Item Pairing suggestion (Coffee + Food + Vinyl)
router.post("/pairing", aiController.getItemPairing);

// Trending items
router.get("/trending", aiController.getTrending);

module.exports = router;
