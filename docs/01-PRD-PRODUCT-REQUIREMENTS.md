# Volume 01: Product Requirements Document (PRD)

> **KIVOKO RESTAURANT OS — Enterprise Cloud & Offline-First POS System**  
> Document Type: Product Requirements Document (PRD)  
> Companion Architecture Doc: [`02-TECHNICAL-ARCHITECTURE.md`](./02-TECHNICAL-ARCHITECTURE.md)  
> Version: 1.0.0  
> Status: Approved / Production SaaS  

---

## 1. Executive Summary & Vision

### 1.1 Problem Statement
The modern food & beverage (HORECA) industry suffers from fragmented, clunky, and outdated technology:
- **Hardware Lock-in**: Legacy POS providers force restaurants to purchase proprietary, expensive Windows/Android terminals with high initial setup costs and vendor lock-in.
- **Billing Lag During Rush Hours**: Traditional client-server software stutters when queues build up, leading to cashier frustration, lost customers, and order mistakes.
- **Internet Fragility**: When local internet connections fail during peak dinner rushes, older cloud POS systems halt billing, prevent KOT printing, and disrupt dining operations.
- **Inventory Leakage & Recipe Blindness**: Over 70% of restaurant owners cannot accurately compute dish-level profit margins or detect raw material shrinkage until month-end audits.
- **Disjointed Station Communication**: Waitstaff manually run handwritten paper tickets between tables and the kitchen, creating prep delays, lost allergen warnings, and inconsistent hospitality.

### 1.2 The KIVOKO Solution
**KIVOKO RESTAURANT OS** is a purpose-built, cloud-native restaurant operating system engineered for sub-second billing, complete hardware freedom, and 100% offline resilience:
- **Hardware Freedom**: Runs seamlessly on any modern web browser across iPads, Android tablets, desktop PCs, laptops, and mobile phones.
- **Sub-Second 3-Tap Checkout**: Rapid-fire interface designed for extreme rush hours. Tap category, select item with modifier, take payment via dynamic UPI QR/cash, and print receipts in under 2 seconds.
- **Offline-First Auto Sync**: All POS transactions, orders, and table updates run on local client storage (IndexedDB outbox) and automatically reconcile with the cloud when connectivity returns.
- **Multi-Station Kitchen Routing**: Real-time color-coded Kitchen Display Systems (KDS) eliminate paper chaos and route items by station (fryer, tandoor, bakery, bar).
- **Gram-Level Recipe Costing**: Automatic depletion of raw inventory ingredients per dish ordered, providing real-time food cost analytics and low-stock alerts.
- **Self-Ordering QR Ecosystem**: Dual-mode QR (Mode A: View-only digital menu, Mode B: Table self-ordering with staff acceptance gate and emergency pause).
- **Granular 38-Key RBAC & Manager Approval Locks**: Enterprise role hierarchy with in-place PIN authorization for sensitive discounts, voids, and post-KOT cancellations.

---

## 2. Target Markets & User Personas

### 2.1 Target Venues
1. **Quick Service Restaurants (QSR) & Cafes**: High transaction velocity, counter queues, token calling, combo prompts.
2. **Fine Dining & Casual Restaurants**: Visual table floor layouts, tableside captain ordering, multi-course pacing, split bills.
3. **Multi-Brand Cloud Kitchens**: Single kitchen footprint operating 5+ virtual brands with consolidated aggregator order queues.
4. **Bars, Restobars & Microbreweries**: Running tabs, bar dispensing tokens, split checks by seat.
5. **Multi-Outlet Restaurant Chains**: Central commissary management, recipe standardization, centralized menu controls, and multi-branch P&L reporting.

### 2.2 User Personas

| Persona | Role | Key Goals & Needs | Primary Screen / Module |
| :--- | :--- | :--- | :--- |
| **Pooja** (Cashier / Counter Staff) | Fast checkout, zero lag, accurate change calculation, quick split payments. | Sub-second checkout, fast search, barcode scanning, token auto-print. | `/pos`, `/demo/pos` |
| **Rajesh** (Floor Captain / Waiter) | Tableside ordering, adding modifiers, checking table states, split billing. | Handheld tablet responsiveness, instant kitchen dispatch, guest allergy notes. | `/tables`, Mobile Captain Webapp |
| **Chef Anand** (Head Kitchen Chef) | Clear order priorities, station-specific routing, prep-time tracking. | Color-coded KDS timers, ticket bump controls, item 86 (out-of-stock) toggle. | `/kds`, `/demo/kds` |
| **Meera** (Storekeeper / Purchase) | Stock levels, purchase orders, goods receipt notes (GRN), waste logs. | Gram-level deductions, low-stock threshold alerts, vendor rate comparisons. | `/inventory`, `/inventory/procurement` |
| **Vikram** (Multi-Outlet Owner / GM) | Revenue monitoring, branch comparisons, menu pushing, fraud prevention. | Real-time analytics, role-based access control, centralized recipe catalog. | `/dashboard`, `/reports`, `/settings` |

---

## 3. Product Scope: The 20 Functional Modules

KIVOKO is architected around 20 modular domains:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KIVOKO PRODUCT ECOSYSTEM                            │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ FRONT-OF-HOUSE (FOH) │ BACK-OF-HOUSE (BOH)  │ MANAGEMENT & COMPLIANCE       │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ 1. Dine-In/Takeaway  │ 5. Kitchen Display   │ 9. Recipe Costing & Inventory │
│ 2. Table Floor Plan  │ 6. Station Routing   │ 10. Purchase Orders & GRN     │
│ 3. Captain Ordering  │ 7. Token Calling     │ 11. Multi-Outlet Commissary   │
│ 4. Dynamic QR Pay    │ 8. Waste Tracking    │ 12. India GST & Tax Engine    │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ CUSTOMER ENGAGEMENT  │ HARDWARE & DEV TOOLS │ PLATFORM SECURITY             │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ 13. Guest CRM & DPDP │ 16. ESC/POS Printing │ 19. Canonical 38-Key RBAC     │
│ 14. Loyalty Ledger   │ 17. REST APIs & SDK  │ 20. In-Place Manager Approvals│
│ 15. QR Self-Ordering │ 18. MCP AI Server    │                               │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### Detailed Functional Highlights:

#### Module 1: Point of Sale & Billing (`/pos`)
- **Sub-Second 3-Tap Checkout**: Categorized dish grid with instant search, modifier selection, and kitchen notes.
- **Split & Merge**: Split bill by item, seat, or equal proportions; table remains occupied until all splits are fully settled.
- **Loyalty Clawback on Refund**: Refunds proportionally reverse awarded loyalty points and record a `REFUND_REVERSAL` in `PointsLedger`.

#### Module 2: Table Floor Management (`/tables`)
- **Visual Floor Canvas**: Interactive drag-and-drop floor builder supporting circular, square, and rectangular tables.
- **Table State Machine**: `AVAILABLE`, `OCCUPIED`, `BILLED`, `DIRTY`, `RESERVED`, `BLOCKED`. A table with an active `BILLED` order cannot be set to `AVAILABLE` until settled.

#### Module 3: Kitchen Display System (`/kds`)
- **Station-Specific Routing**: Route beverage items to Bar, tandoor dishes to Tandoor Station, desserts to Bakery.
- **Ticket Bump Workflow**: `Pending` $\rightarrow$ `In Preparation` $\rightarrow$ `Ready` $\rightarrow$ `Dispatched`.
- **86 Item Toggle**: Mark any dish out of stock in one tap across all ordering interfaces.

#### Module 4: Guest QR Ordering (`/menu/:slug`)
- **Dual Modes**: Mode A (View-Only Digital Menu) and Mode B (Mobile Self-Ordering with Cart).
- **Staff Acceptance Gate**: Guest orders land in the QR Queue as `acceptance: 'PENDING'`. Staff verify table presence and accept before KOT tickets fire.
- **Safety Controls**: Emergency QR Ordering Pause toggle and Guest Phone Blocklist against spam.

#### Module 5: 38-Key RBAC & Manager Approval Locks
- **Fine-Grained Permissions**: 38 explicit keys governing all operations. Zero hardcoded role string checks.
- **In-Place PIN Modal**: Cashiers requesting restricted discounts (>5%), voids, or post-KOT item cancellations trigger an on-screen manager PIN modal without session logout.

#### Module 6: Regulatory Compliance & DPDP Act 2023
- **Indian GST Engine**: Full 5% (SAC 996331) and 18% (SAC 996332) calculation with HSN/SAC codes and B2B GSTIN logging.
- **DPDP Act 2023**: Explicit consent capture for phone numbers, masked display, mandatory retention periods, and right to erasure.
- **Spain Veri*factu**: Cryptographic SHA-256 chained invoice hashing for tamper-proof auditing.

---

## 4. Competitive Differentiation: KIVOKO vs Legacy POS

| Capability | KIVOKO RESTAURANT OS | Petpooja | POSist | Toast POS |
| :--- | :--- | :--- | :--- | :--- |
| **Hardware Freedom** | Run on any iPad, Android, Mac, or PC | Requires Windows/proprietary terminal | Web/Client-Server | Proprietary Toast hardware only |
| **Billing Speed** | Sub-second (optimistic client state) | 2–5s (legacy desktop client) | 2–4s | Sub-second |
| **Offline Resilience** | Full offline billing with IndexedDB Outbox sync | Desktop mode with sync conflicts | Partial offline | Offline mode available |
| **Kitchen Display (KDS)** | Native multi-station routing included | Extra add-on module & licensing | Extra module | Included on higher tiers |
| **QR Self-Ordering** | Native Modes A & B with staff acceptance gate | Third-party or basic add-on | Add-on | Extra fee |
| **AI Integration (MCP)**| Native Model Context Protocol server | None | None | None |
| **Instant Live Demo** | Immediate browser demo (`/demo`) | Sales call & rep scheduling | Demo on request | Sales call required |
| **Security Auditing** | 409 automated backend test suites (100% green) | Closed-source testing | Closed-source | Enterprise testing |

---

## 5. Non-Functional Requirements (NFR)

1. **Performance**: Initial POS page load $\le 1.2\text{s}$; bill calculation and state update $\le 50\text{ms}$; ESC/POS print buffer generation $\le 15\text{ms}$.
2. **Reliability**: 99.99% cloud uptime target; 100% offline billing uptime with zero data loss during internet drops.
3. **Security**: Bcrypt PIN hashing (10 rounds); atomic device pairing; dual-token authentication; OWASP Top 10 hardened; DPDP Act 2023 compliant.
