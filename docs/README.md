# KIVOKO RESTAURANT OS — Master Documentation & Table of Contents (TOC)

> **KIVOKO RESTAURANT OS — Enterprise Cloud & Offline-First POS System**  
> Complete HORECA Management Platform (POS, KDS, Tables, Split Billing, QR Ordering, Inventory, DPDP & GST)  
> Organization: **FUTORA GROUP OF COMPANIES**  
> Production Domain: [https://www.kivo.futoragroup.in](https://www.kivo.futoragroup.in)  
> Architecture: Next.js 16 (PWA) + NestJS 11 + PostgreSQL + Redis + Socket.IO  
> Current Version: 1.0.0 (Production SaaS)

---

## 📚 Master Documentation Suite (Volumes 00–10 + Strategy & Flow Maps)

The KIVOKO documentation suite is organized into **11 core volumes**, **1 strategic cheat sheet**, and **1 architectural flow maps document**, providing full coverage across Product Requirements (PRD), Technical Architecture, Operations, Integrations, 38-Key RBAC, Compliance, and Security Audits:

```
docs/
├── README.md                                     ← Master Table of Contents (This file)
├── 00-PROJECT-STATE-AND-PHASE-ROADMAP.md         ← Volume 00: Live Project State & 14-Phase Implementation Status
├── SYSTEM_FLOW_CHARTS_AND_MINDMAPS.md            ← System Architecture, State Machines & Flow Maps
├── 01-PRD-PRODUCT-REQUIREMENTS.md                ← Volume 01: Product Requirements Document (PRD)
├── 02-TECHNICAL-ARCHITECTURE.md                  ← Volume 02: Technical Architecture & System Design
├── 03-API-AND-INTEGRATIONS.md                    ← Volume 03: APIs, Webhooks & MCP Technical Document
├── 04-OPERATIONS-AND-POS-MANUAL.md               ← Volume 04: POS Billing, Table Management & KDS Manual
├── 05-INVENTORY-AND-SUPPLY-CHAIN.md              ← Volume 05: Inventory, Recipe Costing & Commissary Guide
├── 06-SECURITY-AND-COMPLIANCE.md                 ← Volume 06: Security, 38-Key RBAC & Indian GST Compliance
├── 07-DEPLOYMENT-AND-HARDWARE.md                 ← Volume 07: Hardware Setup, Mobile Apps & ESC/POS Printers
├── 08-SECURITY-AUDIT-AND-PENETRATION-REPORT.md   ← Volume 08: Penetration Testing & Vulnerability Fix Report
├── 09-INDIAN-REGULATIONS-AND-DPDP-ACT.md         ← Volume 09-A: Indian Regulations & DPDP Act 2023 Compliance
├── 09-DPDP-ACT-2023-IMPLEMENTATION-SPEC.md       ← Volume 09-B: DPDP Act & CRM Technical Implementation Spec
├── 10-PRODUCTION-CLOUD-SAAS-DEPLOYMENT.md        ← Volume 10: Production Single-VPS Cloud SaaS Deployment
├── KIVO_14_DAY_LAUNCH_CHEAT_SHEET.html           ← 14-Day Restaurant Go-Live Blueprint & Daily Action Checklist
├── KIVO_14_DAY_LAUNCH_CHEAT_SHEET.pdf            ← Printable PDF Version of Launch Cheat Sheet
└── examples/                                     ← Sample CSV imports (ingredients.csv, menu-items.csv)
```

---

## 🗺️ Master Table of Contents (TOC)

| Volume | Document Title | Primary Audience | Core Focus & Topics |
| :---: | :--- | :--- | :--- |
| **00** | [**Project State & 14-Phase Roadmap**](./00-PROJECT-STATE-AND-PHASE-ROADMAP.md) | Executives, Lead Engineers, Product Owners | Comprehensive audit of all 14 project phases (Phases 0–7 completed, Phase 8 in-progress), route inventory, and test verification metrics. |
| **MAPS** | [**Architecture & System Flow Maps**](./SYSTEM_FLOW_CHARTS_AND_MINDMAPS.md) | Architects, Lead Engineers, Auditing Teams | 10 Visual flow charts, state machines, device pairing, in-place manager approval (🔐), order lifecycles, and QR ordering modes. |
| **01** | [**PRD: Product Requirements**](./01-PRD-PRODUCT-REQUIREMENTS.md) | Product Managers, Founders, Investors | Product vision, target personas, business model, 22 functional modules (POS, KDS, Onboarding, Tables, QR Modes A & B), competitive edge. |
| **02** | [**Technical Architecture**](./02-TECHNICAL-ARCHITECTURE.md) | Software Architects, Fullstack Engineers | Next.js 16 App Router, NestJS 11 backend, Prisma ORM, PostgreSQL schema, IndexedDB offline sync outbox, Socket.IO real-time events. |
| **03** | [**APIs, Webhooks & MCP**](./03-API-AND-INTEGRATIONS.md) | Backend Devs, AI Engineers, Integrators | REST Integration API, Onboarding API, Super Admin API, Model Context Protocol (MCP) server endpoints, webhook HMAC verification. |
| **04** | [**POS Billing & Operations**](./04-OPERATIONS-AND-POS-MANUAL.md) | Restaurant Managers, Cashiers, Captains | 3-tap rapid checkout, visual floor management, captain ordering, course pacing, split billing, multi-station KDS routing, token displays. |
| **05** | [**Inventory & Supply Chain**](./05-INVENTORY-AND-SUPPLY-CHAIN.md) | Chefs, Purchase Managers, Storekeepers | Gram-level recipe deductions, FIFO waste logging, purchase orders, goods receipt notes (GRN), central commissary transfers, CSV data imports. |
| **06** | [**Security, RBAC & Access Control**](./06-SECURITY-AND-COMPLIANCE.md) | Compliance Officers, Security Auditors | Canonical 38-key RBAC, dual-token device/staff authentication, in-place manager approvals, privilege escalation prevention, bcrypt PIN hashing. |
| **07** | [**Hardware & Deployment**](./07-DEPLOYMENT-AND-HARDWARE.md) | DevOps, System Admins, Field Technicians | ESC/POS thermal printers (USB/Bluetooth/LAN 9100), Android/iOS PWA, self-service kiosks, Docker/Vercel deployment runbooks. |
| **08** | [**Security Audit & Penetration Report**](./08-SECURITY-AUDIT-AND-PENETRATION-REPORT.md) | Security Engineers, Auditors | Penetration test findings, 22 resolved vulnerability vectors (pairing races, XSS, prototype pollution, loyalty clawbacks, billed order safeguards). |
| **09-A** | [**Indian Regulations & DPDP Act 2023**](./09-INDIAN-REGULATIONS-AND-DPDP-ACT.md) | Legal, Compliance, DPO | DPDP Act 2023 statutory mandates, Section 6 unbundled consent, phone masking, mandatory data retention limits, right to erasure, GST tax calculation engine. |
| **09-B** | [**DPDP Act & CRM Implementation Spec**](./09-DPDP-ACT-2023-IMPLEMENTATION-SPEC.md) | Fullstack Engineers, Product Managers | Exact live implementation: `CustomerConsent` model, phone-based deduplication, Table QR unchecked checkbox, 3-hour TTL privacy shield, and Owner/Manager `/crm` verification modals (`👁️` & `#`). |
| **10** | [**Production Cloud SaaS Deployment**](./10-PRODUCTION-CLOUD-SAAS-DEPLOYMENT.md) | DevOps, Cloud Engineers | Single-VPS (Hostinger KVM 2) architecture, Docker Compose, Caddy reverse-proxy SSL/TLS, PgBouncer pooling, Redis Pub/Sub, zero-downtime deploy. |
| **STRATEGY** | [**14-Day Launch Cheat Sheet**](./KIVO_14_DAY_LAUNCH_CHEAT_SHEET.html) | Restaurant Owners, General Managers, Ops Leads | Day-by-day tactical execution blueprint from Day 1 (Account provisioning) to Day 14 (Full launch with zero downtime). |

---

## 🔄 PRD $\leftrightarrow$ Technical Doc Cross-Reference (Traceability Matrix)

| Product Requirement (PRD - Vol 01) | Technical Implementation (Tech Doc - Vol 02/03) | Operational Runbook (Vol 04/05/06/07) |
| :--- | :--- | :--- |
| **Sub-Second 3-Tap Billing** | TanStack Table, local state caching, server-authoritative money | [Vol 04: Counter POS](./04-OPERATIONS-AND-POS-MANUAL.md) |
| **100% Offline Rush Hour Mode** | IndexedDB client persistence, monotonic queue, conflict resolver | [Vol 02: Offline Engine](./02-TECHNICAL-ARCHITECTURE.md) |
| **38-Key Granular RBAC** | `@futora/types` `PERMISSIONS`, `PermissionsGuard`, audit trail | [Vol 06: RBAC Matrix](./06-SECURITY-AND-COMPLIANCE.md) |
| **In-Place Manager Approvals** | `/v1/approvals/request`, `/v1/approvals/verify`, PIN modals | [Flow 02 in Flow Maps](./SYSTEM_FLOW_CHARTS_AND_MINDMAPS.md) |
| **Device Pairing with Single-Use PIN** | Atomic `/v1/devices/pair`, `updateMany`, rate-throttling | [Vol 06: Security](./06-SECURITY-AND-COMPLIANCE.md) |
| **Interactive Table Floor Layout** | dnd-kit visual drag canvas, real-time WebSocket room broadcast | [Vol 04: Floor Management](./04-OPERATIONS-AND-POS-MANUAL.md) |
| **Multi-Station Kitchen Routing** | NestJS WebSocket gateway, color-coded bump state machine | [Vol 04: KDS Routing](./04-OPERATIONS-AND-POS-MANUAL.md) |
| **Gram-Level Recipe Deductions** | Relational recipe BOM schema, atomic inventory transactions | [Vol 05: Recipe BOM](./05-INVENTORY-AND-SUPPLY-CHAIN.md) |
| **QR Menu Ordering (Modes A & B)** | `/v1/public/menu/:slug`, staff acceptance queue gate | [Flow 05 & 07 in Flow Maps](./SYSTEM_FLOW_CHARTS_AND_MINDMAPS.md) |
| **Anti-Fraud Loyalty Clawback** | `refund()` ledger reversal, points proportional subtraction | [Vol 08: Security Audit](./08-SECURITY-AUDIT-AND-PENETRATION-REPORT.md) |
| **DPDP Act 2023 & GST Compliance** | Consent capture, phone masking, GST 5%/18% tax engine | [Vol 09: DPDP & Regulations](./09-INDIAN-REGULATIONS-AND-DPDP-ACT.md) |
| **11-Step Owner Onboarding Wizard** | `/onboarding`, autosave, local mirror, live materializer | [Vol 00: Project State](./00-PROJECT-STATE-AND-PHASE-ROADMAP.md) |
| **Super Admin Platform Console** | `/super-admin`, multi-tenant management, plan tiers, freeze | [Vol 00: Project State](./00-PROJECT-STATE-AND-PHASE-ROADMAP.md) |
| **14-Day Restaurant Launch Strategy** | Tactical Day 1-14 runbook, checklists, role play drills | [14-Day Launch Strategy](./KIVO_14_DAY_LAUNCH_CHEAT_SHEET.html) |
| **ESC/POS Thermal Printing** | Direct raw binary ESC/POS socket (port 9100), WebUSB, WebBluetooth | [Vol 07: Hardware Setup](./07-DEPLOYMENT-AND-HARDWARE.md) |

---

## 🏛️ Permanent Project Invariants (from `BRAIN.md`)
1. **Frontend Hygiene**: Never link or expose internal markdown docs, `/llms.txt`, or Git URLs on the public frontend website.
2. **Developer Attribution**: Lead Developer & Software Architect is **Madhur Dhadve** (held strictly in metadata and AI schema layer, never visible on customer UI).
3. **Brand Entity**: **KIVOKO RESTAURANT OS** under **FUTORA GROUP OF COMPANIES** (`https://www.futoragroup.in/`).
4. **Canonical Domain**: `https://www.kivo.futoragroup.in` (aligned with Google Search Console).
5. **Quality Gate**: Zero regressions allowed. Backend tests (52 test suites, 444 tests) and Web tests (66 tests) must remain 100% green before all merges.
