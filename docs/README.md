# KIVO — Master Documentation & Table of Contents (TOC)

> **KIVO — Software for Restaurant Management Simplified**  
> All-in-one Cloud POS & HORECA Operating System  
> Organization: **FUTORA GROUP OF COMPANIES**  
> Production Domain: [https://www.kivo.futoragroup.in](https://www.kivo.futoragroup.in)  
> Version: 1.0.0 (Production SaaS)

---

## 📚 The 7 Master Documentation Volumes

The KIVO documentation suite is organized into **7 core volumes** providing full coverage across Product Requirements (PRD), Technical Architecture, Operations, Integrations, and Compliance:

```
docs/
├── README.md                              ← Master Table of Contents (This file)
├── 01-PRD-PRODUCT-REQUIREMENTS.md         ← Volume 1: Product Requirements Document (PRD)
├── 02-TECHNICAL-ARCHITECTURE.md           ← Volume 2: Technical Architecture & System Design
├── 03-API-AND-INTEGRATIONS.md             ← Volume 3: APIs, Webhooks & MCP Technical Document
├── 04-OPERATIONS-AND-POS-MANUAL.md        ← Volume 4: POS Billing, Table Management & KDS Manual
├── 05-INVENTORY-AND-SUPPLY-CHAIN.md       ← Volume 5: Inventory, Recipe Costing & Commissary Guide
├── 06-SECURITY-AND-COMPLIANCE.md          ← Volume 6: Security, RBAC & India GST Compliance Guide
└── 07-DEPLOYMENT-AND-HARDWARE.md          ← Volume 7: Hardware Setup, Mobile Apps & Deployment
```

---

## 🗺️ Master Table of Contents (TOC)

| Volume | Document Title | Primary Audience | Core Focus & Topics |
| :---: | :--- | :--- | :--- |
| **01** | [**PRD: Product Requirements**](./01-PRD-PRODUCT-REQUIREMENTS.md) | Product Managers, Founders, Investors | Product vision, target personas, business model, functional modules (POS, KDS, CRM, Tables), competitive edge vs Petpooja/Toast, feature roadmap. |
| **02** | [**Technical Architecture**](./02-TECHNICAL-ARCHITECTURE.md) | Software Architects, Fullstack Engineers | Next.js 16 App Router, NestJS backend, Prisma ORM, PostgreSQL schema, IndexedDB offline sync engine, WebSockets, design system tokens. |
| **03** | [**APIs, Webhooks & MCP**](./03-API-AND-INTEGRATIONS.md) | Backend Devs, AI Engineers, Integrators | REST Integration API, Model Context Protocol (MCP) server endpoints, webhook HMAC verification, Swiggy/Zomato payload normalization. |
| **04** | [**POS Billing & Operations**](./04-OPERATIONS-AND-POS-MANUAL.md) | Restaurant Managers, Cashiers, Captains | 3-tap rapid checkout, visual floor management, captain ordering, course pacing, split billing, multi-station KDS routing, token displays. |
| **05** | [**Inventory & Supply Chain**](./05-INVENTORY-AND-SUPPLY-CHAIN.md) | Chefs, Purchase Managers, Storekeepers | Gram-level recipe deductions, FIFO waste logging, purchase orders, goods receipt notes (GRN), central commissary transfers, CSV data imports. |
| **06** | [**Security & Compliance**](./06-SECURITY-AND-COMPLIANCE.md) | Compliance Officers, Security Auditors | 25+ granular RBAC permissions, multi-tenant isolation, India GST (CGST/SGST/IGST, HSN), DPDP Act 2023, Veri*factu tamper-proofing, WCAG AA. |
| **07** | [**Hardware & Deployment**](./07-DEPLOYMENT-AND-HARDWARE.md) | DevOps, System Admins, Field Technicians | ESC/POS thermal printers (USB/Bluetooth/LAN 9100), Android/iOS mobile apps, self-service kiosks, Docker/Vercel deployment runbooks. |

---

## 🔄 PRD $\leftrightarrow$ Technical Doc Cross-Reference (Vice-Versa Mapping)

| Product Requirement (PRD - Vol 01) | Technical Implementation (Tech Doc - Vol 02/03) | Operational Runbook (Vol 04/05/07) |
| :--- | :--- | :--- |
| **Sub-Second 3-Tap Billing** | TanStack Table, local state caching, server-authoritative money | [Vol 04: Section 1 (Counter POS)](./04-OPERATIONS-AND-POS-MANUAL.md) |
| **100% Offline Rush Hour Mode** | IndexedDB client persistence, monotonic queue, conflict resolver | [Vol 02: Section 4 (Offline Engine)](./02-TECHNICAL-ARCHITECTURE.md) |
| **Interactive Table Floor Layout** | dnd-kit visual drag canvas, real-time WebSocket room broadcast | [Vol 04: Section 2 (Floor Management)](./04-OPERATIONS-AND-POS-MANUAL.md) |
| **Multi-Station Kitchen Routing** | NestJS WebSocket gateway, color-coded bump state machine | [Vol 04: Section 3 (KDS Routing)](./04-OPERATIONS-AND-POS-MANUAL.md) |
| **Gram-Level Recipe Deductions** | Relational recipe BOM schema, atomic inventory transactions | [Vol 05: Section 2 (Recipe BOM)](./05-INVENTORY-AND-SUPPLY-CHAIN.md) |
| **External Integrations & AI** | Scoped API tokens, Model Context Protocol (MCP) server tools | [Vol 03: Section 3 & 4 (API & MCP)](./03-API-AND-INTEGRATIONS.md) |
| **GST & Regulatory Compliance** | Server-side tax engine, HSN/SAC grouping, immutable audit log | [Vol 06: Section 3 (GST Compliance)](./06-SECURITY-AND-COMPLIANCE.md) |
| **ESC/POS Thermal Printing** | Direct raw binary ESC/POS socket (port 9100), WebUSB, WebBluetooth | [Vol 07: Section 1 (Hardware Setup)](./07-DEPLOYMENT-AND-HARDWARE.md) |

---

## 🏛️ Permanent Project Invariants (from `BRAIN.md`)
1. **Frontend Hygiene**: Never link or expose internal markdown docs, `/llms.txt`, or Git URLs on the public frontend website.
2. **Developer Attribution**: Lead Developer & Software Architect is **Madhur Dhadve** (held strictly in metadata and AI schema layer, never visible on customer UI).
3. **Brand Entity**: **KIVO** under **FUTORA GROUP OF COMPANIES** (`https://www.futoragroup.in/`).
4. **Canonical Domain**: `https://www.kivo.futoragroup.in` (aligned with Google Search Console).
