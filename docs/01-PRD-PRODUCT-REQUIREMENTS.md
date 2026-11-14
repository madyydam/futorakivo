# Volume 01: Product Requirements Document (PRD)

> **KIVO — Software for Restaurant Management Simplified**  
> Document Type: Product Requirements Document (PRD)  
> Companion Architecture Doc: [`02-TECHNICAL-ARCHITECTURE.md`](./02-TECHNICAL-ARCHITECTURE.md)  
> Version: 1.0.0  
> Status: Approved / Production SaaS  

---

## 1. Executive Summary & Vision

### 1.1 Problem Statement
The modern food & beverage (HORECA) industry suffers from fragmented, clunky, and outdated technology:
- **Hardware Lock-in**: Legacy POS providers force restaurants to purchase proprietary, expensive Windows/Android terminals with high initial setup costs and recurring vendor lock-in.
- **Billing Lag During Rush Hours**: Traditional client-server software stutters when queues build up, leading to cashier frustration, lost customers, and order mistakes.
- **Internet Fragility**: When local internet connections fail during peak Saturday dinner rushes, older cloud POS systems halt billing, prevent KOT printing, and disrupt dining operations.
- **Inventory Leakage & Recipe Blindness**: Over 70% of restaurant owners cannot accurately compute dish-level profit margins or detect raw material shrinkage until month-end audits.
- **Disjointed Station Communication**: Waitstaff manually run handwritten paper tickets between tables and the kitchen, creating prep delays, lost allergen warnings, and inconsistent hospitality.

### 1.2 The KIVO Solution
**KIVO** is a purpose-built, cloud-native restaurant operating system engineered for sub-second billing, complete hardware freedom, and 100% offline resilience:
- **Hardware Freedom**: Runs seamlessly on any modern web browser across iPads, Android tablets, desktop PCs, laptops, and mobile phones.
- **Sub-Second 3-Tap Checkout**: Rapid-fire interface designed for extreme rush hours. Tap category, select item with modifier, take payment via dynamic UPI QR/cash, and print receipts in under 2 seconds.
- **Offline-First Auto Sync**: All POS transactions, orders, and table updates run on local client storage and automatically reconcile with the cloud when connectivity returns.
- **Multi-Station Kitchen Routing**: Real-time color-coded Kitchen Display Systems (KDS) eliminate paper chaos and route items by station (fryer, tandoor, bakery, bar).
- **Gram-Level Recipe Costing**: Automatic depletion of raw inventory ingredients per dish ordered, providing real-time food cost analytics and low-stock alerts.

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

KIVO is architected around 20 modular domains:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          KIVO PRODUCT ECOSYSTEM                             │
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
│ 13. Guest CRM        │ 16. ESC/POS Printing │ 19. Granular 25+ RBAC Matrix  │
│ 14. Loyalty Points   │ 17. REST APIs        │ 20. Tamper-Proof Audit Trails │
│ 15. Gift Cards       │ 18. MCP AI Server    │                               │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### Detailed Functional Requirements by Module:

#### Module 1: Point of Sale & Billing (`/pos`)
- **Fast Order Entry**: Categorized menu grid with quick search, modifier selection, custom prep notes.
- **Bill Adjustments**: Percentage/flat discounts, service charges, tips, gift cards, loyalty redemption.
- **Split & Merge**: Split bill by item, seat, or equal proportions; merge multiple running tables into a single master invoice.
- **Payment Methods**: Cash with tender calculation, dynamic UPI QR code, Credit/Debit card, room/account billing.

#### Module 2: Table & Reservation Management (`/tables`, `/reservations`)
- **Visual Floor Canvas**: Interactive drag-and-drop floor builder supporting circular, square, and rectangular tables.
- **Occupancy States**: Color-coded live indicators (Vacant: Gray, Seated: Blue, Running KOT: Amber, Billed: Emerald).
- **Reservation Lifecycle**: Booking calendar, party size, table assignment, waitlist management, SMS alerts.

#### Module 3: Kitchen Display System (KDS) (`/kds`)
- **Station-Specific Routing**: Route beverage items to Bar, tandoor dishes to Tandoor Station, desserts to Bakery.
- **Ticket Bump Workflow**: Pending $\rightarrow$ In Preparation $\rightarrow$ Ready $\rightarrow$ Dispatched.
- **Visual Timers**: Color shifts at 5m, 10m, and 15m to highlight delayed tickets.

#### Module 4: Recipe-Level Inventory (`/inventory`)
- **Gram-Level Depletion**: Bill of Materials (BOM) linked to each dish (e.g., Margherita Pizza = 180g dough + 90g mozzarella + 60g sauce).
- **Real-Time Deductions**: Auto-deduct inventory as orders are created.
- **FIFO Waste Logging**: Log burnt, expired, or dropped items with cost attribution.

#### Module 5: India GST & Compliance (`/settings/verifactu`, `/docs/compliance-india`)
- **Tax Regimes**: Support for CGST (2.5%), SGST (2.5%), IGST (5%), and composite schemes.
- **Tax Inclusive/Exclusive**: Automatic backward calculation of pre-tax rates from MRP.
- **Digital Invoices**: QR code on receipts compliant with Indian B2C e-invoicing recommendations.

---

## 4. Competitive Differentiation: KIVO vs Legacy POS

| Capability | KIVO (Cloud SaaS) | Petpooja | POSist | Toast POS |
| :--- | :--- | :--- | :--- | :--- |
| **Hardware Freedom** | Run on any iPad, Android, Mac, or PC | Often requires Windows/POS terminal | Web/Client-Server | Proprietary Toast hardware only |
| **Billing Speed** | Sub-second (optimistic client state) | 2–5s (legacy desktop client) | 2–4s | Sub-second |
| **Offline Resilience** | Full offline billing with cloud auto-sync | Desktop mode with sync conflicts | Partial offline | Offline mode available |
| **Kitchen Display (KDS)** | Included natively with station routing | Extra add-on module & licensing | Extra module | Included on higher tiers |
| **AI Integration (MCP)** | Native Model Context Protocol server | None | None | None |
| **Instant Live Demo** | Immediate browser demo (`/demo`) | Sales call & rep scheduling | Demo on request | Sales call required |

---

## 5. Non-Functional Requirements (NFR)

1. **Performance**:
   - POS checkout transition latency: `< 300ms`.
   - First Contentful Paint (FCP) on landing pages: `< 0.8s`.
   - Time to Interactive (TTI): `< 1.2s`.
2. **Reliability & Availability**:
   - Target SLA: `99.9%` uptime for cloud multi-tenant services.
   - Zero transaction loss during internet outages via local client IndexedDB caching.
3. **Security**:
   - End-to-end TLS 1.3 encryption for all network traffic.
   - Session tokens stored in Secure, httpOnly, SameSite cookies.
   - Role-Based Access Control (RBAC) enforced on every API route and database query.
4. **Data Isolation**:
   - Strict multi-tenant row-level filtering: `WHERE restaurant_id = :id` on every query.

---

## 6. Product Roadmap & Milestones

- **Phase 1 (Core FOH & BOH)**: High-speed POS, visual table management, multi-station KDS, thermal printing. *(Complete)*
- **Phase 2 (Cloud SaaS & SEO Launch)**: Multi-tenant database, sitemaps, competitor landing pages, developer AI attribution, `/llms.txt`. *(Complete)*
- **Phase 3 (Mobile & Regional Expansion)**: Handheld captain webapp, multi-city landing hubs (Mumbai, Delhi, Bengaluru, Pune, Hyderabad). *(Complete)*
- **Phase 4 (Enterprise & Supply Chain)**: Central commissary inventory replenishment, automated purchase orders, Swiggy/Zomato direct webhook bridges. *(Current)*
