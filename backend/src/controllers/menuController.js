/**
 * Menu Controller
 */

const store = require("../services/store");

/**
 * GET /api/menu
 * List all menu items with search, category filtering, and sorting
 */
async function getAllItems(req, res, next) {
  try {
    const {
      category,
      search,
      isAvailable,
      isSignature,
      tag,
      sortBy = "trackCode",
      sortOrder = "asc",
      limit
    } = req.query;

    const filterFn = (item) => {
      // Category filter (by ID or code)
      if (category) {
        const catMatch =
          item.categoryId.toLowerCase() === category.toLowerCase() ||
          item.categoryName.toLowerCase().includes(category.toLowerCase());
        if (!catMatch) return false;
      }

      // Availability filter
      if (isAvailable !== undefined) {
        const availBool = isAvailable === "true" || isAvailable === true;
        if (item.isAvailable !== availBool) return false;
      }

      // Signature filter
      if (isSignature !== undefined) {
        const sigBool = isSignature === "true" || isSignature === true;
        if (item.isSignature !== sigBool) return false;
      }

      // Tag / Flavor profile filter
      if (tag) {
        const tagMatch = item.flavorProfile?.some(f =>
          f.toLowerCase().includes(tag.toLowerCase())
        );
        if (!tagMatch) return false;
      }

      // Keyword search (matches name, japaneseName, or description)
      if (search) {
        const q = search.toLowerCase();
        const inName = item.name.toLowerCase().includes(q);
        const inJpName = (item.japaneseName || "").toLowerCase().includes(q);
        const inDesc = (item.description || "").toLowerCase().includes(q);
        if (!inName && !inJpName && !inDesc) return false;
      }

      return true;
    };

    const items = await store.find("menuItems", filterFn, {
      sortBy,
      sortOrder,
      limit: limit ? parseInt(limit, 10) : undefined
    });

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/menu/categories
 * Get all categories with item counts
 */
async function getCategories(req, res, next) {
  try {
    const categories = await store.find("categories", {}, { sortBy: "displayOrder", sortOrder: "asc" });
    const items = await store.find("menuItems");

    // Augment with item count
    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      itemCount: items.filter(item => item.categoryId === cat.id).length
    }));

    res.json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/menu/featured
 * Get signature / featured items
 */
async function getFeatured(req, res, next) {
  try {
    const items = await store.find("menuItems", { isSignature: true, isAvailable: true });
    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/menu/:id
 * Get single item details
 */
async function getItemById(req, res, next) {
  try {
    const { id } = req.params;
    const item = await store.findById("menuItems", id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Menu item with ID '${id}' was not found.`
        }
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/menu
 * Create a new menu item (Admin/Staff only)
 */
async function createItem(req, res, next) {
  try {
    const {
      name,
      japaneseName,
      categoryId,
      categoryName,
      price,
      currency = "JPY",
      trackCode,
      description,
      flavorProfile = [],
      roastLevel,
      caffeineLevel = "Medium",
      allergens = [],
      customizationOptions = {},
      vinylPairing,
      isAvailable = true,
      isSignature = false
    } = req.body;

    if (!name || price === undefined || !categoryId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Name, price, and categoryId are required fields."
        }
      });
    }

    const newItem = await store.create("menuItems", {
      name,
      japaneseName,
      categoryId,
      categoryName: categoryName || "Speciality",
      price: Number(price),
      currency,
      trackCode: trackCode || `T-${Date.now().toString().slice(-2)}`,
      description: description || "",
      flavorProfile: Array.isArray(flavorProfile) ? flavorProfile : [flavorProfile],
      roastLevel,
      caffeineLevel,
      allergens: Array.isArray(allergens) ? allergens : [],
      customizationOptions,
      vinylPairing: vinylPairing || "Miles Davis — 'Kind of Blue'",
      isAvailable: Boolean(isAvailable),
      isSignature: Boolean(isSignature)
    });

    res.status(201).json({
      success: true,
      message: "Menu item created successfully.",
      data: newItem
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/menu/:id
 * Update an existing menu item (Admin/Staff only)
 */
async function updateItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await store.findById("menuItems", id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Menu item with ID '${id}' was not found.`
        }
      });
    }

    const updated = await store.update("menuItems", id, req.body);

    res.json({
      success: true,
      message: "Menu item updated successfully.",
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/menu/:id
 * Delete a menu item (Admin only)
 */
async function deleteItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await store.findById("menuItems", id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Menu item with ID '${id}' was not found.`
        }
      });
    }

    await store.delete("menuItems", id);

    res.json({
      success: true,
      message: `Menu item '${existing.name}' was successfully removed.`
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllItems,
  getCategories,
  getFeatured,
  getItemById,
  createItem,
  updateItem,
  deleteItem
};
