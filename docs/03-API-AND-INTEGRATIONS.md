# Volume 03: APIs, Webhooks & MCP Technical Document

> **KIVOKO RESTAURANT OS — Enterprise Cloud & Offline-First POS System**  
> Document Type: API, Webhook & Model Context Protocol (MCP) Technical Document  
> Companion Architecture Doc: [`02-TECHNICAL-ARCHITECTURE.md`](./02-TECHNICAL-ARCHITECTURE.md)  
> Version: 1.0.0  
> Status: Approved / Production Integration  

---

## 1. Authentication & API Key Scopes

KIVOKO provides three distinct API integration layers:
1. **REST Integration API**: Server-to-server HTTP API for external websites, mobile apps, self-service kiosks, and delivery aggregators.
2. **Public Guest QR API**: Lightweight, tokenless/session-isolated endpoints for mobile guest QR menu viewing and self-ordering.
3. **Model Context Protocol (MCP) Server**: Direct AI assistant interface (Claude Desktop, Cursor, Antigravity) allowing AI agents to query orders, check live tables, and manage menus within staff permissions.

### 1.1 API Key Headers
All requests to the Integration API must supply an API key in the `Authorization` header:
```http
Authorization: Bearer ordr_ext_live_9f83a04c...
Content-Type: application/json
```

### 1.2 Granular Permission Scopes

| Scope Identifier | Permitted Operations |
| :--- | :--- |
| `locations:read` | Retrieve branch metadata, opening hours, and floor IDs. |
| `menu:read` | Read public menus, categories, modifier groups, and current dish pricing. |
| `menu:write` | Update item availability (86-ing dishes) or modify prices. |
| `orders:read` | Query active and historical branch orders, item states, and payment status. |
| `orders:read_customer` | Access customer phone numbers and delivery addresses (DPDP restricted). |
| `orders:write` | Inject new takeaway, dine-in, or delivery orders. |
| `reservations:read` | Query table reservations, guest counts, and booking slots. |
| `reservations:write` | Create table reservations or update reservation seating status. |

---

## 2. Core API Endpoint Reference

### 2.1 Device Pairing & Session Management
- **Generate Pairing Code**: `POST /v1/devices/codes` (Requires `device.manage` permission)  
  *Response:* `{ "code": "849201", "expiresAt": "2026-11-24T10:15:00Z" }`
- **Pair Physical Terminal**: `POST /v1/devices/pair` (Throttled: 10 requests / minute)  
  *Body:* `{ "pairingCode": "849201", "name": "Counter POS 1", "deviceType": "TERMINAL" }`  
  *Response:* `{ "deviceSessionToken": "dev_sess_...", "branchId": "..." }`
- **Fast Staff PIN Login**: `POST /v1/auth/pin-login` (Throttled: 5 requests / minute)  
  *Body:* `{ "userId": "usr_123", "pin": "123456" }`  
  *Response:* `{ "accessToken": "staff_jwt_...", "user": { "id": "...", "role": "CASHIER", "permissions": [...] } }`

### 2.2 In-Place Manager Approvals (🔐)
- **Request Manager Approval**: `POST /v1/approvals/request` (Throttled: 10 requests / minute)  
  *Body:* `{ "action": "DISCOUNT_APPLY", "reason": "VIP Guest Discount", "details": { "discountPercent": 15, "orderId": "ord_..." } }`  
  *Response:* `{ "requestId": "appr_9921", "status": "PENDING" }`
- **Verify Manager PIN**: `POST /v1/approvals/verify`  
  *Body:* `{ "requestId": "appr_9921", "managerPin": "654321" }`  
  *Response:* `{ "approved": true, "approvalToken": "tok_appr_...", "managerName": "Sarah Manager" }`

### 2.3 Public Guest QR Menu & Self-Ordering
- **Fetch Guest Menu**: `GET /v1/public/menu/:slug` (Cached, public read)  
  *Response:* Returns categories, veg/non-veg tags, allergen warnings, prices, and QR mode (`MODE_A` or `MODE_B`).
- **Submit Guest Table Order**: `POST /v1/public/menu/:slug/order`  
  *Headers:* `Idempotency-Key: <uuid>`  
  *Body:* `{ "tableToken": "tbl_tok_...", "guestName": "Rahul", "guestPhone": "9876543210", "items": [...] }`  
  *Response:* `{ "orderId": "ord_...", "orderNumber": 42, "acceptance": "PENDING" }`  
  *Safety:* Blocked if `QrSettings.emergencyPause` is active, or if guest phone is in `GuestBlock`.
- **Call Waiter / Request Bill**: `POST /v1/public/menu/:slug/request`  
  *Body:* `{ "tableToken": "tbl_tok_...", "type": "CALL_WAITER" | "REQUEST_BILL" }`

### 2.4 Offline IndexedDB Replay Sync
- **Reconcile Offline Outbox**: `POST /v1/sync`  
  *Body:* `{ "branchId": "brn_...", "actions": [ { "actionId": "...", "type": "ORDER_CREATE", "payload": {...}, "timestamp": "..." } ] }`  
  *Response:* `{ "processed": 4, "conflicts": [], "reconciledAt": "..." }`

### 2.5 Owner Onboarding Wizard Endpoints
- **Get Onboarding State**: `GET /v1/onboarding` (Requires `settings.manage`)  
  *Response:* `{ "currentStep": 3, "completedSteps": [1, 2], "draftJson": {...}, "restaurant": {...} }`
- **Save Step Progress (Autosave)**: `PUT /v1/onboarding/progress` (Throttled: 60/min, `AuditAction`)  
  *Body:* `{ "currentStep": 4, "completedStep": 3, "draftJson": {...} }` (Cap: 500KB, prototype-sanitized)  
  *Response:* Updated step & draft record.
- **Complete Onboarding & Materialize**: `POST /v1/onboarding/complete` (Throttled: 10/min, `AuditAction`)  
  *Operation:* Executes XSS sanitization, parallel Bcrypt staff hashing, transactional insertion of tables, menu items, kitchen stations, UPI configs, and transitions tenant status from `SETUP` to `TRIAL`.  
  *Response:* `{ "success": true, "message": "Onboarding completed", "redirect": "/dashboard" }`

### 2.6 Super Admin Multi-Tenant Endpoints
- **List Tenants**: `GET /v1/super-admin/tenants` (Super Admin Auth only)  
  *Response:* Paginated array of restaurants, subscription plan, tenant status (`SETUP`, `TRIAL`, `ACTIVE`, `FROZEN`), and branch counts.
- **Freeze / Unfreeze Tenant**: `POST /v1/super-admin/tenants/:id/freeze`  
  *Body:* `{ "reason": "Overdue invoice", "freezeBilling": true }`  
  *Response:* Updated tenant state with audit log.
- **Update Subscription Plan**: `POST /v1/super-admin/tenants/:id/plan`  
  *Body:* `{ "planTier": "ENTERPRISE", "expiresAt": "2027-12-31T23:59:59Z" }`

---

## 3. Webhook Notifications & Signature Verification

KIVOKO dispatches real-time HTTPS webhooks for critical restaurant events.

### 3.1 Supported Webhook Events
- `order.created`: Triggered when an order is submitted via POS, aggregator, or QR menu.
- `order.status_updated`: Dispatched on KDS ticket bumps (`PREPARING`, `READY`, `DISPATCHED`).
- `payment.settled`: Dispatched when a bill payment is recorded.
- `inventory.low_stock`: Fired when a raw ingredient dips below its safety reorder threshold.

### 3.2 HMAC-SHA256 Signature Verification
Every webhook includes two security headers:
- `X-KIVO-Timestamp`: Current UNIX timestamp in seconds.
- `X-KIVO-Signature`: `sha256=HEX_ENCODED_HMAC_SIGNATURE`.

```typescript
import crypto from "crypto";

export function verifyKivoWebhook(
  rawBody: string,
  timestamp: string,
  incomingSignature: string,
  secretKey: string
): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(signedPayload)
    .digest("hex");

  const expectedSignature = `sha256=${computedHash}`;
  return crypto.timingSafeEqual(
    Buffer.from(incomingSignature),
    Buffer.from(expectedSignature)
  );
}
```

---

## 4. Model Context Protocol (MCP) Server for AI Agents

KIVOKO ships with an embedded **Model Context Protocol (MCP)** server, enabling AI assistants (such as Claude Desktop, Cursor, or Antigravity) to safely interact with restaurant operations.

### 4.1 MCP Endpoint
```text
POST https://www.kivo.futoragroup.in/api/v1/mcp
Authorization: Bearer mcp_pat_live_...
```

### 4.2 Available MCP Tool Definitions

| Tool Name | Scope Required | Description |
| :--- | :--- | :--- |
| `list_locations` | `locations:read` | Returns all accessible restaurant branches and current open/closed status. |
| `dashboard_summary` | `orders:read` | Returns today's gross revenue, active table count, order count, and open KDS tickets. |
| `list_open_orders` | `orders:read` | Lists active dine-in and delivery orders currently in progress. |
| `create_order` | `orders:write` | Injects a new order into the live POS queue with modifier choices. |
| `update_table_status` | `tables:write` | Updates table occupancy state (`AVAILABLE`, `OCCUPIED`, `BILLED`). |
| `list_low_stock` | `inventory:read` | Lists all ingredients currently beneath minimum reorder thresholds. |
| `clock_in` / `clock_out` | Staff Self | Logs staff attendance timestamps without administrative bypass. |
