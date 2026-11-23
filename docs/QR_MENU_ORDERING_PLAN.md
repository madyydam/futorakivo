# KIVOKO — QR Menu + Ordering Module
## Master Implementation Plan
_Authored: 2026-11-23 | Status: ARCHITECTURE PLAN_

---

## 1. What Already Exists (Reuse These — Don't Rebuild)

| Existing asset | Location | How QR module uses it |
|---|---|---|
| `Table.qrToken` | Prisma schema (line 613) | Already has the field — needs generation & rotation logic |
| `Table.status` | schema | Drives guest "table occupied" state |
| `Order` model | schema (line 1414) | QR orders become normal `Order` rows (`channel: QR_GUEST`) |
| `Order.channel` enum `STAFF` | schema | We add `QR_GUEST` to it |
| `Order.clientRequestId` | schema | Already the idempotency key field — reuse it |
| `Order.guestName` | schema | Already on Order model for QR orders |
| `Order.acceptance` | schema | `AcceptanceStatus` enum — drives staff-must-accept flow |
| `KOT` / `KotItem` | schema | QR orders generate KOTs via existing `kot-print.service.ts` |
| `MenuItem` | schema | Full menu data: price, tax, veg/non-veg, images, modifiers, time slots |
| `MenuCategory` | schema | `isActive` and `isPublic` flag for QR visibility |
| `ModifierGroup` / `Modifier` | schema | Variants and add-ons |
| `OrderItem` / `OrderItemModifier` | schema | QR order items map directly |
| `TableRequest` model | schema (line 1845) | Already exists — "Call Waiter" / "Request Bill" |
| `Branch` model | schema | Outlet — all QR settings scoped to branch |
| `pricing.ts` | orders/pricing.ts | Server-side price/tax computation — QR uses same function |
| `orders.service.ts` | modules/orders | QR order creation calls the same service |

---

## 2. Full Data Model — New Tables Only

### 2A. `QrSettings` (per branch/outlet)
```prisma
model QrSettings {
  id       String @id @default(cuid())
  branchId String @unique
  branch   Branch @relation(fields: [branchId], references: [id], onDelete: Cascade)

  // Core mode
  mode             QrMode          @default(MENU_ONLY)

  // Mode B sub-settings
  orderApproval    QrOrderApproval @default(STAFF_ACCEPT) // STAFF_ACCEPT | AUTO
  allowedTypes     OrderType[]     @default([DINE_IN])    // DINE_IN, TAKEAWAY
  multiGuestCart   Boolean         @default(false)        // multiple guests add to same order
  maxItemsPerOrder Int?                                   // null = unlimited
  maxOrderValue    Decimal?        @db.Decimal(12, 2)
  orderCooldownSec Int             @default(0)            // seconds between orders per session
  guestPhoneMode   GuestPhoneMode  @default(OPTIONAL)     // HIDDEN | OPTIONAL | REQUIRED

  // Display settings
  showImages       Boolean  @default(true)
  showOutOfStock   Boolean  @default(true)   // true = greyed out, false = hidden
  showPrices       Boolean  @default(true)
  languages        String[] @default(["en"]) // en, hi
  themeColor       String   @default("#FF6B35")
  logoUrl          String?
  welcomeMessage   String?

  // Operational toggles
  orderingPaused   Boolean  @default(false)
  serviceStartTime String?  // "HH:mm" — null = always open
  serviceEndTime   String?

  // Session verification modes (tradeoffs documented in comments)
  sessionVerification SessionVerification @default(NONE)
  // NONE:         no friction. First scan initiates session.
  // STAFF_CONFIRM: staff taps "confirm table" on POS before ordering goes live.
  // TABLE_CODE:   short 4-digit code printed on table tent / bill.
  // WIFI:         device must be on outlet's subnet (best security if Wi-Fi reliable).

  callWaiterEnabled  Boolean @default(true)
  requestBillEnabled Boolean @default(true)
  onlinePayEnabled   Boolean @default(false)  // Phase 7 (UPI)
  upiVpa             String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("qr_settings")
}

enum QrMode               { MENU_ONLY  ORDER }
enum QrOrderApproval      { STAFF_ACCEPT  AUTO }
enum SessionVerification   { NONE  STAFF_CONFIRM  TABLE_CODE  WIFI }
enum GuestPhoneMode       { HIDDEN  OPTIONAL  REQUIRED }
```

### 2B. `QrCode` — tokens for tables and counters
```prisma
model QrCode {
  id       String @id @default(cuid())
  branchId String
  branch   Branch @relation(fields: [branchId], references: [id], onDelete: Cascade)
  tableId  String?
  table    Table? @relation(fields: [tableId], references: [id], onDelete: Cascade)

  type      QrCodeType
  token     String     @unique   // HMAC-signed opaque slug
  isActive  Boolean    @default(true)
  rotatedAt DateTime?

  createdAt DateTime @default(now())
  sessions  QrSession[]

  @@index([branchId])
  @@index([token])
  @@map("qr_codes")
}

enum QrCodeType { TABLE  COUNTER  TAKEAWAY }
```

### 2C. `QrSession` — anti-abuse core
```prisma
model QrSession {
  id       String @id @default(cuid())
  qrCodeId String
  qrCode   QrCode @relation(fields: [qrCodeId], references: [id], onDelete: Cascade)
  branchId String

  status       QrSessionStatus @default(ACTIVE)
  sessionToken String          @unique   // given to guest device
  deviceHash   String?                   // hashed browser fingerprint
  tableCode    String?                   // 4-digit code for TABLE_CODE mode
  verifiedAt   DateTime?
  expiresAt    DateTime
  closedAt     DateTime?
  closedReason String?

  guestOrders        QrOrder[]
  callWaiterRequests CallWaiterRequest[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([sessionToken])
  @@index([qrCodeId, status])
  @@map("qr_sessions")
}

enum QrSessionStatus { ACTIVE  EXPIRED  CLOSED  VERIFICATION_PENDING }
```

### 2D. `QrOrder` — staging area before POS conversion
```prisma
model QrOrder {
  id        String    @id @default(cuid())
  branchId  String
  branch    Branch    @relation(fields: [branchId], references: [id], onDelete: Cascade)
  sessionId String
  session   QrSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  status         QrOrderStatus @default(PENDING)
  guestName      String?
  guestPhone     String?
  notes          String?       // max 500 chars; sanitised
  idempotencyKey String        @unique

  // Server-computed totals (never from client)
  subtotal  Decimal @default(0) @db.Decimal(12, 2)
  taxAmount Decimal @default(0) @db.Decimal(12, 2)
  total     Decimal @default(0) @db.Decimal(12, 2)

  orderId        String?  @unique   // set after staff accepts -> links to real Order
  order          Order?   @relation(fields: [orderId], references: [id], onDelete: SetNull)
  rejectedReason String?
  rejectedById   String?
  rejectedAt     DateTime?
  acceptedById   String?
  acceptedAt     DateTime?

  items  QrOrderItem[]
  events QrOrderEvent[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([branchId, status])
  @@index([sessionId])
  @@map("qr_orders")
}

enum QrOrderStatus { PENDING  ACCEPTED  REJECTED  AUTO_ACCEPTED }
```

### 2E. Items, Modifiers, Events, Waiter Requests
```prisma
model QrOrderItem {
  id          String   @id @default(cuid())
  qrOrderId   String
  qrOrder     QrOrder  @relation(fields: [qrOrderId], references: [id], onDelete: Cascade)
  menuItemId  String
  menuItem    MenuItem @relation(fields: [menuItemId], references: [id])
  quantity    Int
  unitPrice   Decimal  @db.Decimal(12, 2)  // server snapshot
  portionType String?  // "half" | "full"
  kitchenNote String?
  modifiers   QrOrderItemModifier[]
  @@map("qr_order_items")
}

model QrOrderItemModifier {
  id              String      @id @default(cuid())
  qrOrderItemId   String
  qrOrderItem     QrOrderItem @relation(fields: [qrOrderItemId], references: [id], onDelete: Cascade)
  modifierId      String
  modifier        Modifier    @relation(fields: [modifierId], references: [id])
  priceAdjustment Decimal     @db.Decimal(12, 2)  // server snapshot
  @@map("qr_order_item_modifiers")
}

model QrOrderEvent {
  id        String           @id @default(cuid())
  qrOrderId String
  qrOrder   QrOrder          @relation(fields: [qrOrderId], references: [id], onDelete: Cascade)
  event     QrOrderEventType
  message   String?
  actorId   String?
  createdAt DateTime         @default(now())
  @@index([qrOrderId, createdAt])
  @@map("qr_order_events")
}

enum QrOrderEventType { PLACED  ACCEPTED  REJECTED  PREPARING  READY  SERVED }

model CallWaiterRequest {
  id           String           @id @default(cuid())
  sessionId    String
  session      QrSession        @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  branchId     String
  type         WaiterRequestType
  status       WaiterReqStatus  @default(PENDING)
  resolvedAt   DateTime?
  resolvedById String?
  createdAt    DateTime         @default(now())
  @@index([branchId, status])
  @@map("call_waiter_requests")
}

enum WaiterRequestType { CALL_WAITER  REQUEST_BILL }
enum WaiterReqStatus   { PENDING      RESOLVED     }
```

### 2F. Additions to Existing Models
```prisma
// Order model — add:
qrOrderId  String?  @unique
qrOrder    QrOrder? @relation(...)

// OrderChannel enum — add:
QR_GUEST

// MenuItem model — add:
hideFromQr   Boolean @default(false)
isBestseller Boolean @default(false)
isSpicy      Boolean @default(false)
```

---

## 3. Token Design

```
URL:    https://order.kivoko.in/q/{base62_cuid}.{hmac_sha256_8bytes}
e.g.    https://order.kivoko.in/q/clx9z2a0f0000.a3b7c9d1

Security:
  - HMAC key = QR_SIGNING_SECRET env var (separate from JWT secret)
  - Rotating a QR: UPDATE qr_codes SET token = newToken, rotated_at = now()
  - Old token invalid immediately (unique index)
  - Never contains restaurant_id, table_id, or sequential numbers
```

---

## 4. API Design — Three Audiences

### A. Public (Guest) APIs — No Auth, Treat as Hostile
```
GET  /q/:token/menu              validate token -> public menu (no costs)
GET  /q/:token/settings          QR mode, theme, outlet hours
POST /q/:token/session           create/resume table session -> sessionToken cookie
POST /q/:token/orders            place order (requires valid session cookie)
GET  /q/:token/orders/:id/status poll order status + events (5s interval)
POST /q/:token/call-waiter       call waiter or request bill
```

**Enforced on every public endpoint:**
- Rate limit: 30 req/min/IP, 10 orders/min/session
- Server recomputes all prices — client price fields are IGNORED
- Every `menuItemId`/`modifierId` validated against this exact `branchId`
- Check item availability: time slot, `isActive`, `hideFromQr`, stock
- Input sanitisation: guestName ≤ 60 chars, notes ≤ 500 chars, phone regex
- Public response never includes: `costPrice`, `barcode`, staff data

### B. Staff (POS) APIs — `@Auth()`
```
GET    /v1/qr-orders                      qrorder.view    list pending QR orders
POST   /v1/qr-orders/:id/accept           qrorder.manage  accept -> Order + KOT
POST   /v1/qr-orders/:id/reject           qrorder.manage  reject with reason
PATCH  /v1/qr-orders/:id/items            qrorder.manage  edit before accepting
GET    /v1/qr-orders/waiter-calls         qrorder.view    waiter call queue
POST   /v1/qr-orders/waiter-calls/:id/resolve  qrorder.manage
POST   /v1/sessions/:id/close             qrorder.manage  close table session
```

### C. Owner/Manager APIs — `@Auth()`
```
GET    /v1/qr/settings/:branchId          qrsettings.manage
PUT    /v1/qr/settings/:branchId          qrsettings.manage
GET    /v1/qr/codes/:branchId             qr.generate  list all QR codes
POST   /v1/qr/codes/:branchId/generate   qr.generate  generate all table QRs
POST   /v1/qr/codes/:id/rotate            qr.generate  rotate single token
GET    /v1/qr/codes/:branchId/pdf         qr.generate  PDF download
GET    /v1/qr/codes/:id/preview           qr.generate  open guest URL
```

---

## 5. New RBAC Permission Keys

```ts
{ key: "qrorder.view",      label: "View QR Orders Queue",         category: "QR Orders" },
{ key: "qrorder.manage",    label: "Accept / Reject / Edit QR Orders", category: "QR Orders" },
{ key: "qrsettings.manage", label: "Manage QR Menu Settings",      category: "QR Orders" },
{ key: "qr.generate",       label: "Generate & Rotate QR Codes",   category: "QR Orders" },
```

| Role | qrorder.view | qrorder.manage | qrsettings.manage | qr.generate |
|---|:---:|:---:|:---:|:---:|
| OWNER | ✅ | ✅ | ✅ | ✅ |
| RESTAURANT_MANAGER | ✅ | ✅ | ✅ | ✅ |
| CASHIER | ✅ | ✅ | ❌ | ❌ |
| WAITER | ✅ | ❌ | ❌ | ❌ |
| KITCHEN_STAFF | ❌ | ❌ | ❌ | ❌ |

---

## 6. Guest-Side Architecture (Performance on 3G)

```
Route:  app/(guest)/q/[token]/page.tsx
        ^ completely separate from dashboard layout
        ^ no auth guards, no sidebar, no dashboard JS bundle
        ^ its own minimal layout

Bundle targets:
  < 80KB initial JS
  < 2s LCP on 3G
  Images: WebP 300x300 thumbnails, lazy loaded, blur placeholder
  Menu: stale-while-revalidate, 60s cache
  Cart: Zustand in localStorage (survives page refresh)
  Status: 5s polling, exponential backoff on errors

Component tree:
  GuestLayout (theme color, logo)
    ├── MenuPage
    │   ├── CategoryNav (sticky horizontal scroll)
    │   ├── SearchBar + FilterBar
    │   └── ItemGrid -> ItemCard -> AddToCartSheet
    ├── CartDrawer (floating bottom -> slide-up)
    │   └── CheckoutPage (review, taxes, guest info form)
    └── OrderStatusPage
        └── StatusTimeline (PLACED -> ACCEPTED -> PREPARING -> READY)
```

---

## 7. Table Session Logic

```
Guest scans QR
  -> GET /q/:token/menu (always works, no session)
  -> If ordering: POST /q/:token/session
      TABLE QR + no active session  -> CREATE QrSession, return sessionToken
      TABLE QR + active session     -> return existing session (multi-guest case)
      COUNTER/TAKEAWAY QR           -> always new session (no table)

Session expires:
  Hard: expiresAt (4h, configurable)
  Soft: staff closes bill -> POST /v1/sessions/:id/close -> status=CLOSED
  On expiry: scan starts fresh session; old orders preserved in history
```

---

## 8. QrOrder -> Order -> KOT Conversion

```
POST /q/:token/orders (guest places order):
  1. Validate session (active, not expired, table still open)
  2. Validate QrSettings (mode=ORDER, not paused, within service hours)
  3. Validate every item (branchId match, isActive, not hideFromQr, in time slot)
  4. Server recomputes totals via pricing.ts (client prices ignored)
  5. Idempotency: if idempotencyKey exists -> return existing QrOrder
  6. Create QrOrder + items (status=PENDING)
  7. Create QrOrderEvent(PLACED)
  8. Notify staff via existing WebSocket/realtime
  9. If orderApproval=AUTO -> auto-accept immediately (skip step below)

POST /v1/qr-orders/:id/accept (staff accepts):
  1. Load QrOrder, verify status=PENDING
  2. Find or create open Order for this table (merge into existing bill)
  3. Add QrOrderItems as OrderItems via orders.service
  4. Mark QrOrder.status=ACCEPTED, set orderId
  5. Generate KOT(s) via kot-print.service (station routing preserved)
  6. Emit QrOrderEvent(ACCEPTED)
  7. Update table status -> OCCUPIED
  8. Audit log entry
```

---

## 9. Edge Cases — Explicit Handling

| Edge case | Handling |
|---|---|
| Two guests ordering at same time on same table | Same `QrSession` + idempotencyKey on each submit — creates separate `QrOrder` rows, not duplicates |
| Guest leaves page open for hours | Session expiry checked on `POST /q/:token/orders`; 403 `SESSION_EXPIRED` -> "Scan QR again" |
| Item out-of-stock after adding to cart | Server re-validates ALL items on submit; 422 with item list -> "These items unavailable" |
| Staff rejects after guest sees "Received" | `QrOrderEvent(REJECTED)` -> polling picks it up -> guest sees reason + option to reorder |
| Owner switches Mode B -> Mode A | Settings cached max 60s; `POST /q/:token/orders` checks live mode; 403 `ORDERING_DISABLED` |
| Internet drops while placing order | Client retries with same `idempotencyKey`; server deduplicates -> returns original `QrOrder` |
| 100+ items with heavy images | Sections lazy-loaded per category; 300px WebP thumbnails; menu JSON cached 60s at CDN |

---

## 10. QR PDF Layout

```
Library: @react-pdf/renderer (Node.js, no browser needed)

Layouts: A4 (6 cards/page, 3x2) | A5 (4 cards/page, 2x2) | Table-tent (1/page, fold-ready)

Each card:
  +-------------------------+
  |  [Restaurant Logo]      |
  |  SPICE GARDEN           |
  |  Scan to view & order   |
  |  मेनू / ऑर्डर करें       |
  |  [QR CODE]              |
  |  Table 5                |
  |  Powered by KIVOKO      |
  +-------------------------+

Endpoint: GET /v1/qr/codes/:branchId/pdf?layout=A4&tableIds=1,2,3
  -> streams PDF, Content-Disposition: attachment
```

---

## 11. Security Checklist

- [ ] Token: HMAC-signed, never sequential, never contains IDs
- [ ] Token rotation: old token invalid immediately (unique index)
- [ ] All prices server-computed via `pricing.ts` — client prices ignored
- [ ] Every `menuItemId`/`modifierId` validated against `branchId`
- [ ] Session cookie: httpOnly, SameSite=Lax, 4h expiry
- [ ] Rate limits: 30/min/IP; 10 orders/min/session; per-table cooldown
- [ ] Idempotency: unique index on `qr_orders.idempotency_key`
- [ ] Input sanitisation: name ≤ 60, notes ≤ 500, phone regex
- [ ] Public APIs never return: `costPrice`, `barcode`, staff data
- [ ] Audit log: QR settings changes, rotations, accept/reject with actor
- [ ] Zero AI calls in order/session/menu flow
- [ ] CORS: guest routes allow `*`; staff/owner routes remain restricted
- [ ] Minimal PII: name + phone only when owner enables phone mode; consent shown

---

## 12. Clarifying Questions — 5 Before Phase 1

1. **Domain / hosting**: Will guest QR page live at `order.kivoko.in/q/:token` (subdomain) or same app domain `app.kivoko.in/q/:token`?
2. **Real-time**: For guest order status, do you prefer 5s polling (robust on weak 3G) or Socket.io connection?
3. **Images**: Are item images local uploads (`/api/uploads/`) or on Cloudflare/S3 CDN?
4. **Counter QR**: Does counter QR order require guest to enter token number/buzzer number, or purely order tracking?
5. **Languages**: For Hindi support, translate entire UI (buttons, labels) or only menu item data?

---

## 13. Phase Plan

| Phase | What gets built | Stop & wait for OK |
|---|---|:---:|
| **1** | Schema migrations + permission keys + API contract doc | [Wait] |
| **2** | Owner dashboard: QR settings UI + QR code generator + PDF export | [Wait] |
| **3** | Guest menu page (Mode A) — full perf optimisation | [Wait] |
| **4** | Mode B: cart + sessions + order placement + status page | [Wait] |
| **5** | Staff QR-orders queue + accept/reject + KOT/bill merge | [Wait] |
| **6** | Abuse protection + full test suite | [Wait] |
| **7** | UPI online payment (optional) | [Wait] |
