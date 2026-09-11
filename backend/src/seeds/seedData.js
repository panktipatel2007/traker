/**
 * Smart Café Repertoire & Initial Seed Data
 * Inspired by YORU (夜) Japanese Jazz Kissaten & Modern Smart Café Features
 */

const categories = [
  {
    id: "cat_dark_roast",
    name: "Dark Extractions & Nel Drip",
    code: "nel-drip",
    description: "Slow, heavy-bodied extractions aged and dripped through cotton flannel.",
    icon: "☕",
    displayOrder: 1
  },
  {
    id: "cat_siphon",
    name: "Twin-Flask Siphon",
    code: "siphon",
    description: "Single-origin highland beans extracted over crimson halogen flame.",
    icon: "⚗️",
    displayOrder: 2
  },
  {
    id: "cat_cold_brew",
    name: "Cold Extractions & Dutch Drip",
    code: "cold-brew",
    description: "16-hour gravity slow drips and hand-carved ice sphere pours.",
    icon: "🧊",
    displayOrder: 3
  },
  {
    id: "cat_espresso",
    name: "Charcoal & Espresso Specialities",
    code: "espresso",
    description: "Intense shots pulled over unhomogenized cream and chilled infusions.",
    icon: "✨",
    displayOrder: 4
  },
  {
    id: "cat_food",
    name: "Late Fuel & Kissaten Toast",
    code: "food",
    description: "Thick-cut Hokkaido loaves, Azuki bean spreads, and savory pairings.",
    icon: "🍞",
    displayOrder: 5
  },
  {
    id: "cat_dessert",
    name: "Pairings & Confections",
    code: "dessert",
    description: "Artisan smoked cheeses and bitter dark cocoa truffles.",
    icon: "🍫",
    displayOrder: 6
  }
];

const menuItems = [
  {
    id: "menu_001",
    name: "Midnight Nel Drip",
    japaneseName: "深夜ネルドリップ",
    categoryId: "cat_dark_roast",
    categoryName: "Dark Extractions & Nel Drip",
    price: 850,
    currency: "JPY",
    trackCode: "A1",
    durationMinutes: 4.5,
    description: "Sumatra Mandheling aged 18 months, conditioned over cold stone. Dripped through heavy cotton flannel for a heavy, molasses-sweet velvet body.",
    flavorProfile: ["bitter-rich", "molasses", "pipe-tobacco", "heavy-body"],
    roastLevel: "Dark Roast",
    caffeineLevel: "High",
    isAvailable: true,
    isSignature: true,
    allergens: [],
    customizationOptions: {
      temperature: ["Hot"],
      sugarLevel: ["None", "One Cube Demerara", "Side Demerara Syrup"],
      cream: ["None", "Fresh Hokkaido Jersey Cream (+¥50)"]
    },
    pairingSuggestions: ["menu_008", "menu_009"],
    vinylPairing: "Ryo Fukui Trio — 'Scenery' (1976)"
  },
  {
    id: "menu_002",
    name: "Kissa Blend No. 1 ('Round Midnight')",
    japaneseName: "ラウンド・ミッドナイト",
    categoryId: "cat_dark_roast",
    categoryName: "Dark Extractions & Nel Drip",
    price: 750,
    currency: "JPY",
    trackCode: "A2",
    durationMinutes: 3.25,
    description: "Our flagship house dark roast. Brazilian Santos and Colombian Excelso steeped in a tinned copper kettle. Notes of pipe tobacco and 85% bitter cocoa.",
    flavorProfile: ["dark-chocolate", "cocoa", "tobacco", "balanced"],
    roastLevel: "French Roast",
    caffeineLevel: "High",
    isAvailable: true,
    isSignature: true,
    allergens: [],
    customizationOptions: {
      temperature: ["Hot"],
      sugarLevel: ["None", "Low", "Standard"],
      cream: ["None", "Hokkaido Cream"]
    },
    pairingSuggestions: ["menu_008"],
    vinylPairing: "Thelonious Monk — 'Round Midnight' (1957)"
  },
  {
    id: "menu_003",
    name: "Charcoal Espresso & Cold Cream",
    japaneseName: "木炭エスプレッソ",
    categoryId: "cat_espresso",
    categoryName: "Charcoal & Espresso Specialities",
    price: 800,
    currency: "JPY",
    trackCode: "A3",
    durationMinutes: 1.75,
    description: "Short, syrupy double extraction pulled over unhomogenized Hokkaido jersey cream. Served unsweetened in a pre-warmed ceramic demitasse.",
    flavorProfile: ["creamy", "intense", "velvety", "roasted"],
    roastLevel: "Italian Dark",
    caffeineLevel: "High",
    isAvailable: true,
    isSignature: false,
    allergens: ["Dairy"],
    customizationOptions: {
      milkChoice: ["Hokkaido Jersey Cream", "Oat Cream (+¥80)"],
      temperature: ["Layered (Hot espresso over cold cream)"]
    },
    pairingSuggestions: ["menu_009"],
    vinylPairing: "Miles Davis — 'Kind of Blue' (1959)"
  },
  {
    id: "menu_004",
    name: "Smoked Mazagran",
    japaneseName: "冷製珈琲マザグラン",
    categoryId: "cat_cold_brew",
    categoryName: "Cold Extractions & Dutch Drip",
    price: 900,
    currency: "JPY",
    trackCode: "A4",
    durationMinutes: 2.3,
    description: "Chilled dark concentrate shaken over hand-carved ice, fragrant Meyer lemon peel express, and two drops of aged Demerara sugar syrup.",
    flavorProfile: ["citrus-bright", "crisp", "refreshing", "aromatic"],
    roastLevel: "Medium-Dark",
    caffeineLevel: "Medium",
    isAvailable: true,
    isSignature: true,
    allergens: [],
    customizationOptions: {
      iceLevel: ["Hand-Carved Sphere", "Less Ice"],
      sweetness: ["Subtle (Default)", "Unsweetened"]
    },
    pairingSuggestions: ["menu_009"],
    vinylPairing: "Bill Evans Trio — 'Waltz for Debby' (1961)"
  },
  {
    id: "menu_005",
    name: "Twin-Flask Siphon: Geisha Estate",
    japaneseName: "サイフォン・ゲイシャ",
    categoryId: "cat_siphon",
    categoryName: "Twin-Flask Siphon",
    price: 1200,
    currency: "JPY",
    trackCode: "B1",
    durationMinutes: 5.2,
    description: "Highland Panama Geisha drawn under a crimson halogen beam. Floral jasmine nose, bergamot rind clarity, and a tea-like lingering finish.",
    flavorProfile: ["floral", "jasmine", "bergamot", "tea-like", "light-acid"],
    roastLevel: "Light-Medium Roast",
    caffeineLevel: "Medium",
    isAvailable: true,
    isSignature: true,
    allergens: [],
    customizationOptions: {
      brewingTemp: ["Standard 92°C", "Gentle 88°C"]
    },
    pairingSuggestions: ["menu_009"],
    vinylPairing: "John Coltrane — 'A Love Supreme' (1965)"
  },
  {
    id: "menu_006",
    name: "Monsoon Malabar Siphon",
    japaneseName: "マラバール深煎",
    categoryId: "cat_siphon",
    categoryName: "Twin-Flask Siphon",
    price: 950,
    currency: "JPY",
    trackCode: "B2",
    durationMinutes: 4.7,
    description: "Monsoon-seasoned beans steeped in brass-framed glass. Earthy spices, dry cedar, black cardamom, and an unmistakable creamy mouthfeel.",
    flavorProfile: ["earthy", "cedar", "cardamom", "low-acid", "spicy"],
    roastLevel: "Dark Roast",
    caffeineLevel: "Medium-High",
    isAvailable: true,
    isSignature: false,
    allergens: [],
    customizationOptions: {
      brewingTemp: ["Standard"]
    },
    pairingSuggestions: ["menu_008"],
    vinylPairing: "Art Blakey & The Jazz Messengers — 'Moanin'' (1958)"
  },
  {
    id: "menu_007",
    name: "Dutch Tower Gravity Drip (16-Hr)",
    japaneseName: "16時間水出し氷球",
    categoryId: "cat_cold_brew",
    categoryName: "Cold Extractions & Dutch Drip",
    price: 950,
    currency: "JPY",
    trackCode: "B3",
    durationMinutes: 1,
    description: "Slowly dripped drop-by-drop through glass coils overnight. Poured over a crystal-clear hand-chiseled ice sphere in cut glass.",
    flavorProfile: ["wine-like", "black-cherry", "sweet-bourbon", "silk-smooth"],
    roastLevel: "Medium-Dark",
    caffeineLevel: "High",
    isAvailable: true,
    isSignature: true,
    allergens: [],
    customizationOptions: {
      serveMethod: ["Pure Over Ice Sphere", "With Splash of Jersey Cream"]
    },
    pairingSuggestions: ["menu_009"],
    vinylPairing: "Chet Baker — 'Chet' (1959)"
  },
  {
    id: "menu_008",
    name: "Thick-Cut Ogura Toast",
    japaneseName: "自家製小倉トースト",
    categoryId: "cat_food",
    categoryName: "Late Fuel & Kissaten Toast",
    price: 700,
    currency: "JPY",
    trackCode: "B4",
    durationMinutes: 6.0,
    description: "4cm Hokkaido milk loaf toasted over charcoal, topped with house-simmered Azuki bean paste and a generous block of salted cultured butter.",
    flavorProfile: ["buttery", "sweet-red-bean", "warm", "savory-sweet"],
    roastLevel: null,
    caffeineLevel: "None",
    isAvailable: true,
    isSignature: true,
    allergens: ["Wheat", "Dairy"],
    customizationOptions: {
      butterAmount: ["Standard Block", "Double Butter (+¥80)"],
      toastCrispness: ["Golden Soft", "Crisp Well-Toasted"]
    },
    pairingSuggestions: ["menu_001", "menu_002", "menu_006"],
    vinylPairing: "Cannonball Adderley — 'Somethin' Else' (1958)"
  },
  {
    id: "menu_009",
    name: "Smoked Gouda & Bitter Truffles",
    japaneseName: "燻製と生チョコ",
    categoryId: "cat_dessert",
    categoryName: "Pairings & Confections",
    price: 650,
    currency: "JPY",
    trackCode: "B5",
    durationMinutes: 2.0,
    description: "Thin shavings of sakura-smoked Gouda cheese alongside two bitter dark chocolate ganache cubes. Designed to accompany dark Nel roasts.",
    flavorProfile: ["smoky", "bitter-chocolate", "savory-umami"],
    roastLevel: null,
    caffeineLevel: "None",
    isAvailable: true,
    isSignature: false,
    allergens: ["Dairy"],
    customizationOptions: {
      portion: ["Standard (Pairing)", "Sharing Board (+¥400)"]
    },
    pairingSuggestions: ["menu_001", "menu_005", "menu_007"],
    vinylPairing: "Sonny Rollins — 'Saxophone Colossus' (1956)"
  }
];

const seatingTables = [
  {
    id: "table_01",
    tableNumber: "T-01",
    area: "vinyl-listening-bar",
    name: "Analog Soundboard Front Row (Seat 1)",
    capacity: 1,
    minParty: 1,
    description: "Direct sweet-spot acoustic positioning facing the Garrard 301 turntable and JBL 4344 monitors.",
    isAccessible: true
  },
  {
    id: "table_02",
    tableNumber: "T-02",
    area: "vinyl-listening-bar",
    name: "Analog Soundboard Front Row (Seat 2)",
    capacity: 1,
    minParty: 1,
    description: "Direct acoustic sweet spot adjacent to tube amplifiers.",
    isAccessible: true
  },
  {
    id: "table_03",
    tableNumber: "T-03",
    area: "booth",
    name: "Leather Corner Booth 'Round Midnight'",
    capacity: 4,
    minParty: 2,
    description: "Dark mahogany booth tucked under warm brass filament lighting with private acoustic diffuser panel.",
    isAccessible: true
  },
  {
    id: "table_04",
    tableNumber: "T-04",
    area: "booth",
    name: "Liner Notes Alcove",
    capacity: 2,
    minParty: 1,
    description: "Intimate two-person alcove stocked with vintage jazz liner notes and reading lamp.",
    isAccessible: true
  },
  {
    id: "table_05",
    tableNumber: "T-05",
    area: "window",
    name: "Subterranean Lightwell Table",
    capacity: 2,
    minParty: 1,
    description: "Overlooks the stone garden well beneath Jimbocho street.",
    isAccessible: false
  }
];

const sampleOrders = [
  {
    id: "order_1001",
    orderCode: "YORU-ORD-1001",
    userId: "usr_guest_demo",
    customerInfo: {
      name: "Kenji Sato",
      email: "kenji@example.com",
      phone: "+81 90-1234-5678"
    },
    orderType: "dine-in",
    tableNumber: "T-03",
    items: [
      {
        menuItemId: "menu_001",
        name: "Midnight Nel Drip",
        unitPrice: 850,
        quantity: 1,
        customizations: {
          sugarLevel: "None",
          cream: "Fresh Hokkaido Jersey Cream (+¥50)"
        },
        itemTotal: 900
      },
      {
        menuItemId: "menu_008",
        name: "Thick-Cut Ogura Toast",
        unitPrice: 700,
        quantity: 1,
        customizations: {
          butterAmount: "Standard Block",
          toastCrispness: "Golden Soft"
        },
        itemTotal: 700
      }
    ],
    subtotal: 1600,
    tax: 160,
    discount: 0,
    total: 1760,
    currency: "JPY",
    status: "preparing", // pending | preparing | ready | completed | cancelled
    notes: "Please brew the Nel drip with slow extraction.",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  }
];

const sampleReservations = [
  {
    id: "res_2001",
    reservationCode: "YORU-RES-2001",
    userId: "usr_guest_demo",
    customerName: "Aoi Tanaka",
    customerEmail: "aoi.tanaka@example.com",
    customerPhone: "+81 90-9876-5432",
    partySize: 2,
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    timeSlot: "20:00",
    seatingArea: "booth",
    assignedTableId: "table_04",
    status: "confirmed", // pending | confirmed | seated | completed | cancelled
    specialOccasion: "Anniversary listening session",
    notes: "Prefers quieter corner if available.",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

const sampleUsers = [
  {
    id: "usr_guest_demo",
    firebaseUid: "firebase_demo_uid_123",
    email: "visitor@yoru-cafe.jp",
    displayName: "Yoru Enthusiast",
    role: "customer", // customer | staff | admin
    phone: "+81 90-5555-0199",
    loyaltyPoints: 340,
    loyaltyTier: "Vinyl Connoisseur",
    preferences: {
      favoriteBean: "Sumatra Mandheling (Aged)",
      roastPreference: "Dark",
      preferredSeating: "vinyl-listening-bar",
      dietary: ["dairy-free-optional"]
    },
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: "usr_admin_demo",
    firebaseUid: "firebase_admin_uid_789",
    email: "master@yoru-cafe.jp",
    displayName: "Kissaten Master",
    role: "admin",
    phone: "+81 90-7777-0100",
    loyaltyPoints: 9999,
    loyaltyTier: "Master Brewer",
    preferences: {},
    createdAt: new Date(Date.now() - 365 * 86400000).toISOString()
  }
];

module.exports = {
  categories,
  menuItems,
  seatingTables,
  sampleOrders,
  sampleReservations,
  sampleUsers
};

if (require.main === module) {
  require("dotenv").config();
  const store = require("../services/store");

  console.log("🌱 [Seed] Running manual database seed script...");
  store.seedFirestore()
    .then((res) => {
      console.log(`✨ [Seed] Database successfully populated (${res.mode} mode, ${res.seededCount} items).`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ [Seed] Error populating database:", err);
      process.exit(1);
    });
}

