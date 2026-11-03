// =============================================================================
// DEMO MODE CONFIGURATION
// Set DEMO_MODE = false when you launch live on Hostinger VPS with your real database.
// When true, allows instant login/signup with ANY credentials and provides
// realistic, rich pre-filled restaurant data for client demonstrations.
// =============================================================================
export const DEMO_MODE = true;

const ALL_PERMISSIONS = [
  "sales.view",
  "dashboard.sales.view",
  "orders.create",
  "orders.edit",
  "orders.cancel",
  "orders.accept",
  "discounts.apply",
  "discounts.unlimited",
  "refunds.process",
  "orders.delete",
  "bills.print",
  "tables.view",
  "tables.manage",
  "menu.view",
  "menu.manage",
  "inventory.manage",
  "reports.access",
  "users.manage",
  "reports.financial.view",
  "data.export",
  "kds.manage",
  "reservations.manage",
  "settings.manage",
  "customers.manage",
  "audit_log.view",
  "roles.manage",
  "backup.manage",
  "attendance.manage",
  "delivery.manage",
  "delivery.rider",
  "staff.manage",
  "accounting.manage",
  "marketing.manage",
  "operations.manage",
  "system.update",
];

const DEFAULT_DEMO_USER = {
  id: "usr-demo-owner",
  restaurantId: "rst-royal-spice",
  name: "Demo Admin",
  roleId: "rol-admin",
  roleName: "ADMIN",
  permissions: ALL_PERMISSIONS,
};

const DEMO_BRANCHES = [
  { id: "brn-main", name: "Main Dining Branch" },
  { id: "brn-rooftop", name: "Rooftop Lounge" },
];

const DEMO_CATEGORIES = [
  { id: "cat-starters", name: "Starters & Appetizers", sortOrder: 1, isActive: true, showOnWebsite: true, _count: { items: 4 } },
  { id: "cat-mains", name: "Main Course (North Indian)", sortOrder: 2, isActive: true, showOnWebsite: true, _count: { items: 5 } },
  { id: "cat-biryani", name: "Biryani & Rice", sortOrder: 3, isActive: true, showOnWebsite: true, _count: { items: 3 } },
  { id: "cat-breads", name: "Breads & Roti", sortOrder: 4, isActive: true, showOnWebsite: true, _count: { items: 3 } },
  { id: "cat-drinks", name: "Mocktails & Beverages", sortOrder: 5, isActive: true, showOnWebsite: true, _count: { items: 4 } },
  { id: "cat-desserts", name: "Desserts & Sweets", sortOrder: 6, isActive: true, showOnWebsite: true, _count: { items: 3 } },
];

const DEMO_STATIONS = [
  { id: "stn-curry", name: "Curry Kitchen" },
  { id: "stn-tandoor", name: "Tandoor Station" },
  { id: "stn-bar", name: "Bar & Beverages" },
  { id: "stn-dessert", name: "Dessert Counter" },
];

const DEMO_MENU_ITEMS = [
  // Starters
  {
    id: "item-1",
    categoryId: "cat-starters",
    stationId: "stn-tandoor",
    name: "Paneer Tikka Angara",
    imageUrl: null,
    price: "299",
    halfPrice: "180",
    taxRatePercent: "5",
    isVeg: true,
    isActive: true,
    isCombo: false,
    category: { id: "cat-starters", name: "Starters & Appetizers" },
    station: { id: "stn-tandoor", name: "Tandoor Station" },
    modifierGroups: [],
  },
  {
    id: "item-2",
    categoryId: "cat-starters",
    stationId: "stn-tandoor",
    name: "Murgh Malai Tikka",
    imageUrl: null,
    price: "360",
    halfPrice: "210",
    taxRatePercent: "5",
    isVeg: false,
    isActive: true,
    isCombo: false,
    category: { id: "cat-starters", name: "Starters & Appetizers" },
    station: { id: "stn-tandoor", name: "Tandoor Station" },
    modifierGroups: [],
  },
  {
    id: "item-3",
    categoryId: "cat-starters",
    stationId: "stn-curry",
    name: "Crispy Chilli Corn",
    imageUrl: null,
    price: "240",
    halfPrice: null,
    taxRatePercent: "5",
    isVeg: true,
    isActive: true,
    isCombo: false,
    category: { id: "cat-starters", name: "Starters & Appetizers" },
    station: { id: "stn-curry", name: "Curry Kitchen" },
    modifierGroups: [],
  },
  {
    id: "item-4",
    categoryId: "cat-starters",
    stationId: "stn-tandoor",
    name: "Tandoori Chicken (Half/Full)",
    imageUrl: null,
    price: "390",
    halfPrice: "240",
    taxRatePercent: "5",
    isVeg: false,
    isActive: true,
    isCombo: false,
    category: { id: "cat-starters", name: "Starters & Appetizers" },
    station: { id: "stn-tandoor", name: "Tandoor Station" },
    modifierGroups: [],
  },
  // Mains
  {
    id: "item-5",
    categoryId: "cat-mains",
    stationId: "stn-curry",
    name: "Butter Chicken Special",
    imageUrl: null,
    price: "420",
    halfPrice: "260",
    taxRatePercent: "5",
    isVeg: false,
    isActive: true,
    isCombo: false,
    category: { id: "cat-mains", name: "Main Course (North Indian)" },
    station: { id: "stn-curry", name: "Curry Kitchen" },
    modifierGroups: [],
  },
  {
    id: "item-6",
    categoryId: "cat-mains",
    stationId: "stn-curry",
    name: "Paneer Butter Masala",
    imageUrl: null,
    price: "340",
    halfPrice: "200",
    taxRatePercent: "5",
    isVeg: true,
    isActive: true,
    isCombo: false,
    category: { id: "cat-mains", name: "Main Course (North Indian)" },
    station: { id: "stn-curry", name: "Curry Kitchen" },
    modifierGroups: [],
  },
  {
    id: "item-7",
    categoryId: "cat-mains",
    stationId: "stn-curry",
    name: "Dal Makhani (Slow Cooked)",
    imageUrl: null,
    price: "290",
    halfPrice: null,
    taxRatePercent: "5",
    isVeg: true,
    isActive: true,
    isCombo: false,
    category: { id: "cat-mains", name: "Main Course (North Indian)" },
    station: { id: "stn-curry", name: "Curry Kitchen" },
    modifierGroups: [],
  },
  {
    id: "item-8",
    categoryId: "cat-mains",
    stationId: "stn-curry",
    name: "Kadhai Paneer",
    imageUrl: null,
    price: "330",
    halfPrice: "195",
    taxRatePercent: "5",
    isVeg: true,
    isActive: true,
    isCombo: false,
    category: { id: "cat-mains", name: "Main Course (North Indian)" },
    station: { id: "stn-curry", name: "Curry Kitchen" },
    modifierGroups: [],
  },
  // Biryani
  {
    id: "item-9",
    categoryId: "cat-biryani",
    stationId: "stn-curry",
    name: "Hyderabadi Dum Biryani (Chicken)",
    imageUrl: null,
    price: "380",
    halfPrice: null,
    taxRatePercent: "5",
    isVeg: false,
    isActive: true,
    isCombo: false,
    category: { id: "cat-biryani", name: "Biryani & Rice" },
    station: { id: "stn-curry", name: "Curry Kitchen" },
    modifierGroups: [],
  },
  {
    id: "item-10",
    categoryId: "cat-biryani",
    stationId: "stn-curry",
    name: "Subz Dum Biryani (Veg)",
    imageUrl: null,
    price: "310",
    halfPrice: null,
    taxRatePercent: "5",
    isVeg: true,
    isActive: true,
    isCombo: false,
    category: { id: "cat-biryani", name: "Biryani & Rice" },
    station: { id: "stn-curry", name: "Curry Kitchen" },
    modifierGroups: [],
  },
  // Breads
  {
    id: "item-11",
    categoryId: "cat-breads",
    stationId: "stn-tandoor",
    name: "Butter Garlic Naan",
    imageUrl: null,
    price: "75",
    halfPrice: null,
    taxRatePercent: "5",
    isVeg: true,
    isActive: true,
    isCombo: false,
    category: { id: "cat-breads", name: "Breads & Roti" },
    station: { id: "stn-tandoor", name: "Tandoor Station" },
    modifierGroups: [],
  },
  {
    id: "item-12",
    categoryId: "cat-breads",
    stationId: "stn-tandoor",
    name: "Tandoori Butter Roti",
    imageUrl: null,
    price: "35",
    halfPrice: null,
    taxRatePercent: "5",
    isVeg: true,
    isActive: true,
    isCombo: false,
    category: { id: "cat-breads", name: "Breads & Roti" },
    station: { id: "stn-tandoor", name: "Tandoor Station" },
    modifierGroups: [],
  },
  // Drinks
  {
    id: "item-13",
    categoryId: "cat-drinks",
    stationId: "stn-bar",
    name: "Mint Mojito Fresh",
    imageUrl: null,
    price: "160",
    halfPrice: null,
    taxRatePercent: "5",
    isVeg: true,
    isActive: true,
    isCombo: false,
    category: { id: "cat-drinks", name: "Mocktails & Beverages" },
    station: { id: "stn-bar", name: "Bar & Beverages" },
    modifierGroups: [],
  },
  {
    id: "item-14",
    categoryId: "cat-drinks",
    stationId: "stn-bar",
    name: "Fresh Lime Soda (Sweet/Salt)",
    imageUrl: null,
    price: "90",
    halfPrice: null,
    taxRatePercent: "5",
    isVeg: true,
    isActive: true,
    isCombo: false,
    category: { id: "cat-drinks", name: "Mocktails & Beverages" },
    station: { id: "stn-bar", name: "Bar & Beverages" },
    modifierGroups: [],
  },
  // Desserts
  {
    id: "item-15",
    categoryId: "cat-desserts",
    stationId: "stn-dessert",
    name: "Gulab Jamun with Rabri (2 Pcs)",
    imageUrl: null,
    price: "140",
    halfPrice: null,
    taxRatePercent: "5",
    isVeg: true,
    isActive: true,
    isCombo: false,
    category: { id: "cat-desserts", name: "Desserts & Sweets" },
    station: { id: "stn-dessert", name: "Dessert Counter" },
    modifierGroups: [],
  },
  {
    id: "item-16",
    categoryId: "cat-desserts",
    stationId: "stn-dessert",
    name: "Sizzling Brownie with Ice Cream",
    imageUrl: null,
    price: "220",
    halfPrice: null,
    taxRatePercent: "5",
    isVeg: true,
    isActive: true,
    isCombo: false,
    category: { id: "cat-desserts", name: "Desserts & Sweets" },
    station: { id: "stn-dessert", name: "Dessert Counter" },
    modifierGroups: [],
  },
];

const DEMO_FLOORS = [
  {
    id: "flr-ground",
    name: "Ground Floor - AC Dining",
    sortOrder: 1,
    tables: [
      { id: "tbl-1", floorId: "flr-ground", number: "T1", name: "Window Table", capacity: 4, status: "OCCUPIED", statusSince: new Date(Date.now() - 40 * 60000).toISOString(), posX: 40, posY: 40, width: 90, height: 90, rotation: 0, shape: "square", qrToken: "qr-t1", assignedWaiter: { id: "w-1", name: "Rahul" } },
      { id: "tbl-2", floorId: "flr-ground", number: "T2", name: "Booth 1", capacity: 6, status: "OCCUPIED", statusSince: new Date(Date.now() - 25 * 60000).toISOString(), posX: 160, posY: 40, width: 130, height: 90, rotation: 0, shape: "rect", qrToken: "qr-t2", assignedWaiter: { id: "w-2", name: "Amit" } },
      { id: "tbl-3", floorId: "flr-ground", number: "T3", name: "Family Corner", capacity: 8, status: "AVAILABLE", statusSince: new Date().toISOString(), posX: 320, posY: 40, width: 140, height: 100, rotation: 0, shape: "rect", qrToken: "qr-t3", assignedWaiter: null },
      { id: "tbl-4", floorId: "flr-ground", number: "T4", name: null, capacity: 4, status: "OCCUPIED", statusSince: new Date(Date.now() - 15 * 60000).toISOString(), posX: 40, posY: 180, width: 90, height: 90, rotation: 0, shape: "square", qrToken: "qr-t4", assignedWaiter: { id: "w-1", name: "Rahul" } },
      { id: "tbl-5", floorId: "flr-ground", number: "T5", name: null, capacity: 2, status: "RESERVED", statusSince: new Date(Date.now() - 60 * 60000).toISOString(), posX: 160, posY: 180, width: 80, height: 80, rotation: 0, shape: "round", qrToken: "qr-t5", assignedWaiter: null },
      { id: "tbl-6", floorId: "flr-ground", number: "T6", name: null, capacity: 4, status: "AVAILABLE", statusSince: new Date().toISOString(), posX: 270, posY: 180, width: 90, height: 90, rotation: 0, shape: "square", qrToken: "qr-t6", assignedWaiter: null },
      { id: "tbl-7", floorId: "flr-ground", number: "T7", name: "Center Round", capacity: 6, status: "OCCUPIED", statusSince: new Date(Date.now() - 32 * 60000).toISOString(), posX: 40, posY: 310, width: 110, height: 110, rotation: 0, shape: "round", qrToken: "qr-t7", assignedWaiter: { id: "w-3", name: "Pooja" } },
      { id: "tbl-8", floorId: "flr-ground", number: "T8", name: null, capacity: 4, status: "CLEANING", statusSince: new Date(Date.now() - 5 * 60000).toISOString(), posX: 180, posY: 310, width: 90, height: 90, rotation: 0, shape: "square", qrToken: "qr-t8", assignedWaiter: null },
    ],
  },
  {
    id: "flr-rooftop",
    name: "Rooftop Open Lounge",
    sortOrder: 2,
    tables: [
      { id: "tbl-r1", floorId: "flr-rooftop", number: "R1", name: "Skyline View", capacity: 4, status: "AVAILABLE", statusSince: new Date().toISOString(), posX: 50, posY: 50, width: 90, height: 90, rotation: 0, shape: "round", qrToken: "qr-r1", assignedWaiter: null },
      { id: "tbl-r2", floorId: "flr-rooftop", number: "R2", name: "Skyline View", capacity: 4, status: "OCCUPIED", statusSince: new Date(Date.now() - 20 * 60000).toISOString(), posX: 180, posY: 50, width: 90, height: 90, rotation: 0, shape: "round", qrToken: "qr-r2", assignedWaiter: { id: "w-2", name: "Amit" } },
      { id: "tbl-r3", floorId: "flr-rooftop", number: "R3", name: "Cabana 1", capacity: 8, status: "RESERVED", statusSince: new Date(Date.now() - 90 * 60000).toISOString(), posX: 320, posY: 50, width: 150, height: 100, rotation: 0, shape: "rect", qrToken: "qr-r3", assignedWaiter: null },
      { id: "tbl-r4", floorId: "flr-rooftop", number: "R4", name: null, capacity: 2, status: "AVAILABLE", statusSince: new Date().toISOString(), posX: 50, posY: 200, width: 75, height: 75, rotation: 0, shape: "square", qrToken: "qr-r4", assignedWaiter: null },
    ],
  },
];

const DEMO_KDS_TICKETS = [
  {
    id: "kot-1",
    orderId: "ord-demo-1",
    stationId: "stn-curry",
    ticketNumber: "K-104",
    status: "PREPARING",
    isPriority: false,
    printedCount: 1,
    lastPrintError: null,
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    station: { id: "stn-curry", name: "Curry Kitchen" },
    order: {
      orderNumber: "#1044",
      type: "DINE_IN",
      channel: "STAFF",
      notes: "Less spicy for child",
      table: { number: "T1", name: "Window Table" },
      guestName: "Vikram Malhotra",
      customer: { name: "Vikram Malhotra", phone: "+91 98765 11223" },
    },
    items: [
      { id: "ki-1", orderItem: { nameSnapshot: "Butter Chicken Special", quantity: 1, kitchenNote: "Boneless", modifiers: [] } },
      { id: "ki-2", orderItem: { nameSnapshot: "Dal Makhani", quantity: 1, kitchenNote: null, modifiers: [] } },
    ],
  },
  {
    id: "kot-2",
    orderId: "ord-demo-1",
    stationId: "stn-tandoor",
    ticketNumber: "K-105",
    status: "READY",
    isPriority: false,
    printedCount: 1,
    lastPrintError: null,
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    station: { id: "stn-tandoor", name: "Tandoor Station" },
    order: {
      orderNumber: "#1044",
      type: "DINE_IN",
      channel: "STAFF",
      notes: null,
      table: { number: "T1", name: "Window Table" },
      guestName: "Vikram Malhotra",
      customer: { name: "Vikram Malhotra", phone: "+91 98765 11223" },
    },
    items: [
      { id: "ki-3", orderItem: { nameSnapshot: "Butter Garlic Naan", quantity: 3, kitchenNote: "Crisp", modifiers: [] } },
      { id: "ki-4", orderItem: { nameSnapshot: "Paneer Tikka Angara", quantity: 1, kitchenNote: null, modifiers: [] } },
    ],
  },
  {
    id: "kot-3",
    orderId: "ord-demo-2",
    stationId: "stn-curry",
    ticketNumber: "K-106",
    status: "ACCEPTED",
    isPriority: true,
    printedCount: 1,
    lastPrintError: null,
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    station: { id: "stn-curry", name: "Curry Kitchen" },
    order: {
      orderNumber: "#1045",
      type: "TAKEAWAY",
      channel: "ONLINE",
      notes: "Pack extra mint chutney",
      table: null,
      guestName: "Sunita Roy",
      customer: { name: "Sunita Roy", phone: "+91 99887 76655" },
    },
    items: [
      { id: "ki-5", orderItem: { nameSnapshot: "Hyderabadi Dum Biryani (Chicken)", quantity: 2, kitchenNote: "Double raita", modifiers: [] } },
    ],
  },
];

export function getMockApiResponse(path: string, options: RequestInit = {}): unknown {
  const method = (options.method ?? "GET").toUpperCase();
  const cleanPath = path.replace(/^\/api\/v1/, "").replace(/^\/v1/, "").replace(/\?.*$/, "");

  // ---- AUTHENTICATION ----
  if (cleanPath === "/auth/login" || cleanPath === "/auth/register") {
    let userName = "Demo Manager";
    let restaurantName = "Royal Spice Restaurant & Bar";
    if (options.body && typeof options.body === "string") {
      try {
        const parsed = JSON.parse(options.body);
        if (parsed.ownerName) userName = parsed.ownerName;
        if (parsed.email && !parsed.ownerName) userName = parsed.email.split("@")[0];
        if (parsed.restaurantName) restaurantName = parsed.restaurantName;
      } catch {
        // ignore
      }
    }
    const user = {
      ...DEFAULT_DEMO_USER,
      name: userName,
      restaurantId: "rst-" + restaurantName.toLowerCase().replace(/\s+/g, "-"),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("horeca_demo_user", JSON.stringify(user));
      localStorage.setItem("nodedr_branch_id", "brn-main");
    }
    return { user };
  }

  if (cleanPath === "/auth/me") {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("horeca_demo_user");
      if (stored) {
        try {
          return { user: JSON.parse(stored) };
        } catch {
          // ignore
        }
      }
    }
    return { user: DEFAULT_DEMO_USER };
  }

  if (cleanPath === "/auth/logout") {
    if (typeof window !== "undefined") {
      localStorage.removeItem("horeca_demo_user");
    }
    return { success: true };
  }

  // ---- BRANCHES ----
  if (cleanPath === "/branches") {
    return DEMO_BRANCHES;
  }

  // ---- NOTIFICATIONS ----
  if (cleanPath === "/notifications") {
    return {
      data: [
        {
          id: "notif-1",
          branchId: "brn-main",
          recipientUserId: "usr-demo-owner",
          type: "order.created",
          title: "New Order #1044",
          body: "Table T1 placed order for Butter Chicken and Dal Makhani",
          entity: "Order",
          entityId: "ord-demo-1",
          readAt: null,
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: "notif-2",
          branchId: "brn-main",
          recipientUserId: "usr-demo-owner",
          type: "table.seated",
          title: "Table T4 Seated",
          body: "4 guests seated at Table T4 (Rahul serving)",
          entity: "Table",
          entityId: "tbl-4",
          readAt: new Date(Date.now() - 15 * 60000).toISOString(),
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        },
      ],
      total: 2,
      unreadCount: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
  }

  // ---- DASHBOARD ----
  if (cleanPath === "/dashboard/preferences") {
    return {
      topOrder: ["kpis", "attention", "charts"],
      cardOrder: ["tables", "kitchen", "recent", "channels"],
      hidden: [],
      trendDays: 14,
    };
  }

  if (cleanPath === "/dashboard/summary") {
    return {
      todayRevenue: 48920,
      todayOrders: 54,
      channels: { online: 18, offline: 36 },
      tables: { available: 8, occupied: 6, reserved: 2, cleaning: 1, outOfService: 0 },
      kitchenQueue: { new: 3, accepted: 2, preparing: 4, ready: 2 },
      pendingPayments: { count: 2, balance: 1840 },
      lowStock: 3,
      customers: 240,
      employees: 12,
      unpaidPayrollRuns: 0,
      recentOrders: [
        { id: "ord-101", orderNumber: "#1044", type: "DINE_IN", totalAmount: "1420", billedAt: new Date(Date.now() - 5 * 60000).toISOString() },
        { id: "ord-102", orderNumber: "#1043", type: "TAKEAWAY", totalAmount: "680", billedAt: new Date(Date.now() - 14 * 60000).toISOString() },
        { id: "ord-103", orderNumber: "#1042", type: "DELIVERY", totalAmount: "950", billedAt: new Date(Date.now() - 22 * 60000).toISOString() },
        { id: "ord-104", orderNumber: "#1041", type: "DINE_IN", totalAmount: "2350", billedAt: new Date(Date.now() - 35 * 60000).toISOString() },
        { id: "ord-105", orderNumber: "#1040", type: "DINE_IN", totalAmount: "890", billedAt: new Date(Date.now() - 48 * 60000).toISOString() },
      ],
    };
  }

  if (cleanPath === "/dashboard/trends") {
    const dates = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().split("T")[0];
    });
    return {
      revenue: dates.map((d, i) => ({ date: d, amount: 32000 + (i * 1200) + ((i % 3) * 3500) })),
      waste: dates.map((d) => ({ date: d, cost: 450 + Math.floor(Math.random() * 300) })),
    };
  }

  // ---- TABLES & FLOORS ----
  if (cleanPath === "/tables/floors") {
    return DEMO_FLOORS;
  }

  // ---- MENU ----
  if (cleanPath === "/menu/categories") {
    return DEMO_CATEGORIES;
  }

  if (cleanPath === "/menu/items") {
    return DEMO_MENU_ITEMS;
  }

  if (cleanPath === "/menu/stations" || cleanPath === "/kds/stations") {
    return DEMO_STATIONS;
  }

  // ---- KDS ----
  if (cleanPath === "/kds/tickets") {
    return DEMO_KDS_TICKETS;
  }

  // ---- INVENTORY LOW STOCK ----
  if (cleanPath === "/inventory/ingredients/low-stock") {
    return [
      { id: "ing-1", name: "Amul Butter", sku: "ING-001", unit: "kg", reorderLevel: "5", currentStock: "2.5", costPerUnit: "480", isActive: true },
      { id: "ing-2", name: "Basmati Rice (Premium)", sku: "ING-002", unit: "kg", reorderLevel: "20", currentStock: "8", costPerUnit: "110", isActive: true },
      { id: "ing-3", name: "Fresh Paneer", sku: "ING-003", unit: "kg", reorderLevel: "10", currentStock: "3", costPerUnit: "320", isActive: true },
    ];
  }

  // ---- SYSTEM UPDATES & BACKUPS ----
  if (cleanPath.startsWith("/system/update")) {
    return {
      currentVersion: "1.0.0",
      latestVersion: "1.0.0",
      updateAvailable: false,
      releaseUrl: null,
      checkedAt: new Date().toISOString(),
    };
  }

  if (cleanPath === "/backups/status") {
    return {
      configured: true,
      source: "environment",
      endpoint: "s3.amazonaws.com",
      bucket: "horeca-backups",
      region: "ap-south-1",
      accessKeyIdMasked: "AKIA••••••••",
      intervalDays: 1,
      retainCount: 7,
      lastBackup: null,
      nextScheduledAt: new Date(Date.now() + 86400000).toISOString(),
    };
  }

  if (cleanPath === "/backups") {
    return [];
  }

  if (cleanPath === "/orders/manage") {
    return [];
  }

  // ---- SETTINGS ----
  if (cleanPath === "/settings" || cleanPath === "/settings/business") {
    return {
      name: "Royal Spice Restaurant & Bar",
      phone: "+91 98765 43210",
      email: "contact@royalspice.in",
      address: "MG Road, Sector 14, Bengaluru",
      currency: "INR",
      currencySymbol: "₹",
      taxRate: "5",
      serviceChargeRate: "0",
      gstin: "29AAAAA0000A1Z5",
      fssaiLicense: "11223344556677",
    };
  }

  // ---- CUSTOMERS / CRM ----
  if (cleanPath === "/customers") {
    return {
      items: [
        { id: "c-1", name: "Vikram Malhotra", phone: "+91 98765 11223", email: "vikram@gmail.com", loyaltyPoints: 340, totalSpend: "18450", visitsCount: 14 },
        { id: "c-2", name: "Ananya Deshmukh", phone: "+91 98220 44556", email: "ananya.d@yahoo.com", loyaltyPoints: 520, totalSpend: "26800", visitsCount: 22 },
        { id: "c-3", name: "Rahul Verma", phone: "+91 97112 33445", email: "rahul.v@outlook.com", loyaltyPoints: 120, totalSpend: "6400", visitsCount: 5 },
      ],
      total: 3,
    };
  }

  // ---- ORDERS / POS MUTATIONS ----
  if (cleanPath === "/orders" && method === "POST") {
    const orderNum = `#${1046 + Math.floor(Math.random() * 50)}`;
    return {
      id: "ord-new-" + Date.now(),
      orderNumber: orderNum,
      subtotal: "850.00",
      taxAmount: "42.50",
      discountAmount: "0.00",
      tipAmount: "0.00",
      loyaltyPointsRedeemed: 0,
      loyaltyDiscountAmount: "0.00",
      totalAmount: "892.50",
      status: "COMPLETED",
      settlement: {
        amountDue: 892.5,
        amountPaid: 892.5,
        balanceDue: 0,
        changeDue: 0,
        fullyPaid: true,
      },
    };
  }

  // Generic fallback for any POST / PATCH / DELETE mutations
  if (method !== "GET") {
    return { success: true, message: "Demo action completed successfully" };
  }

  // For any other GET request: return an empty list or clean object so UI never crashes
  return [];
}
