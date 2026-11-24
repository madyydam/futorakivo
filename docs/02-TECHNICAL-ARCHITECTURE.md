# Volume 02: Technical Architecture & System Design Document

> **KIVOKO RESTAURANT OS — Enterprise Cloud & Offline-First POS System**  
> Document Type: Technical Architecture & System Design Document  
> Companion PRD: [`01-PRD-PRODUCT-REQUIREMENTS.md`](./01-PRD-PRODUCT-REQUIREMENTS.md)  
> Version: 1.0.0  
> Status: Approved / Production Engineering  

---

## 1. System Topology & Monorepo Structure

KIVOKO is built as a high-performance, strictly-typed TypeScript monorepo managed with **pnpm workspaces**:

```
futorakivo/
├── apps/
│   ├── web/                    ← Next.js 16 App Router (POS, KDS, Owner Dashboard, QR Menu)
│   └── backend/                ← NestJS 11 API Service, WebSockets & Compliance Engine
├── packages/
│   └── types/                  ← Shared Zod schemas, TypeScript types & 38-key PERMISSIONS catalog
├── caddy/                      ← Production reverse proxy configuration with automated Let's Encrypt SSL
├── updater/                    ← System update daemon & version synchronization
├── scripts/                    ← Database seeders, deployment & verification utilities
├── docs/                       ← Master Documentation Suite (Volumes 01–10 + Flow Maps)
└── bin/                        ← Isolated archive for obsolete/scratch files (gitignored)
```

### Monorepo Technology Stack

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Package Manager** | `pnpm` (v11) | Strict dependency resolution, isolated symlinks, fast disk-deduplicated caching. |
| **Frontend Framework** | **Next.js 16** (App Router, Turbopack) | Server Components for instant page loads, client components for rich POS interactivity. |
| **Styling & Design System** | **Tailwind CSS 4** + CSS Custom Properties | Zero-runtime CSS compiler, dynamic dark/light HORECA theme tokens, high-contrast mode. |
| **State Management** | **TanStack Query** (v5) + Local React State | Optimistic UI mutations, automatic background refetching, client-side cache invalidation. |
| **Backend Framework** | **NestJS 11** (TypeScript) | Modular dependency injection, decorator-driven guards, throttlers, and WebSocket gateways. |
| **Database & ORM** | **Prisma 6** with **PostgreSQL** | Strict schema typing, connection pooling, complex JSON column queries for dish modifiers. |
| **Realtime WebSockets & SSE**| **Socket.IO** (NestJS Gateway) + SSE | Sub-100ms bi-directional push for KDS ticket bumps, table occupancy, and order events. |
| **Client Persistence** | **IndexedDB** | In-browser offline storage supporting full POS transactions during internet blackouts. |

---

## 2. Frontend Architecture (`apps/web`)

### 2.1 Route Groups & Layouts
The Next.js App Router cleanly separates application concerns through route groups:

```
apps/web/app/
├── (dashboard)/                ← Authenticated Management & Operations Console
│   ├── pos/                    ← Fullscreen Point-of-Sale Terminal (Sub-second checkout)
│   ├── kds/                    ← Fullscreen Multi-Station Kitchen Display System
│   ├── tables/                 ← Visual Floor Plan Canvas & Table Management
│   ├── inventory/              ← Recipe Costing, Waste Logging & Stock Management
│   └── settings/               ← Staff Roles, Hardware, Printers & QR Menu Controls
├── menu/                       ← Guest Mobile QR Self-Ordering Web App (Modes A & B)
│   └── [slug]/                 ← Table-bound dynamic menu with cart & allergy filters
├── demo/                       ← Standalone Interactive Demo Sandbox
│   ├── pos/                    ← Interactive Mock POS (Zero Auth Required)
│   ├── kds/                    ← Interactive KDS Ticket Bump Demo
│   └── tables/                 ← Interactive Visual Floor Plan Demo
├── solutions/                  ← Commercial Vertical SEO Landing Pages (QSR, Fine Dining)
├── city/                       ← Regional Local SEO Landing Pages (Mumbai, Delhi, Bangalore)
└── layout.tsx                  ← Root Layout with Theme Provider & Global Modals
```

### 2.2 Client-Side Modals & In-Place Action Locks
- **In-Place Manager Approvals**: Sensitive actions (voiding settled bills, large discounts, post-KOT cancellations) render a persistent red security banner modal requiring an authorized 6-digit manager PIN without logging out the cashier.
- **PIN Pad Component**: Touch-friendly virtual numeric keypad with haptic feedback, automatic clearing on failure, and lockout timers.

---

## 3. Backend Architecture (`apps/backend`)

### 3.1 Modular Domain Boundary
Every business domain is encapsulated in an independent NestJS module with its own controller, service, and DTOs:

```
apps/backend/src/
├── approvals/                  ← In-place manager approvals, PIN verification, action locks, throttler
├── devices/                    ← Atomic pairing code redemption, device session tokens, throttler
├── auth/                       ← Dual-token sessions, bcrypt PIN hasher (10 rounds), staff login
├── permissions/                ← 38-key RBAC catalog, permissions sync, cache & policy guards
├── modules/
│   ├── orders/                 ← Order lifecycle, split billing, refunds, loyalty clawback, KOT routing
│   ├── public/                 ← Public QR menu, guest cart ordering, emergency pause, guest blocklist
│   ├── tables/                 ← Floor plans, table state machines, billed order reservation locks
│   ├── inventory/              ← Raw ingredients, recipe BOM, FIFO waste logs, supplier POs
│   ├── printing/               ← Raw binary ESC/POS thermal printer network engine (port 9100)
│   ├── verifactu/              ← Spain AEAT chained cryptographic invoicing (SHA-256)
│   ├── customers/              ← CRM, loyalty point ledger, DPDP Act 2023 consent capture
│   └── integrations/           ← External REST API keys, webhooks, and MCP AI assistant tools
```

### 3.2 Real-Time Event Topology
Three specialized Socket.IO rooms and Server-Sent Events (SSE) deliver instant updates:
1. `kds:branch:<id>`: Broadcasts new kitchen tickets, prep status shifts, and station bumps.
2. `tables:branch:<id>`: Broadcasts table occupancy changes (`AVAILABLE`, `OCCUPIED`, `BILLED`).
3. `orders:branch:<id>`: Broadcasts live payment confirmations and order state changes.

---

## 4. Offline Engine & Synchronization Protocol

KIVOKO guarantees **100% offline operational continuity** during internet outages:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OFFLINE SYNC ARCHITECTURE                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [Cashier Tap] ──► [Optimistic UI] ──► [IndexedDB Outbox Queue]       │
│                            │                         │                 │
│                     (Immediate UI)           (Monotonic Queue)         │
│                                                      │                 │
│                                       [Connectivity Detector]          │
│                                        │                   │           │
│                                   (Online)             (Offline)       │
│                                        ▼                   ▼           │
│                            [POST /v1/sync]        [Retain in Outbox]   │
│                                        │                               │
│                            [Cloud Reconciliation]                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Client-Side Queue Storage
- Every offline transaction (new order, payment tender, KOT dispatch) is serialized into an IndexedDB outbox queue.
- Each action carries:
  - `actionId`: Client-generated UUIDv4.
  - `timestamp`: Monotonic client timestamp.
  - `payload`: Order data, items, modifiers, payments.
  - `idempotencyKey`: Unique deduplication key (`clientRequestId`).

### 4.2 Conflict Resolution Invariants
1. **Server-Authoritative Money**: Pricing, taxes, and discounts are strictly recomputed server-side during sync.
2. **Table Status Protection**: A table with an active `BILLED` order cannot be marked `AVAILABLE` or overwritten until the bill is settled.
3. **Additive Inventory Depletion**: Recipe ingredient deductions are computed cumulatively on reconciliation to prevent negative stock drift.

---

## 5. Core Data Models (Entity-Relationship Overview)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Restaurant    │───────│     Branch      │───────│     Device      │
│  (Tenant Root)  │       │(Physical Outlets│       │(Paired Hardware)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │      Floor      │       │ApprovalRequest  │
│(Staff/BcryptPIN)│       │  (Dining Zones) │       │ (Action Locks)  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ UserPermission  │       │      Table      │───────│      Order      │
│ (38 Keys/Grant) │       │(Occupied/Billed)│       │ (State Machine) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                   ┌─────────────────────────┼─────────────────────────┐
                                   ▼                         ▼                         ▼
                          ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
                          │    OrderItem    │       │     Payment     │       │   OrderEvent    │
                          │(Modifiers/Notes)│       │ (Cash/UPI/Card) │       │ (Audit Timeline)│
                          └─────────────────┘       └─────────────────┘       └─────────────────┘
                                   │                         │
                                   ▼                         ▼
                          ┌─────────────────┐       ┌─────────────────┐
                          │   RecipeItem    │       │  PointsLedger   │
                          │(Gram Deductions)│       │(Loyalty Reversal│
                          └─────────────────┘       └─────────────────┘
```

---

## 6. Security, Rate Limiting & Verification Standards

1. **Atomic Pairing Protocol**: Device pairing codes are consumed via atomic `updateMany` queries, eliminating race conditions.
2. **Brute-Force Rate Limiting**: Dedicated `@Throttle({ default: { limit: 10, ttl: 60_000 } })` decorators protect `/v1/devices/pair` and `/v1/approvals/request`.
3. **Loyalty Reversal Guard**: Refunds automatically subtract earned loyalty points proportionally and record a `REFUND_REVERSAL` in `PointsLedger`.
4. **Test Suite Integrity**: Zero regressions allowed. 409 backend integration suites and 59 frontend unit suites must pass on all builds.
