# Volume 04: POS Billing, Table Management & KDS Manual

> **KIVO — Software for Restaurant Management Simplified**  
> Document Type: POS Billing, Table Management & Kitchen Operations Manual  
> Companion PRD: [`01-PRD-PRODUCT-REQUIREMENTS.md`](./01-PRD-PRODUCT-REQUIREMENTS.md)  
> Version: 1.0.0  
> Status: Approved / Operational Runbook  

---

## 1. Daily Restaurant Operating Lifecycle

KIVO is built around a standard restaurant operating cadence:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DAILY RESTAURANT CADENCE                        │
├─────────────────────┬─────────────────────┬────────────────────────────┤
│ 1. MORNING OPENING  │ 2. SERVICE SHIFTS   │ 3. NIGHT CLOSE (Z-REPORT)  │
├─────────────────────┼─────────────────────┼────────────────────────────┤
│ • Count Cash Drawer │ • Sub-Second POS    │ • Finalize Open Tables     │
│ • Check Printer LAN │ • Tableside Captain │ • Cash Reconciliation      │
│ • Verify 86 Items   │ • KDS Prep Timers   │ • Settle Card / UPI Batches│
│ • Clock-In Staff    │ • Table Transfers   │ • Generate Day-End Report  │
└─────────────────────┴─────────────────────┴────────────────────────────┘
```

---

## 2. High-Velocity POS Billing Terminal (`/pos`)

The KIVO POS interface is optimized for high-volume rush hours:

### 2.1 The 3-Tap Checkout Workflow
1. **Tap 1: Category Selection**: Left sidebar categories (`Pizzas`, `Beverages`, `Desserts`) immediately filter the central dish grid.
2. **Tap 2: Item & Modifiers**: Tapping an item opens the modifier tray (e.g., Crust: *Thin Crust*, Cheese: *Extra Mozzarella*). One tap on **Add to Bill** places the item in the active check.
3. **Tap 3: Pay & Settle**: Tapping the green **Pay ₹[Total]** button presents payment options. Selecting **Cash (Exact)** or **Scan UPI QR** finalizes the bill and triggers automatic ESC/POS thermal printing.

### 2.2 Bill Adjustments & Discounts
- **Discounts**: Apply flat amount (₹) or percentage (%) discounts with optional pre-authorized manager PINs.
- **Service Charge & Taxes**: Configurable auto-application of 5% service charge and split CGST (2.5%) + SGST (2.5%).
- **Tips & Loyalty**: Redeem customer loyalty points directly against the subtotal; add credit card tips with cash tip out tracking.

### 2.3 Split Billing Operations
KIVO supports three distinct split-bill modes:
1. **Split by Item**: Drag individual dishes to separate sub-bills (e.g., Person A pays for Burger + Beer, Person B pays for Salad + Mocktail).
2. **Split by Seat**: For fine-dining table layouts with seat-level ordering, click **Split by Seat** to generate separate checks automatically.
3. **Split by Amount**: Divide the total check equally among $N$ guests across mixed payment methods (e.g., ₹2,400 split 4 ways = ₹600 each across 2 UPIs and 2 cards).

---

## 3. Table Floor Management & Captain App (`/tables`)

### 3.1 Visual Floor Plan
- **Floor Designer**: Drag, resize, and rotate circular, square, and rectangular tables. Add barriers, kitchen doors, and bar counters to mirror the restaurant's physical layout.
- **Section Filtering**: Seamlessly toggle between Indoor AC, Outdoor Patio, First Floor, and Rooftop Lounge.

### 3.2 Real-Time Table States

| State | Visual Indicator | Meaning & Allowed Actions |
| :--- | :--- | :--- |
| **Vacant** | Slate / Gray Outline | Table is clean and ready. Tap to Seat Guests or Open a Fast Tab. |
| **Seated** | Blue Pulse | Guests are seated with captain assigned. Ready for initial order entry. |
| **Running KOT** | Amber Highlight | Dishes are currently firing in the kitchen. Running balance displays live. |
| **Billed** | Emerald / Green | Final receipt has been printed. Awaiting final payment tender. |

### 3.3 Tableside Captain Ordering & Course Pacing
Waitstaff log in to the mobile captain webapp on any smartphone or tablet:
- **Course Firing**: Tag items as **Starter**, **Main Course**, or **Dessert**. The kitchen KDS holds main courses until the captain fires the next course with one tap.
- **Guest Customizations**: Add kitchen notes like *"Less spicy"*, *"No garlic/onion"*, *"Gluten free"*. Notes print in bold red on kitchen thermal tickets.
- **Table Transfers & Merges**: Move Table 4 to Table 12 in one click; merge party tables without losing kitchen ticket history.

---

## 4. Kitchen Display System (KDS) & Stations (`/kds`)

### 4.1 Multi-Station KOT Routing
Items are automatically separated by kitchen station:
- **Tandoor Station**: Naans, rotis, kebabs, tikkas.
- **Hot Kitchen / Curry**: Curries, biryanis, dal, rice bowls.
- **Fryer & Grill**: Burgers, fries, wings, sizzlers.
- **Beverage & Bar**: Cocktails, mocktails, fresh juices, draft beer.
- **Expediter / Packing Station**: Master screen showing all combined station dishes for final quality check and dispatch.

### 4.2 Ticket Bump State Machine

```
[New Ticket: Pending] ──(Tap: Accept)──► [In Preparation (Yellow)] ──(Tap: Done)──► [Ready / Bumper (Green)]
        │                                                                                   │
   (>10m Warning)                                                                    (Auto-Notify Captain)
        ▼                                                                                   ▼
   [Flashing Red]                                                                  [Dispatched / Complete]
```

### 4.3 86 Item Out-of-Stock Toggle
Chefs can mark any item **86 (Unavailable)** directly from the KDS touch terminal:
- Instantly disables the dish on all POS terminals and tableside captain devices.
- Prevents customer disappointment and order cancellations before tickets are fired.

---

## 5. Token Calling & Customer Displays

- **Customer-Facing Display (CFD)**: Shows itemized dish names, prices, and dynamic UPI QR payment codes during checkout.
- **Token Queue Screen (`/customer-display`)**: Displays animated **Now Preparing** and **Ready for Pickup** token numbers for high-speed QSR counters.
