# Volume 04: POS Billing, Table Management & KDS Manual

> **KIVOKO RESTAURANT OS — Enterprise Cloud & Offline-First POS System**  
> Document Type: POS Billing, Table Management, Kitchen Operations & Fraud Prevention Manual  
> Companion PRD: [`01-PRD-PRODUCT-REQUIREMENTS.md`](./01-PRD-PRODUCT-REQUIREMENTS.md)  
> Version: 1.0.0  
> Status: Approved / Operational Runbook  

---

## 1. Daily Restaurant Operating Lifecycle

KIVOKO is built around a standard restaurant operating cadence:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DAILY RESTAURANT CADENCE                        │
├─────────────────────┬─────────────────────┬────────────────────────────┤
│ 1. MORNING OPENING  │ 2. SERVICE SHIFTS   │ 3. NIGHT CLOSE (Z-REPORT)  │
├─────────────────────┼─────────────────────┼────────────────────────────┤
│ • Count Cash Drawer │ • Sub-Second POS    │ • Finalize Open Tables     │
│ • Check Printer LAN │ • Tableside Captain │ • Cash Reconciliation      │
│ • Verify 86 Items   │ • KDS Prep Timers   │ • Settle Card / UPI Batches│
│ • Clock-In Staff PIN│ • Table Transfers   │ • Generate Day-End Report  │
│ • Pair Terminals    │ • QR Queue Review   │ • Zero Open Bills Audit    │
└─────────────────────┴─────────────────────┴────────────────────────────┘
```

---

## 2. Terminal Pairing & Fast 6-Digit PIN Switching

### 2.1 Hardware Registration & Pairing (`/pair`)
1. On the Admin Dashboard, the manager opens **Settings → Devices** and clicks **Generate Pairing Code**.
2. A single-use 6-digit code is generated (valid for 15 minutes).
3. The cashier terminal visits `/pair`, enters the code, and is authenticated via an atomic transaction.
4. The device is stored in `Device` with hardware fingerprinting, assigned an active branch, and issued a long-lived **Device Session Token**.

### 2.2 Operator 6-Digit PIN Login
- Each shift operator (waiter, cashier, captain, chef) logs in using an assigned 6-digit PIN.
- PINs are hashed using **bcrypt (10 rounds)**.
- Consecutive failed PIN attempts trigger a temporary lock to defeat dictionary attacks.
- Switching operators takes under 1 second without reloading pages or losing active drafts.

---

## 3. High-Velocity POS Billing Terminal (`/pos`)

### 3.1 The 3-Tap Checkout Workflow
1. **Tap 1: Category Selection**: Left sidebar categories (`Pizzas`, `Beverages`, `Desserts`) instantly filter dishes.
2. **Tap 2: Item & Modifiers**: Tapping an item opens modifiers (Crust, Cheese, Spice Level). Tapping **Add to Bill** attaches the item.
3. **Tap 3: Pay & Settle**: Tapping **Pay ₹[Total]** opens tender options. Selecting **Cash (Exact)** or **Scan UPI QR** settles the bill and dispatches raw binary ESC/POS thermal printing.

### 3.2 In-Place Manager Approvals (🔐)
When an operator attempts a protected action:
- **Discounts > 5%** (`discount.apply_any`)
- **Voiding a settled bill** (`bill.cancel_settled`)
- **Item cancellation after KOT dispatch** (`order.cancel_item`)
- **Manual refund processing** (`refund.process`)

The terminal locks the action with a persistent red **Approval Required** banner. A manager enters their 6-digit PIN directly into the modal to authorize the request without logging out the cashier.

### 3.3 Split Billing & Table Release Safeguards
KIVOKO supports three split-bill modes:
1. **Split by Item**: Drag individual dishes to separate sub-bills.
2. **Split by Seat**: Automatic checks per assigned diner seat.
3. **Split by Amount**: Divide the total check equally across $N$ guests and multiple tenders.

> **CRITICAL INVARIANT:** A table remains in `OCCUPIED` or `BILLED` state as long as any split check remains unpaid. It is impossible to mark a table `AVAILABLE` while any active check is in `BILLED` status.

### 3.4 Loyalty Point Reversal on Refunds
When an order refund is processed:
- If the original order awarded loyalty points, the backend computes the proportional points earned on the refunded amount.
- The earned points are clawed back immediately, and a `REFUND_REVERSAL` entry is logged in `PointsLedger`.
- Store credit refunds require an attached customer profile and cannot be issued to anonymous walk-ins.

---

## 4. Table Floor Management & Captain App (`/tables`)

### 4.1 Visual Floor Plan
- **Floor Designer**: Drag, resize, and rotate circular, square, and rectangular tables. Add barriers, kitchen doors, and bar counters.
- **Section Filtering**: Seamlessly toggle between Indoor AC, Patio, First Floor, and Rooftop Lounge.
- **Duplicate Prevention**: Floor-level table numbers are enforced strictly to prevent confusion.

### 4.2 Real-Time Table States

| State | Visual Indicator | Meaning & Allowed Actions |
| :--- | :--- | :--- |
| **AVAILABLE** | Slate / Gray Outline | Table is clean and ready. Tap to Seat Guests or Open a Tab. |
| **OCCUPIED** | Blue Highlight | Guests are seated; dishes are firing or being added. |
| **BILLED** | Emerald / Green | Final receipt printed. Table locked awaiting settlement. |
| **DIRTY** | Amber Warning | Bill settled; busser must clear table before re-seating. |
| **RESERVED** | Purple Outline | Reserved for upcoming booking. |
| **BLOCKED** | Red Strikethrough | Maintenance or physical defect. |

---

## 5. Kitchen Display System (KDS) & Routing (`/kds`)

### 5.1 Multi-Station KOT Routing
Dishes are automatically routed by station:
- **Tandoor Station**: Naans, rotis, kebabs, tikkas.
- **Hot Kitchen / Curry**: Curries, biryanis, dal, gravies.
- **Fryer & Grill**: Burgers, fries, wings, sizzlers.
- **Beverage & Bar**: Cocktails, mocktails, juices, beers.
- **Expediter / Master**: Combines all stations for packing and final inspection.

### 5.2 Ticket Bump State Machine
```
[New Ticket] ──(Bump)──► [In Prep (Yellow)] ──(Bump)──► [Ready (Green)] ──(Bump)──► [Complete]
```

### 5.3 86 Item Out-of-Stock Toggle
Chefs can toggle any dish **86 (Out of Stock)** directly from the KDS touch screen. The item is instantly greyed out across all POS and QR ordering menus.

---

## 6. Guest QR Self-Ordering & Queue Acceptance

1. **Dual Modes**: Mode A (Read-only digital menu) and Mode B (Interactive mobile self-ordering).
2. **Staff Acceptance Queue**: Guest QR orders arrive with `acceptance: 'PENDING'`. Staff must review, verify table occupancy, and click **Accept** before KOT tickets fire to the kitchen.
3. **Emergency Pause**: Managers can trigger an instant **Emergency QR Pause** (`qr.pause_ordering`) during severe kitchen surges.
4. **Guest Blocklist**: Abusive phone numbers can be banned via `guest.block` to prevent fake order spam.
