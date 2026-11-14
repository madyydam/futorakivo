# Volume 03: APIs, Webhooks & MCP Technical Document

> **KIVO — Software for Restaurant Management Simplified**  
> Document Type: API, Webhook & Model Context Protocol (MCP) Technical Document  
> Companion Architecture Doc: [`02-TECHNICAL-ARCHITECTURE.md`](./02-TECHNICAL-ARCHITECTURE.md)  
> Version: 1.0.0  
> Status: Approved / Production Integration  

---

## 1. Authentication & API Key Scopes

KIVO provides two distinct integration layers:
1. **REST Integration API**: Server-to-server HTTP API for external websites, mobile apps, self-service kiosks, and delivery aggregators.
2. **Model Context Protocol (MCP) Server**: Direct AI assistant interface (Claude Desktop, Cursor, Antigravity) allowing AI agents to query orders, check live tables, and manage menus within staff permissions.

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
| `orders:read_customer` | Access customer phone numbers and delivery addresses (GDPR/DPDP restricted). |
| `orders:write` | Inject new takeaway, dine-in, or delivery orders. |
| `reservations:read` | Query table reservations, guest counts, and booking slots. |
| `reservations:write` | Create table reservations or update reservation seating status. |

---

## 2. Integration REST API Endpoints

### 2.1 Base URL
```text
https://www.kivo.futoragroup.in/api/v1/integrations
```

### 2.2 Endpoint Reference

#### A. List Active Branches
```http
GET /locations
```
**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "brn_mumbai_01",
      "name": "Bandra West Flagship",
      "currency": "INR",
      "timezone": "Asia/Kolkata",
      "address": "Hill Road, Bandra West, Mumbai 400050",
      "taxScheme": "GST_STANDARD_5"
    }
  ]
}
```

#### B. Fetch Branch Menu
```http
GET /locations/:branchId/menu
```
**Response (200 OK):**
```json
{
  "categories": [
    {
      "id": "cat_woodfired_pizza",
      "name": "Woodfired Pizza",
      "sortOrder": 1,
      "items": [
        {
          "id": "item_margherita",
          "name": "Classic Margherita",
          "basePrice": 450,
          "isVeg": true,
          "isAvailable": true,
          "modifierGroups": ["mod_cheese", "mod_crust"]
        }
      ]
    }
  ]
}
```

#### C. Create External Order (with Idempotency)
```http
POST /locations/:branchId/orders
Idempotency-Key: c9d8e7a6-b5c4-4321-a1b2-c3d4e5f60718
```
**Request Body:**
```json
{
  "type": "DELIVERY",
  "customerName": "Rohan Sharma",
  "customerPhone": "+919876543210",
  "delivery": {
    "addressLine1": "Flat 402, Sea Green Apartments",
    "landmark": "Near Bandra Post Office",
    "pincode": "400050"
  },
  "items": [
    {
      "menuItemId": "item_margherita",
      "quantity": 2,
      "selectedModifiers": ["mod_extra_mozzarella"],
      "prepNotes": "Well done crust, please"
    }
  ]
}
```
**Response (201 Created):**
```json
{
  "orderId": "ord_8829104",
  "orderNumber": 108,
  "status": "ACCEPTED",
  "subtotal": 900,
  "taxes": { "cgst": 22.5, "sgst": 22.5 },
  "deliveryFee": 40,
  "totalAmount": 985,
  "estimatedPrepMinutes": 20
}
```

---

## 3. Webhook Notifications & Signature Verification

KIVO dispatches real-time HTTPS webhooks for critical restaurant events.

### 3.1 Supported Webhook Events
- `order.created`: Triggered when an order is submitted via POS, aggregator, or kiosk.
- `order.status_updated`: Dispatched on KDS ticket bumps (`PREPARING`, `READY`, `DISPATCHED`).
- `payment.settled`: Dispatched when a bill payment is recorded.
- `inventory.low_stock`: Fired when a raw ingredient dips below its safety reorder threshold.

### 3.2 HMAC-SHA256 Signature Verification
Every webhook includes two security headers:
- `X-KIVO-Timestamp`: Current UNIX timestamp in seconds.
- `X-KIVO-Signature`: `sha256=HEX_ENCODED_HMAC_SIGNATURE`.

#### Node.js / Express Verification Example:
```typescript
import crypto from "crypto";

export function verifyKivoWebhook(
  rawBody: string,
  timestamp: string,
  incomingSignature: string,
  secretKey: string
): boolean {
  // 1. Prevent replay attacks: Reject payloads older than 5 minutes
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) {
    return false;
  }

  // 2. Compute expected HMAC-SHA256 signature
  const signedPayload = `${timestamp}.${rawBody}`;
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(signedPayload)
    .digest("hex");

  const expectedSignature = `sha256=${computedHash}`;

  // 3. Constant-time string comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(incomingSignature),
    Buffer.from(expectedSignature)
  );
}
```

---

## 4. Model Context Protocol (MCP) Server for AI Agents

KIVO ships with an embedded **Model Context Protocol (MCP)** server, enabling AI assistants (such as Claude Desktop, Cursor, or Antigravity) to safely interact with restaurant operations.

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
| `update_table_status` | `tables:write` | Updates table occupancy state (`VACANT`, `SEATED`, `BILLED`). |
| `list_low_stock` | `inventory:read` | Lists all ingredients currently beneath minimum reorder thresholds. |
| `clock_in` / `clock_out` | Staff Self | Logs staff attendance timestamps without administrative bypass. |

---

## 5. Food Delivery Aggregator Bridges (Swiggy / Zomato)

KIVO's integration engine includes a universal payload adapter that normalizes third-party delivery webhooks into standard KIVO order structures:

```
[Swiggy / Zomato Webhook]
          │
          ▼
[Payload Normalizer DTO]
          │
          ├── Maps Aggregator Item IDs ──► KIVO MenuItem IDs
          ├── Normalizes Tax Breakdown ──► CGST / SGST split
          ├── Rider Arrival Time       ──► KDS Dispatch Timer
          │
          ▼
[KIVO Central Kitchen Queue (KDS & Thermal Print)]
```
