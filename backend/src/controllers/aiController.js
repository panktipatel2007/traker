/**
 * AI Recommendations Controller
 */

const aiService = require("../services/aiService");

/**
 * POST /api/recommendations/personalize
 * Smart Sommelier recommendation based on customer mood, time of day, and flavor preferences
 */
async function getPersonalizedRecommendation(req, res, next) {
  try {
    const {
      mood,
      timeOfDay,
      flavorProfile,
      dietary = [],
      previousOrderIds = []
    } = req.body;

    const recommendation = await aiService.personalizeRecommendation({
      mood,
      timeOfDay,
      flavorProfile,
      dietary,
      previousOrderIds
    });

    res.json({
      success: true,
      data: recommendation
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/recommendations/pairing
 * Get smart flavor pairing for a selected item (e.g. coffee + pastry + vinyl album)
 */
async function getItemPairing(req, res, next) {
  try {
    const { menuItemId } = req.body;

    if (!menuItemId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "'menuItemId' is required to fetch pairing recommendations."
        }
      });
    }

    const pairing = await aiService.getPairing(menuItemId);

    if (!pairing) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Item with ID '${menuItemId}' was not found.`
        }
      });
    }

    res.json({
      success: true,
      data: pairing
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/recommendations/trending
 * Algorithmic trending selections curated by Kissaten dynamics
 */
async function getTrending(req, res, next) {
  try {
    const trending = await aiService.getTrendingRecommendations();
    res.json({
      success: true,
      data: trending
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPersonalizedRecommendation,
  getItemPairing,
  getTrending
};
