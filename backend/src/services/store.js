/**
 * Universal Store Service
 * Adapts between Firebase Firestore (when credentials are active)
 * and an In-Memory Document Store (for local dev & instant testing without keys).
 */

const { db, isUsingRealFirebase } = require("../config/firebase");
const {
  categories,
  menuItems,
  seatingTables,
  sampleOrders,
  sampleReservations,
  sampleUsers
} = require("../seeds/seedData");

// In-Memory Dev Store
const memoryStore = {
  categories: JSON.parse(JSON.stringify(categories)),
  menuItems: JSON.parse(JSON.stringify(menuItems)),
  tables: JSON.parse(JSON.stringify(seatingTables)),
  orders: JSON.parse(JSON.stringify(sampleOrders)),
  reservations: JSON.parse(JSON.stringify(sampleReservations)),
  users: JSON.parse(JSON.stringify(sampleUsers))
};

class StoreService {
  constructor() {
    this.isUsingReal = isUsingRealFirebase && db !== null;
    this.db = db;
  }

  /**
   * Find documents in a collection
   * @param {string} collection - Collection name (e.g. 'menuItems', 'orders')
   * @param {Object|Function} filter - Object of key-value pairs or filter function
   * @param {Object} options - { sortBy, sortOrder, limit }
   */
  async find(collection, filter = {}, options = {}) {
    if (this.isUsingReal) {
      try {
        let query = this.db.collection(collection);

        // Apply equality filters for simple objects
        if (typeof filter === "object" && !Array.isArray(filter) && filter !== null) {
          for (const [key, value] of Object.entries(filter)) {
            if (value !== undefined && value !== null && typeof value !== "object") {
              query = query.where(key, "==", value);
            }
          }
        }

        if (options.sortBy) {
          query = query.orderBy(options.sortBy, options.sortOrder || "asc");
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (err) {
        console.warn(`[Firestore find error in ${collection}]:`, err.message, "- falling back to memory store");
      }
    }

    // In-memory fallback
    const items = memoryStore[collection] || [];
    let results = [...items];

    if (typeof filter === "function") {
      results = results.filter(filter);
    } else if (typeof filter === "object" && filter !== null) {
      results = results.filter(item => {
        return Object.entries(filter).every(([key, value]) => {
          if (value === undefined || value === null) return true;
          if (typeof value === "string") {
            return String(item[key] || "").toLowerCase() === value.toLowerCase();
          }
          return item[key] === value;
        });
      });
    }

    if (options.sortBy) {
      const { sortBy, sortOrder = "asc" } = options;
      results.sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Find document by ID
   */
  async findById(collection, id) {
    if (!id) return null;

    if (this.isUsingReal) {
      try {
        const doc = await this.db.collection(collection).doc(id).get();
        if (doc.exists) {
          return { id: doc.id, ...doc.data() };
        }
        return null;
      } catch (err) {
        console.warn(`[Firestore findById error in ${collection}]:`, err.message);
      }
    }

    const items = memoryStore[collection] || [];
    return items.find(item => item.id === id) || null;
  }

  /**
   * Create document
   */
  async create(collection, data) {
    const timestamp = new Date().toISOString();
    const id = data.id || `${collection.slice(0, 4)}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const newDoc = {
      ...data,
      id,
      createdAt: data.createdAt || timestamp,
      updatedAt: timestamp
    };

    if (this.isUsingReal) {
      try {
        await this.db.collection(collection).doc(id).set(newDoc);
        return newDoc;
      } catch (err) {
        console.warn(`[Firestore create error in ${collection}]:`, err.message);
      }
    }

    if (!memoryStore[collection]) {
      memoryStore[collection] = [];
    }
    memoryStore[collection].push(newDoc);
    return newDoc;
  }

  /**
   * Update document
   */
  async update(collection, id, updates) {
    const timestamp = new Date().toISOString();
    const cleanUpdates = { ...updates, updatedAt: timestamp };
    delete cleanUpdates.id;

    if (this.isUsingReal) {
      try {
        const docRef = this.db.collection(collection).doc(id);
        await docRef.update(cleanUpdates);
        const updatedDoc = await docRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
      } catch (err) {
        console.warn(`[Firestore update error in ${collection}]:`, err.message);
      }
    }

    const items = memoryStore[collection] || [];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...cleanUpdates
    };
    return items[index];
  }

  /**
   * Delete document
   */
  async delete(collection, id) {
    if (this.isUsingReal) {
      try {
        await this.db.collection(collection).doc(id).delete();
        return true;
      } catch (err) {
        console.warn(`[Firestore delete error in ${collection}]:`, err.message);
      }
    }

    const items = memoryStore[collection] || [];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return false;

    items.splice(index, 1);
    return true;
  }

  /**
   * Seed Firestore collections with initial Kissaten data
   */
  async seedFirestore() {
    if (!this.isUsingReal) {
      console.log("ℹ️ [Store] Dev mode: In-memory store already seeded.");
      return { success: true, mode: "in-memory", seededCount: menuItems.length };
    }

    console.log("🌱 [Firestore] Seeding initial Kissaten catalog to Firestore...");
    const batch = this.db.batch();

    for (const cat of categories) {
      const ref = this.db.collection("categories").doc(cat.id);
      batch.set(ref, cat, { merge: true });
    }

    for (const item of menuItems) {
      const ref = this.db.collection("menuItems").doc(item.id);
      batch.set(ref, item, { merge: true });
    }

    for (const table of seatingTables) {
      const ref = this.db.collection("tables").doc(table.id);
      batch.set(ref, table, { merge: true });
    }

    for (const user of sampleUsers) {
      const ref = this.db.collection("users").doc(user.id);
      batch.set(ref, user, { merge: true });
    }

    await batch.commit();
    console.log("✅ [Firestore] Seeding completed successfully.");
    return { success: true, mode: "firestore", seededCount: menuItems.length };
  }
}

module.exports = new StoreService();
