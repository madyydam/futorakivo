// Single source of truth for granular permissions in KIVO.
// Seeded as Permission rows; backend and frontend gate all access on these keys.
// Never check role names in code; always check permission keys.

export const PERMISSIONS = [
  // --- Canonical 38 Keys (KIVO Final Build Brief v1.0) ---
  { key: "table.view", label: "View Floors & Tables", category: "Tables" },
  { key: "order.create", label: "Create Orders & Add Items", category: "Orders" },
  { key: "order.send_kot", label: "Send KOT to Kitchen", category: "Orders" },
  { key: "order.modify", label: "Modify Own Orders / Assigned Tables", category: "Orders" },
  { key: "order.modify_any", label: "Modify Any Order", category: "Orders" },
  { key: "order.modify_after_kot", label: "Modify Order After KOT Sent", category: "Orders" },
  { key: "order.cancel_item", label: "Cancel Item on Order", category: "Orders" },
  { key: "table.transfer_merge", label: "Transfer & Merge Tables", category: "Tables" },
  { key: "table.assign", label: "Assign Tables to Staff", category: "Tables" },
  { key: "bill.generate_settle", label: "Generate & Settle Bills", category: "Billing" },
  { key: "bill.reprint", label: "Reprint Bills", category: "Billing" },
  { key: "bill.cancel_settled", label: "Void Settled Bill", category: "Billing" },
  { key: "bill.move_item", label: "Move Items Between Split Bills", category: "Billing" },
  { key: "discount.apply_small", label: "Apply Small Discount (<=5%)", category: "Billing" },
  { key: "discount.apply_any", label: "Apply Any Discount (>5%)", category: "Billing" },
  { key: "refund.process", label: "Process Refunds", category: "Billing" },
  { key: "kot.reprint", label: "Reprint KOT Tickets", category: "Kitchen" },
  { key: "kitchen.view_kot", label: "View & Update Kitchen Status", category: "Kitchen" },
  { key: "item.mark_out_of_stock", label: "Mark Items Out of Stock (86)", category: "Menu" },
  { key: "menu.view", label: "View Menu (Read-only)", category: "Menu" },
  { key: "menu.edit", label: "Edit Menu & Prices", category: "Menu" },
  { key: "payment.collect", label: "Collect Cash / UPI at Table", category: "Payments" },
  { key: "payment.verify", label: "Verify Received Payments", category: "Payments" },
  { key: "payment.void", label: "Void Verified Payment", category: "Payments" },
  { key: "qrorder.view", label: "View Incoming QR Orders Queue", category: "QR Orders" },
  { key: "qrorder.manage", label: "Accept, Reject & Edit QR Orders", category: "QR Orders" },
  { key: "qr.pause_ordering", label: "Emergency Pause QR Ordering", category: "QR Orders" },
  { key: "qr.generate", label: "Generate & Rotate QR Codes", category: "QR Orders" },
  { key: "qrsettings.manage", label: "Manage QR Menu Settings", category: "QR Orders" },
  { key: "qrsettings.payment", label: "Update Payment QR & UPI ID (Owner PIN)", category: "QR Orders" },
  { key: "guest.block", label: "Block Abusive Guest / Phone", category: "QR Orders" },
  { key: "device.manage", label: "Pair, Approve & Revoke Devices", category: "Devices" },
  { key: "device.unlock", label: "Unlock Locked Device Early", category: "Devices" },
  { key: "staff.manage", label: "Manage Staff, Roles & PINs", category: "Admin" },
  { key: "reports.view_basic", label: "View Basic Sales Reports", category: "Reports" },
  { key: "reports.view_all", label: "View All Reports & Financials", category: "Reports" },
  { key: "settings.tax", label: "Manage Taxes & Outlet Settings", category: "Admin" },
  { key: "data.bulk_delete", label: "Bulk Delete & Reset Data", category: "Admin" },

  // --- Preserved Legacy Keys (Ensures Zero Regression for Existing Code) ---
  { key: "sales.view", label: "View Sales", category: "Sales" },
  { key: "dashboard.sales.view", label: "View Dashboard Revenue & Sales Reports", category: "Sales" },
  { key: "orders.create", label: "Create Orders (Legacy)", category: "Orders" },
  { key: "orders.edit", label: "Edit Orders (Legacy)", category: "Orders" },
  { key: "orders.cancel", label: "Cancel Orders (Legacy)", category: "Orders" },
  { key: "orders.accept", label: "Accept / Decline Incoming Orders", category: "Orders" },
  { key: "discounts.apply", label: "Apply Discounts (Legacy)", category: "Orders" },
  { key: "discounts.unlimited", label: "Discount Above the Cashier Limit", category: "Orders" },
  { key: "refunds.process", label: "Process Refunds (Legacy)", category: "Orders" },
  { key: "orders.delete", label: "Delete Past Transactions (Legacy)", category: "Orders" },
  { key: "bills.print", label: "Print Bills (Legacy)", category: "Orders" },
  { key: "tables.view", label: "View Floors & Tables (Legacy)", category: "Tables" },
  { key: "tables.manage", label: "Manage Tables (Legacy)", category: "Tables" },
  { key: "menu.manage", label: "Manage Menu (Legacy)", category: "Menu" },
  { key: "inventory.manage", label: "Manage Inventory", category: "Inventory" },
  { key: "reports.access", label: "Access Reports (Legacy)", category: "Reports" },
  { key: "users.manage", label: "Manage Users (Legacy)", category: "Admin" },
  { key: "reports.financial.view", label: "View Financial Reports (Legacy)", category: "Reports" },
  { key: "data.export", label: "Export Data", category: "Reports" },
  { key: "kds.manage", label: "Manage Kitchen Display (Legacy)", category: "Kitchen" },
  { key: "reservations.manage", label: "Manage Reservations", category: "Reservations" },
  { key: "settings.manage", label: "Manage Settings (Legacy)", category: "Admin" },
  { key: "customers.manage", label: "Manage Customers & Loyalty", category: "CRM" },
  { key: "audit_log.view", label: "View Audit Log", category: "Admin" },
  { key: "roles.manage", label: "Manage Roles (Legacy)", category: "Admin" },
  { key: "backup.manage", label: "Manage Backups", category: "Admin" },
  { key: "attendance.manage", label: "Manage Staff Attendance", category: "Staff" },
  { key: "delivery.manage", label: "Manage Deliveries", category: "Delivery" },
  { key: "delivery.rider", label: "Use the Rider App (own deliveries)", category: "Delivery" },
  { key: "accounting.manage", label: "Manage Accounting", category: "Accounting" },
  { key: "marketing.manage", label: "Manage Coupons, Promotions & Campaigns", category: "Marketing" },
  { key: "operations.manage", label: "Manage Equipment & Documents", category: "Operations" },
  { key: "system.update", label: "Manage App Updates", category: "Admin" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

// Canonical permissions automatically satisfy their legacy equivalents so no existing route breaks.
export const PERMISSION_IMPLIES: Partial<Record<PermissionKey, PermissionKey[]>> = {
  // Canonical -> Legacy mappings:
  "order.create": ["orders.create"],
  "order.modify": ["orders.edit"],
  "order.modify_any": ["order.modify", "orders.edit"],
  "order.cancel_item": ["orders.cancel"],
  "table.view": ["tables.view"],
  "table.transfer_merge": ["tables.manage"],
  "table.assign": ["tables.manage"],
  "bill.generate_settle": ["bills.print"],
  "bill.reprint": ["bills.print"],
  "discount.apply_small": ["discounts.apply"],
  "discount.apply_any": ["discount.apply_small", "discounts.apply", "discounts.unlimited"],
  "discounts.unlimited": ["discount.apply_any", "discount.apply_small"],
  "refund.process": ["refunds.process"],
  "kitchen.view_kot": ["kds.manage"],
  "menu.edit": ["menu.manage", "menu.view"],
  "menu.manage": ["menu.view", "menu.edit"],
  "qrorder.manage": ["qrorder.view"],
  "device.manage": ["device.unlock"],
  "reports.view_all": ["reports.access", "reports.financial.view", "reports.view_basic"],
  "reports.view_basic": ["reports.access"],
  "staff.manage": ["users.manage", "roles.manage"],
  "settings.tax": ["settings.manage"],
  "data.bulk_delete": ["orders.delete"],
  // Legacy -> Canonical back-compat mappings:
  "orders.create": ["order.create"],
  "orders.edit": ["order.modify"],
  "orders.cancel": ["order.cancel_item"],
  "tables.view": ["table.view"],
  "tables.manage": ["table.view", "tables.view", "table.transfer_merge", "table.assign"],
  "kds.manage": ["kitchen.view_kot"],
  "reports.access": ["reports.view_basic"],
  "users.manage": ["staff.manage"],
  "settings.manage": ["settings.tax"],
};

// Precomputed reverse-lookup index to evaluate permission satisfaction in O(1) without heap allocation
const IMPLIED_BY = new Map<string, string[]>();
for (const [owner, implied] of Object.entries(PERMISSION_IMPLIES)) {
  for (const imp of implied as string[]) {
    const list = IMPLIED_BY.get(imp);
    if (list) {
      list.push(owner);
    } else {
      IMPLIED_BY.set(imp, [owner]);
    }
  }
}

/** True when `held` satisfies `required`, directly or through PERMISSION_IMPLIES. */
export function permissionSatisfied(held: readonly string[], required: string): boolean {
  if (held.includes("*") || held.includes("all")) return true;
  if (held.includes(required)) return true;
  const granters = IMPLIED_BY.get(required);
  if (!granters) return false;
  return granters.some((g) => held.includes(g));
}

// Roles allowed to view the high-level revenue dashboard
export const SALES_DASHBOARD_DEFAULT_ROLES = [
  "OWNER",
  "ADMINISTRATOR",
  "ACCOUNTANT",
  "CASHIER",
] as const;

export const STAFF_ROLES = [
  "OWNER",
  "ADMINISTRATOR",
  "RESTAURANT_MANAGER",
  "CAPTAIN",
  "CASHIER",
  "WAITER",
  "KITCHEN_STAFF",
  "CHEF",
  "BARTENDER",
  "DELIVERY_STAFF",
  "ACCOUNTANT",
  "INVENTORY_MANAGER",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

// Initial default permission sets seeded on creation; individually toggleable by Owner
export const DEFAULT_ROLE_PERMISSIONS: Record<StaffRole, PermissionKey[]> = {
  OWNER: PERMISSIONS.map((p) => p.key),
  ADMINISTRATOR: PERMISSIONS.map((p) => p.key),

  RESTAURANT_MANAGER: [
    "table.view", "order.create", "order.send_kot", "order.modify", "order.modify_any",
    "order.modify_after_kot", "order.cancel_item", "table.transfer_merge", "table.assign",
    "bill.generate_settle", "bill.reprint", "bill.cancel_settled", "bill.move_item",
    "discount.apply_small", "discount.apply_any", "refund.process", "kot.reprint",
    "kitchen.view_kot", "item.mark_out_of_stock", "menu.view", "menu.manage", "payment.collect",
    "payment.verify", "payment.void", "qrorder.view", "qrorder.manage", "qr.pause_ordering",
    "qr.generate", "guest.block", "device.unlock", "reports.view_basic",
    // Preserved operational capabilities:
    "sales.view", "reservations.manage", "customers.manage", "attendance.manage",
    "delivery.manage", "staff.manage", "accounting.manage", "marketing.manage",
    "operations.manage", "inventory.manage",
  ],

  CAPTAIN: [
    "table.view", "order.create", "order.send_kot", "order.modify", "table.transfer_merge",
    "table.assign", "kot.reprint", "item.mark_out_of_stock", "menu.view", "payment.collect",
    "payment.verify", "qrorder.view", "qrorder.manage", "guest.block",
    "reservations.manage", "customers.manage",
  ],

  CASHIER: [
    "table.view", "order.create", "order.send_kot", "order.modify", "table.transfer_merge",
    "bill.generate_settle", "bill.reprint", "bill.move_item", "discount.apply_small",
    "kot.reprint", "menu.view", "payment.collect", "payment.verify", "qrorder.view",
    "qrorder.manage", "reports.view_basic", "sales.view", "dashboard.sales.view",
    "customers.manage",
  ],

  WAITER: [
    "table.view", "order.create", "order.send_kot", "order.modify", "menu.view",
    "payment.collect", "qrorder.view", "bills.print",
  ],

  KITCHEN_STAFF: [
    "kitchen.view_kot", "kds.manage", "item.mark_out_of_stock", "orders.accept",
  ],

  CHEF: [
    "kitchen.view_kot", "item.mark_out_of_stock", "menu.view", "menu.edit",
  ],

  BARTENDER: [
    "table.view", "order.create", "order.send_kot", "order.modify", "menu.view",
    "kitchen.view_kot", "payment.collect", "qrorder.view", "item.mark_out_of_stock",
  ],

  DELIVERY_STAFF: [
    "order.modify", "delivery.manage", "delivery.rider",
  ],

  ACCOUNTANT: [
    "reports.view_basic", "reports.view_all", "bill.generate_settle", "bill.reprint",
    "payment.verify", "sales.view", "dashboard.sales.view", "data.export", "accounting.manage",
  ],

  INVENTORY_MANAGER: [
    "item.mark_out_of_stock", "inventory.manage", "reports.view_basic",
  ],
};
