# KIVO POS — Master Phased Execution Plan (PLAN.md)
*Granular Micro-Phase Roadmap for Zero-Regression, Bug-Free Execution*  
*Version: 1.0 | Total Phases: 13 Major Phases broken into 34 Atomic Micro-Phases*

---

## Operating Agreement & Execution Rules
1. **Zero Regressions:** After every micro-phase, all 330 backend tests, 59 web tests, and both TypeScript typechecks (`tsc --noEmit`) must pass with 0 errors.
2. **Atomic Commits:** Each micro-phase touches 2–5 files maximum and represents a single clean git commit on `feature/final-build-v1`.
3. **Stop & Report:** Stop after each major phase (or requested micro-phase) and report: touched files, test results, and known gaps. Wait for approval before moving to the next.
4. **Ship Dark:** All new capabilities sit behind feature flags (default off).

---

## Master Micro-Phase Breakdown Matrix (34 Atomic Steps)

```
PHASE 0: Baseline & Environment Setup
  ├── 0.1: Git Branch & Secret Store Environment (.env.example, pepper config)
  └── 0.2: Automated Baseline Test & Typecheck Gate

PHASE 1: Additive Database Schema & Migration Foundation
  ├── 1.1: User Extensions & RBAC Models (pinLookup, pepperKeyId, permissionsVersion)
  ├── 1.2: Device Registration & Manager Approval Models
  ├── 1.3: Table Sessions, Split Bills & Append-Only Order Events
  └── 1.4: QR Ordering, Manual Payments, Feature Flags & Idempotency Models

PHASE 2: Granular Permissions Engine & Zero-Downtime Backfill
  ├── 2.1: Types Package Update: 38 Permission Keys & STAFF_ROLES Extension
  ├── 2.2: Idempotent Database Seed & Backfill Script
  └── 2.3: PermissionsGuard Upgrade (Version-based Invalidation via Redis/Cache)

PHASE 3: Device Registration & 6-Digit PIN Authentication
  ├── 3.1: Cryptographic PIN Service (HMAC-SHA256 Peppered Lookup + Argon2id)
  ├── 3.2: Device Pairing Flow (10-min QR Code, Approval, 256-bit Cookie Token)
  └── 3.3: Device PIN Login API & 5-Attempt 15-Minute Lockout Engine

PHASE 4: In-Place Manager Approval Engine (🔐)
  ├── 4.1: Manager PIN Verification & 2-Minute Single-Use ApprovalToken Issuance
  └── 4.2: NestJS @RequireApproval() Decorator & Transactional Token Consumption

PHASE 5: Order Ownership, Concurrency & Table Assignment
  ├── 5.1: Optimistic Locking Engine (Integer Version Field & 409 Conflict Handling)
  ├── 5.2: Table Assignment Service (Floor Plan Table-to-Staff Binding)
  └── 5.3: Staff Order Ownership & Post-KOT Immutability Enforcement

PHASE 6: Owner Dashboard UI: Staff, Roles & Devices
  ├── 6.1: Staff Management Screen (6-Digit PIN Generator with Single-View Slip)
  ├── 6.2: Custom Role Editor (38-Key Toggle Matrix with Live Module Summary)
  └── 6.3: Device Management Panel (Live Status, Remote Revocation & Unlocking)

PHASE 7: 11-Step Owner Onboarding Wizard
  ├── 7.1: Wizard Container (OnboardingProgress Autosave, Resume & Hindi/English UI)
  ├── 7.2: Steps 1–6 (Profile, Multi-Outlet, Tax Slabs, Menu Bulk CSV, Tables, KDS/Printers)
  └── 7.3: Steps 7–11 (Payment Modes, Staff PINs, Device Pairing, Test Mode & Go-Live)

PHASE 8: Guest QR Menu — Mode A (Read-Only & High Performance)
  ├── 8.1: Opaque HMAC Token Generator & Headless Printable PDF Sheet Export
  ├── 8.2: Public Menu API (/public/q/:token) with Redis ETag & Time Slot Filtering
  └── 8.3: Mobile-First Guest Menu UI (< 80 KB JS, WebP Lazy Images, Bilingual Toggle)

PHASE 9: Guest Self-Ordering — Mode B & Split Bills
  ├── 9.1: GuestSession & TableSession Lifecycle (Name + Mobile, Consent, Cookie)
  ├── 9.2: Mobile Cart, Server-Side Quote Recalculation & Idempotent Submit
  └── 9.3: Order Tracking Screen (/o/:trackingToken) & Split Bill Per Guest

PHASE 10: Staff POS QR Orders Queue & Kitchen Routing
  ├── 10.1: Live QR Queue Screen (Sound Chimes, Accept/Reject/Edit Drawer)
  └── 10.2: Atomic Order Acceptance -> Primary Order & Station-Routed KOT Dispatch

PHASE 11: Manual UPI Payments & Staff Verification
  ├── 11.1: Owner Payment Config (QR Upload, Server VPA Decode & Tamper Protection)
  ├── 11.2: Guest Payment Screen (Static UPI QR, 6-Char Ref Code, Claim Payment)
  └── 11.3: Staff Verification Queue, Two-Person Rule & Daily Reconciliation Report

PHASE 12: Offline PWA & Pos Outbox
  ├── 12.1: Local IndexedDB Salted Argon2id PIN Cache (48-Hour Expiry)
  └── 12.2: Offline POS Order Outbox with Idempotency Replay & Conflict Resolution

PHASE 13: Background Worker, Security Hardening & Super Admin
  ├── 13.1: BullMQ Scheduled Jobs (Unpaid Expiry, 90-Day Anonymization, Token Cleanup)
  └── 13.2: Load Simulation Script (70 Restaurants Peak) & Minimal Super Admin Panel
```

---

## Detailed Implementation Steps per Micro-Phase

### Phase 0: Baseline & Environment Setup
- **Micro-Phase 0.1:** Create git branch `feature/final-build-v1`. Define `.env.example` with `SERVER_PEPPER_V1`, `QR_SIGNING_SECRET`, and `COOKIE_SECURE`.
- **Micro-Phase 0.2:** Run and verify baseline tests (330 backend, 59 web, 0 type errors).

### Phase 1: Additive Database Schema & Migration Foundation
- **Micro-Phase 1.1:** Add `pinLookup`, `pepperKeyId`, `permissionsVersion`, and `mustChangePin` to `User` model.
- **Micro-Phase 1.2:** Add `DeviceRegistration`, `DevicePairingCode`, `PinAttempt`, `ApprovalToken`, and `ApprovalLog`.
- **Micro-Phase 1.3:** Add `TableAssignment`, `TableSession`, `Bill`, and `OrderEvent` with PostgreSQL triggers rejecting `UPDATE` and `DELETE`.
- **Micro-Phase 1.4:** Add `QrSettings`, `QrCode`, `GuestSession`, `GuestBlock`, `QrOrder`, `QrOrderItem`, `CallWaiterRequest`, `OutletPaymentConfig`, `PaymentRecord`, `OnboardingProgress`, `FeatureFlag`, `PrintJob`, and `IdempotencyKey`. Run additive migration.

### Phase 2: Granular Permissions Engine & Zero-Downtime Backfill
- **Micro-Phase 2.1:** Update `packages/types/src/rbac.ts` with all 38 permission keys and `CAPTAIN` role.
- **Micro-Phase 2.2:** Build idempotent backfill script mapping all existing roles to the new 38 keys without permission drops.
- **Micro-Phase 2.3:** Enhance `PermissionsGuard` to check `permissionsVersion` against Redis cache.

### Phase 3: Device Registration & 6-Digit PIN Authentication
- **Micro-Phase 3.1:** Implement cryptographic PIN service (`HMAC-SHA256` peppered lookup hash + Argon2id verification).
- **Micro-Phase 3.2:** Build device pairing endpoints (`POST /v1/devices/pair`, `POST /v1/devices/:id/approve`, `POST /v1/devices/:id/revoke`).
- **Micro-Phase 3.3:** Build `POST /v1/auth/device-pin-login` with 5-fail 15-minute device lockout and remote early unlock.

### Phase 4: In-Place Manager Approval Engine (🔐)
- **Micro-Phase 4.1:** Build `POST /v1/approvals` for manager PIN verification, returning 2-minute single-use `ApprovalToken`.
- **Micro-Phase 4.2:** Implement `@RequireApproval()` decorator, guard, and transactional token consumption.

### Phase 5: Order Ownership, Concurrency & Table Assignment
- **Micro-Phase 5.1:** Add integer `version` checking to `orders.service.ts` returning `HTTP 409 Conflict` on stale writes.
- **Micro-Phase 5.2:** Implement `TableAssignmentService` (shift table assignments and waiter boundaries).
- **Micro-Phase 5.3:** Enforce order ownership (staff can only modify their own orders or assigned tables without `order.modify_any`).

### Phase 6: Owner Dashboard UI: Staff, Roles & Devices
- **Micro-Phase 6.1:** Build Staff Management UI (`apps/web/app/(dashboard)/settings/staff/page.tsx`) with 6-digit PIN slip printing.
- **Micro-Phase 6.2:** Build Custom Role Editor component with 38-key toggle matrix grouped by module.
- **Micro-Phase 6.3:** Build Devices Management tab with pairing QR generator, live status, and Revoke/Unlock buttons.

### Phase 7: 11-Step Owner Onboarding Wizard
- **Micro-Phase 7.1:** Create Onboarding wizard frame with progress bar, `OnboardingProgress` DB autosave, and language toggle.
- **Micro-Phase 7.2:** Build Steps 1–6 (Profile, Multi-Outlet, Taxes, Menu Bulk Import with dry run, Tables, Kitchen/Printers).
- **Micro-Phase 7.3:** Build Steps 7–11 (Payment modes with UPI QR upload, Staff PINs, Device pairing, Sandbox test order, Go-Live).

### Phase 8: Guest QR Menu — Mode A (Read-Only & High Performance)
- **Micro-Phase 8.1:** Build pure JS QR token generator (`qrcode`) and printable PDF exporter (`@react-pdf/renderer`).
- **Micro-Phase 8.2:** Build Public Menu API (`GET /public/q/:token`) with Redis ETag caching and time-slot awareness.
- **Micro-Phase 8.3:** Build Mobile Guest Menu Page (`apps/web/app/(guest)/q/[token]/page.tsx`) within $< 80\text{ KB}$ JS budget.

### Phase 9: Guest Self-Ordering — Mode B & Split Bills
- **Micro-Phase 9.1:** Build `GuestSession` & `TableSession` initialization (Name + 10-digit mobile, DPDP consent, cookie).
- **Micro-Phase 9.2:** Build Guest Cart Drawer, server-recalculated quote endpoint, and idempotent order placement.
- **Micro-Phase 9.3:** Build Guest Order Tracking Page (`/o/:trackingToken`) with 5-second polling and Split Bill per guest.

### Phase 10: Staff POS QR Orders Queue & Kitchen Routing
- **Micro-Phase 10.1:** Build Staff QR Orders Screen with sound chime, visual alerts, and Accept/Reject/Edit drawer.
- **Micro-Phase 10.2:** Build transactional order acceptance: convert `QrOrder` $\rightarrow$ `Order`, route KOTs to kitchen stations, attach to bill.

### Phase 11: Manual UPI Payments & Staff Verification
- **Micro-Phase 11.1:** Build Owner Payment Config UI with server-side QR image decode verification and alert triggers.
- **Micro-Phase 11.2:** Build Guest UPI Payment Screen with static QR, large amount, copy buttons, and claim submission.
- **Micro-Phase 11.3:** Build Staff Payment Verification Queue, two-person rule enforcement, and daily reconciliation report.

### Phase 12: Offline PWA & Pos Outbox
- **Micro-Phase 12.1:** Implement IndexedDB encrypted PIN storage for offline staff switching (48-hour expiration).
- **Micro-Phase 12.2:** Implement POS order outbox with background replay and conflict detection.

### Phase 13: Background Worker, Security Hardening & Super Admin
- **Micro-Phase 13.1:** Implement BullMQ scheduled workers (15-min unpaid order expiry, 90-day guest anonymization).
- **Micro-Phase 13.2:** Execute peak load simulation script (70 restaurants concurrent) and ship minimal Super Admin panel.

---

## Zero-Regression Verification Gate Checklist
Before marking any micro-phase as complete:
- [ ] `pnpm --filter @futora/backend test` passes (330+ tests, 0 failures).
- [ ] `pnpm --filter web test` passes (59+ tests, 0 failures).
- [ ] `pnpm --filter @futora/backend typecheck` passes (0 errors).
- [ ] `pnpm --filter web typecheck` passes (0 errors).
- [ ] No existing database columns, enums, or indexes were dropped or renamed.
