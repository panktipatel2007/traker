/**
 * Automated Verification & API Test Suite
 * Tests all REST API endpoints for Menu, Orders, Reservations, Users, AI Recommendations, and Docs
 */

const http = require("http");
const app = require("../src/app");

const TEST_PORT = 5099;
let server;

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: TEST_PORT,
        ...options
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = res.headers["content-type"]?.includes("application/json")
              ? JSON.parse(data)
              : data;
            resolve({ status: res.statusCode, headers: res.headers, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, raw: data });
          }
        });
      }
    );

    req.on("error", reject);

    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log("\n🧪 Starting Smart Café Backend API Automated Tests...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  server = app.listen(TEST_PORT);

  try {
    // 1. Health check
    const health = await request({ path: "/api/health", method: "GET" });
    assert(health.status === 200 && health.data.status === "online", "GET /api/health returns online status");

    // 2. Menu - Get all items
    const menu = await request({ path: "/api/menu", method: "GET" });
    assert(menu.status === 200 && Array.isArray(menu.data.data) && menu.data.data.length > 0, `GET /api/menu returns ${menu.data?.data?.length} menu items`);

    // 3. Menu - Categories
    const categories = await request({ path: "/api/menu/categories", method: "GET" });
    assert(categories.status === 200 && categories.data.data.length >= 6, "GET /api/menu/categories returns populated categories with counts");

    // 4. Menu - Filter by search
    const searchRes = await request({ path: "/api/menu?search=Nel", method: "GET" });
    assert(searchRes.status === 200 && searchRes.data.data.some(i => i.name.includes("Nel")), "GET /api/menu?search=Nel filters correctly");

    // 5. Menu - Item details
    const itemDetails = await request({ path: "/api/menu/menu_001", method: "GET" });
    assert(itemDetails.status === 200 && itemDetails.data.data.name === "Midnight Nel Drip", "GET /api/menu/menu_001 returns Midnight Nel Drip");

    // 6. Orders - Create Order
    const newOrderPayload = {
      orderType: "dine-in",
      tableNumber: "T-01",
      customerInfo: {
        name: "Hiroshi Jazz",
        email: "hiroshi@kissaten.local",
        phone: "+81 90-1111-2222"
      },
      items: [
        {
          menuItemId: "menu_001",
          quantity: 2,
          customizations: { cream: "Fresh Hokkaido Jersey Cream (+¥50)" }
        },
        {
          menuItemId: "menu_008",
          quantity: 1
        }
      ],
      notes: "Please pour slowly."
    };

    const orderRes = await request(
      {
        path: "/api/orders",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      newOrderPayload
    );
    assert(orderRes.status === 201 && orderRes.data.success === true, "POST /api/orders creates order with calculated total");
    const createdOrderId = orderRes.data.data.id;

    // 7. Orders - Track Order
    const trackRes = await request({ path: `/api/orders/${createdOrderId}`, method: "GET" });
    assert(trackRes.status === 200 && trackRes.data.data.status === "received", "GET /api/orders/:id retrieves order tracking timeline");

    // 8. Reservations - Check availability
    const availRes = await request({ path: "/api/reservations/availability?date=2026-09-15&partySize=2", method: "GET" });
    assert(availRes.status === 200 && Array.isArray(availRes.data.slots), "GET /api/reservations/availability returns slots list");

    // 9. Reservations - Book table
    const bookingPayload = {
      customerName: "Sayaka M.",
      customerPhone: "+81 90-3333-4444",
      customerEmail: "sayaka@example.com",
      partySize: 2,
      date: "2026-09-15",
      timeSlot: "19:00",
      seatingArea: "booth",
      notes: "Looking forward to listening session."
    };
    const bookingRes = await request(
      {
        path: "/api/reservations",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      bookingPayload
    );
    assert(bookingRes.status === 201 && bookingRes.data.data.reservationCode.startsWith("YORU-RES-"), "POST /api/reservations confirms booking with code");

    // 10. Users - Sync Firebase User
    const userSyncPayload = {
      firebaseUid: "fb_test_guest_99",
      email: "newguest@smart-cafe.jp",
      displayName: "Sayaka Jazz Lover",
      phone: "+81 90-8888-9999"
    };
    const userRes = await request(
      {
        path: "/api/users/sync",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      userSyncPayload
    );
    assert(userRes.status === 201 && userRes.data.data.loyaltyPoints === 50, "POST /api/users/sync provisions user with 50 loyalty points");

    // 11. AI Recommendations - Personalize
    const aiRecRes = await request(
      {
        path: "/api/recommendations/personalize",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      {
        mood: "reflective",
        timeOfDay: "midnight",
        flavorProfile: "bitter-rich dark chocolate",
        dietary: ["dairy-free"]
      }
    );
    assert(aiRecRes.status === 200 && aiRecRes.data.data.primaryItem && aiRecRes.data.data.recommendedVinyl, "POST /api/recommendations/personalize generates drink, pairing, and vinyl");

    // 12. AI Recommendations - Item Pairing
    const pairingRes = await request(
      {
        path: "/api/recommendations/pairing",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      { menuItemId: "menu_001" }
    );
    assert(pairingRes.status === 200 && pairingRes.data.data.suggestedPairings.length > 0, "POST /api/recommendations/pairing suggests food pairings and flavor tips");

    // 13. Documentation - Swagger JSON
    const docsJson = await request({ path: "/api/docs/swagger.json", method: "GET" });
    assert(docsJson.status === 200 && docsJson.data.openapi === "3.0.3", "GET /api/docs/swagger.json serves OpenAPI 3.0 specification");

    console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed\n`);
  } catch (err) {
    console.error("Test execution failed:", err);
    failed++;
  } finally {
    server.close();
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();
