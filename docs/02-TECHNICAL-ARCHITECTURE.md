# Volume 02: Technical Architecture & System Design Document

> **KIVO — Software for Restaurant Management Simplified**  
> Document Type: Technical Architecture & System Design Document  
> Companion PRD: [`01-PRD-PRODUCT-REQUIREMENTS.md`](./01-PRD-PRODUCT-REQUIREMENTS.md)  
> Version: 1.0.0  
> Status: Approved / Production Engineering  

---

## 1. System Topology & Monorepo Structure

KIVO is built as a high-performance TypeScript monorepo managed with **pnpm workspaces**:

```
futorakivo/
├── apps/
│   ├── web/                    ← Next.js 16 App Router (POS, KDS, Admin, Landing)
│   └── backend/                ← NestJS / Node.js API Service & WebSocket Gateway
├── packages/
│   ├── types/                  ← Shared Zod schemas, TypeScript interfaces & DTOs
│   └── ui/                     ← Core UI design primitives & Tailwind components
├── docs/                       ← The 7 Master Documentation Volumes
└── BRAIN.md                    ← Permanent System Knowledge Base & Invariants
```

### Monorepo Technology Stack

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Package Manager** | `pnpm` (v11) | Strict dependency resolution, isolated symlinks, fast disk-deduplicated caching. |
| **Frontend Framework** | **Next.js 16** (App Router, Turbopack) | Server Components for instant page loads, client components for rich POS interactivity. |
| **Styling & Design System** | **Tailwind CSS 4** + CSS Custom Properties | Lightning-fast compiler, zero-runtime overhead, dynamic dark/light HORECA theme tokens. |
| **State Management** | **TanStack Query** (v5) + Local React State | Optimistic UI mutations, automatic background refetching, client-side cache invalidation. |
| **Backend Framework** | **NestJS** (TypeScript) | Modular dependency injection, decorator-driven guards, enterprise-grade WebSocket gateways. |
| **Database & ORM** | **Prisma** with **PostgreSQL** | Strict schema typing, connection pooling, complex JSON column queries for dish modifiers. |
| **Realtime WebSockets** | **Socket.IO** (NestJS Gateway) | Sub-100ms bi-directional push for KDS ticket bumps, table occupancy, and rider tracking. |
| **Client Persistence** | **IndexedDB** | In-browser offline storage supporting full POS transactions during internet blackouts. |

---

## 2. Frontend Architecture (`apps/web`)

### 2.1 Route Groups & Layouts
The Next.js App Router cleanly separates application concerns through route groups:

```
apps/web/app/
├── (dashboard)/                ← Authenticated Management Console
│   ├── pos/                    ← Fullscreen Point-of-Sale Terminal
│   ├── kds/                    ← Fullscreen Kitchen Display Stations
│   ├── tables/                 ← Visual Floor Plan & Captain Order Hub
│   ├── inventory/              ← Recipe Costing, Waste & Stock Management
│   └── settings/               ← Staff Roles, Hardware & Integrations
├── demo/                       ← Standalone Interactive Demo Sandbox
│   ├── pos/                    ← Hardcoded Mock POS (Zero Auth Required)
│   ├── kds/                    ← Interactive KDS Ticket Bump Demo
│   └── tables/                 ← Interactive Visual Floor Plan Demo
├── solutions/                  ← Commercial Vertical SEO Landing Pages
│   ├── qsr/                    ← Quick Service Restaurant Landing
│   ├── cloud-kitchen/          ← Multi-Brand Cloud Kitchen Landing
│   └── fine-dining/            ← Fine Dining & Restobar Landing
├── city/                       ← Regional Local SEO Landing Pages
│   └── [slug]/                 ← Mumbai, Delhi NCR, Bangalore, Pune, Hyderabad
└── layout.tsx                  ← Root Layout with JSON-LD Schema & AEO Metadata
```

### 2.2 Design System & Component Primitives
- **Base UI Primitives**: Accessible, unstyled primitives wrapped into styled, owned components (`packages/ui/src/components`).
- **Design Tokens**: Standardized CSS variables for palette (`--primary: #9f1239`, `--card`, `--border`, `--muted`).
- **Accessibility & Motion**: Motion animations defer to `reducedMotion="user"`, respecting operating system accessibility settings.

---

## 3. Backend Architecture (`apps/backend`)

### 3.1 Modular Domain Boundary
Every business domain is encapsulated in an independent NestJS module with its own controller, service, and DTOs:

```
apps/backend/src/modules/
├── auth/                       ← JWT session cookies, PIN quick-switch, 2FA
├── orders/                     ← Order lifecycle, bill calculations, refunds
├── menu/                       ← Categories, items, modifier groups, combos
├── tables/                     ← Floor plans, table states, reservations
├── kds/                        ← Multi-station kitchen routing, prep timers
├── inventory/                  ← Raw materials, recipe BOM, FIFO waste logs
├── printing/                   ← Raw binary ESC/POS thermal printer engine
└── integrations/               ← REST API keys, webhooks, and MCP server
```

### 3.2 Real-Time WebSocket Gateways
Three specialized Socket.IO rooms handle live events with zero polling overhead:
1. `kds:branch:<id>`: Broadcasts new kitchen tickets, prep status shifts, and bumps.
2. `tables:branch:<id>`: Broadcasts table occupancy changes (vacant, seated, running KOT, billed).
3. `orders:branch:<id>`: Broadcasts live payment confirmations and order state changes.

---

## 4. Offline Engine & Synchronization Protocol

One of KIVO's non-negotiable invariants is **100% offline operational continuity**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OFFLINE SYNC ARCHITECTURE                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [Cashier Tap] ──► [Optimistic UI] ──► [IndexedDB Local Storage]      │
│                            │                         │                 │
│                     (Immediate UI)           (Monotonic Queue)         │
│                                                      │                 │
│                                       [Internet Status Check]          │
│                                        │                   │           │
│                                   (Online)             (Offline)       │
│                                        ▼                   ▼           │
│                            [POST /api/v1/sync]    [Queue Retained]     │
│                                        │                               │
│                            [Cloud Reconciliation]                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Client-Side Queue Storage
- When offline, every bill creation, payment tender, and KOT dispatch is serialized into a client-side **Monotonic Action Queue** in IndexedDB.
- Each action carries:
  - `actionId`: Client-generated UUIDv4.
  - `timestamp`: Monotonic client timestamp.
  - `payload`: Order data, items, modifiers, payments.
  - `idempotencyKey`: Unique deduplication key.

### 4.2 Conflict Resolution Invariants
1. **Server-Authoritative Money**: Pricing, taxes, and discounts are verified server-side on sync.
2. **First-Write Floor State**: If two captains seat Table 4 concurrently while offline, the earlier timestamp wins; the second captain receives a graceful table-merge prompt.
3. **Additive Inventory Depletion**: Recipe ingredient deductions are computed cumulatively on reconciliation to prevent negative stock drift.

---

## 5. Core Data Models (Entity-Relationship Overview)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Restaurant    │───────│     Branch      │───────│      Table      │
│  (Tenant Root)  │       │(Physical Outlets│       │ (Floor Layouts) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │    MenuItem     │───────│      Order      │
│ (RBAC Staff/PIN)│       │ (Dishes/Combos) │       │ (Bills/Receipts)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                   │                         │
                                   ▼                         ▼
                          ┌─────────────────┐       ┌─────────────────┐
                          │    RecipeBOM    │       │     Payment     │
                          │(Gram Deductions)│       │ (Cash/UPI/Card) │
                          └─────────────────┘       └─────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │  InventoryItem  │
                          │ (Raw Materials) │
                          └─────────────────┘
```

---

## 6. Security & Infrastructure Standards

1. **Multi-Tenant Row-Level Security**:
   - Every database query automatically filters by `restaurantId`. Cross-tenant data access is impossible at the database driver level.
2. **Cryptographic Signatures**:
   - Webhooks to external endpoints use `HMAC-SHA256` signatures with UNIX timestamps to prevent replay attacks.
3. **Hardware Connectivity**:
   - Raw binary socket drivers directly stream ESC/POS commands to thermal printers over TCP port `9100`, WebUSB, or WebBluetooth.
