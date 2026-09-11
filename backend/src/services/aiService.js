/**
 * AI Recommendation Engine
 * Integrates with Google Gemini API when GEMINI_API_KEY is configured,
 * with an embedded heuristic Kissaten Sommelier fallback that works instantly offline.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const store = require("./store");

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
  }

  /**
   * Get personalized recommendation based on customer preferences & context
   */
  async personalizeRecommendation({ mood, timeOfDay, flavorProfile, dietary = [], previousOrderIds = [] }) {
    const allItems = await store.find("menuItems", { isAvailable: true });

    // Try Gemini API if key is set
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
You are the master sommelier of YORU, an unhurried Japanese Jazz Kissaten café in Tokyo.
Current customer preferences:
- Mood: ${mood || "reflective"}
- Time of Day: ${timeOfDay || "night"}
- Flavor Preferences: ${Array.isArray(flavorProfile) ? flavorProfile.join(", ") : (flavorProfile || "rich")}
- Dietary Restrictions: ${dietary.join(", ") || "none"}

Here is our available menu:
${JSON.stringify(allItems.map(i => ({ id: i.id, name: i.name, japaneseName: i.japaneseName, description: i.description, flavorProfile: i.flavorProfile, allergens: i.allergens, vinylPairing: i.vinylPairing })), null, 2)}

Respond with a JSON object strictly following this structure:
{
  "primaryItemId": "<id of primary recommended drink>",
  "pairingItemId": "<id of recommended food or dessert>",
  "sommelierNote": "<poetic 2-sentence Kissaten master recommendation explaining the harmony of the extraction and music>",
  "recommendedVinyl": "<vinyl track recommendation>",
  "matchScore": <number between 85 and 99>
}
Return ONLY valid raw JSON without markdown or code blocks.
`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
        const parsed = JSON.parse(text);

        const primaryItem = allItems.find(i => i.id === parsed.primaryItemId) || allItems[0];
        const pairingItem = allItems.find(i => i.id === parsed.pairingItemId) || allItems[allItems.length - 1];

        return {
          source: "gemini-ai",
          primaryItem,
          pairingItem,
          sommelierNote: parsed.sommelierNote,
          recommendedVinyl: parsed.recommendedVinyl || primaryItem.vinylPairing,
          matchScore: parsed.matchScore || 95
        };
      } catch (geminiErr) {
        console.warn("⚠️ [Gemini AI] Call failed or rate-limited. Using built-in Kissaten Sommelier engine:", geminiErr.message);
      }
    }

    // Heuristic Kissaten Sommelier Fallback Engine
    return this.fallbackHeuristicPersonalize({ mood, timeOfDay, flavorProfile, dietary, allItems });
  }

  /**
   * Kissaten Expert Heuristic Recommendation Algorithm
   */
  fallbackHeuristicPersonalize({ mood = "reflective", timeOfDay = "night", flavorProfile = "rich", dietary = [], allItems }) {
    // Filter by dietary restrictions if any
    let validItems = allItems.filter(item => {
      if (dietary.includes("dairy-free") && item.allergens && item.allergens.includes("Dairy")) return false;
      if (dietary.includes("gluten-free") && item.allergens && item.allergens.includes("Wheat")) return false;
      return true;
    });

    if (validItems.length === 0) validItems = allItems;

    // Score drink items based on profile matching
    const drinks = validItems.filter(i => i.categoryId !== "cat_food" && i.categoryId !== "cat_dessert");
    const foods = validItems.filter(i => i.categoryId === "cat_food" || i.categoryId === "cat_dessert");

    let scoredDrinks = drinks.map(item => {
      let score = 70;

      // Time of day matching
      const tod = (timeOfDay || "").toLowerCase();
      if ((tod === "midnight" || tod === "night" || tod === "dusk") && (item.roastLevel === "Dark Roast" || item.id === "menu_001" || item.id === "menu_007")) {
        score += 20;
      } else if ((tod === "morning" || tod === "afternoon") && (item.roastLevel === "Light-Medium Roast" || item.id === "menu_004" || item.id === "menu_005")) {
        score += 20;
      }

      // Mood matching
      const m = (mood || "").toLowerCase();
      if (m.includes("focus") || m.includes("work")) {
        if (item.caffeineLevel === "High") score += 15;
      } else if (m.includes("unwind") || m.includes("chill") || m.includes("relax") || m.includes("reflective")) {
        if (item.durationMinutes >= 4) score += 15; // Unhurried slow drips
      }

      // Flavor note matching
      const targetFlavor = Array.isArray(flavorProfile) ? flavorProfile.join(" ") : (flavorProfile || "");
      if (targetFlavor) {
        const matches = item.flavorProfile.some(fp => targetFlavor.toLowerCase().includes(fp.toLowerCase()));
        if (matches) score += 25;
      }

      return { item, score };
    });

    scoredDrinks.sort((a, b) => b.score - a.score);
    const topDrink = scoredDrinks[0]?.item || drinks[0];

    // Find ideal food pairing from suggestions or category
    let pairingItem = null;
    if (topDrink.pairingSuggestions && topDrink.pairingSuggestions.length > 0) {
      pairingItem = foods.find(f => topDrink.pairingSuggestions.includes(f.id));
    }
    if (!pairingItem && foods.length > 0) {
      pairingItem = foods[0];
    }

    const sommelierNotes = {
      menu_001: "For the quiet late hours: 18-month aged Sumatra Mandheling dripped through cotton flannel yields an unhurried, molasses-sweet nectar that deepens with every spin of the platter.",
      menu_002: "Our house roast balances the bitterness of 85% cocoa with rich pipe tobacco notes, echoing the harmonic resonance of Thelonious Monk's piano voicings.",
      menu_003: "A tactile dance of contrast: scalding charcoal espresso poured directly over unhomogenized Hokkaido jersey cream.",
      menu_004: "Bright Meyer lemon peel express layered over chilled dark roast concentration to refresh the palate during deep conversation.",
      menu_005: "Under the crimson halogen siphon beam, highland Geisha blossoms with delicate jasmine perfume and crisp bergamot finish.",
      menu_006: "Monsoon-seasoned beans impart dry cedar and black cardamom warmth, grounding the senses in meditative stillness.",
      menu_007: "16 hours of gravitational patience distilled over an ice sphere—notes of dark wild cherry and sweet bourbon barrel."
    };

    return {
      source: "kissaten-sommelier-heuristic",
      primaryItem: topDrink,
      pairingItem: pairingItem || null,
      sommelierNote: sommelierNotes[topDrink.id] || `Handcrafted slow extraction designed to harmonize with the acoustic field of the listening room.`,
      recommendedVinyl: topDrink.vinylPairing || "Miles Davis — 'Kind of Blue' (1959)",
      matchScore: Math.min(98, (scoredDrinks[0]?.score || 88))
    };
  }

  /**
   * Get pairing for a specific menu item
   */
  async getPairing(menuItemId) {
    const item = await store.findById("menuItems", menuItemId);
    if (!item) return null;

    const allItems = await store.find("menuItems", { isAvailable: true });
    let pairedItems = [];

    if (item.pairingSuggestions && item.pairingSuggestions.length > 0) {
      pairedItems = allItems.filter(i => item.pairingSuggestions.includes(i.id));
    }

    // If no direct pairings, find complimentary category
    if (pairedItems.length === 0) {
      if (item.categoryId === "cat_food" || item.categoryId === "cat_dessert") {
        pairedItems = allItems.filter(i => i.categoryId === "cat_dark_roast" || i.categoryId === "cat_siphon").slice(0, 2);
      } else {
        pairedItems = allItems.filter(i => i.categoryId === "cat_food" || i.categoryId === "cat_dessert").slice(0, 2);
      }
    }

    return {
      selectedItem: item,
      suggestedPairings: pairedItems,
      recommendedVinyl: item.vinylPairing || "Ryo Fukui — 'Scenery' (1976)",
      flavorHarmonyTip: item.categoryId.includes("roast")
        ? "The dark roast's lingering bitter cocoa profile cuts beautifully through rich Hokkaido butter or creamy ganache."
        : "The sweetness of Azuki red bean pairs seamlessly with an aged Nel extraction."
    };
  }

  /**
   * Get trending items based on smart popularity
   */
  async getTrendingRecommendations() {
    const items = await store.find("menuItems", { isAvailable: true });
    // Pick signatures and top performers
    const signatures = items.filter(i => i.isSignature).slice(0, 3);
    const others = items.filter(i => !i.isSignature).slice(0, 2);

    return {
      curator: "Kissaten Master Selection",
      updatedAt: new Date().toISOString(),
      trendingItems: [...signatures, ...others]
    };
  }
}

module.exports = new AIService();
