# KIVOKO — RBAC, PIN Login & Onboarding Wizard  
## Master Implementation Plan  
_Authored: 2026-11-23 | Status: PLAN (not started)_

---

## 1. Honest Gap Analysis — What Already Exists vs. What's Missing

### ✅ Already Built (Do NOT rebuild)

| Module | Location | What it does |
|---|---|---|
| PIN login endpoint | `auth/auth.service.ts → pinLogin()` | Validates PIN via bcrypt, returns JWT session |
| `/v1/auth/pin-login` route | `auth/auth.controller.ts` | Throttled 5/min/IP — POST with `{ userId, pin }` |
| `User.pinHash` field | Prisma schema | Stores bcrypt-hashed PIN per user |
| Role CRUD | `roles/roles.service.ts` | Create/update/delete custom roles, audit-logged |
| Permission seeding | `auth/auth.service.ts → register()` | Seeds all `PERMISSIONS` on first registration |
| `@Auth('key')` decorator | `common/decorators/auth.decorator.ts` | Combines JWT + PermissionsGuard on any route |
| `PermissionsGuard` | `common/guards/permissions.guard.ts` | Server-side enforcement — always checked |
| `UserPermissionOverride` | Prisma schema + `users.service.ts` | GRANT/DENY per-user overrides with expiry |
| Privilege escalation block | `users.service.ts → setPermissionOverrides()` | Actor can only GRANT what they hold |
| `UserBranch` multi-outlet | Prisma schema | User ↔ Branch junction (already in use) |
| `AuditLog` + `AuditService` | `audit/` | Logs who did what, with metadata + entityId |
| Staff CRUD | `modules/users/users.service.ts` | create/update/delete/list with branches |
| Staff page (basic UI) | `web/app/(dashboard)/settings/staff/page.tsx` | List, deactivate, delete, role badge |
| `StaffAccessDialog` | web settings component | Per-user permission override editor |
| `AddStaffDialog` | web settings component | Add staff form |
| Onboarding page (basic) | `web/app/onboarding/page.tsx` | 4-step wizard (restaurant name, cuisine, branch, creds) |
| `RolePermission` table | Prisma schema | Many-to-many roles ↔ permissions |
| Last-owner guard | `auth.service.ts → deleteOwnAccount()` | Can't delete if last owner |

---

### ❌ Missing — Must Build

| Feature | Why it's needed | Priority |
|---|---|---|
| **Device Registration system** | PIN should only work on approved devices (tablets linked by owner) | P0 |
| **Per-user PIN attempt lockout** | Throttler only limits by IP — a known `userId` can be brute-forced from multiple IPs | P0 |
| **Manager Approval flow (🔐)** | "Enter your manager PIN to approve this action" on same device | P0 |
| **`ApprovalLog` table** | Persist who approved what, with reason + timestamp | P0 |
| **PIN auto-generate on staff create** | Unique within restaurant (not globally) | P1 |
| **PIN uniqueness validation** | Before saving, check no other user in restaurant has the same PIN hash | P1 |
| **New RBAC permission keys** | `order.modify_after_kot`, `order.cancel_item`, `bill.cancel_settled`, `discount.apply_small`, `table.transfer_merge`, `kitchen.view_kot` — not in current `PERMISSIONS` | P1 |
| **Role editor UI** | Toggle individual permissions grouped by module, live "what can this role do" preview | P1 |
| **Staff PIN display (shown-once)** | Show generated PIN once to owner at staff creation; never store in plain text | P1 |
| **Force logout / invalidate session** | Owner clicks "Deactivate" → running sessions die immediately | P1 |
| **Onboarding wizard (complete)** | Current is 4-step signup only; need full 11-step wizard (taxes, menu, floors, kitchen, payment, staff, device, test mode) | P1 |
| **Offline PIN login** | Hash PIN list in IndexedDB; login works without internet, syncs when online | P2 |
| **Bulk menu upload** | CSV/Excel import with row-by-row validation errors | P2 |
| **Device linking UI** | QR code or restaurant code → owner approves on admin panel | P2 |
| **Automated RBAC tests** | Each role vs each permission, escalation, cross-tenant, approval flow | P2 |

---

## 2. Tech Stack (confirmed, no changes)

```
Backend:   NestJS + Prisma + PostgreSQL
Frontend:  Next.js 15 + TanStack Query + Zod + Tailwind + shadcn/ui
Auth:      JWT (httpOnly cookie) + bcrypt PINs
Monorepo:  pnpm workspaces (@futora/backend, @futora/types, apps/web)
```

---

## 3. Phased Build Plan

### PHASE 1 — DB Schema & Permission Keys
**Goal:** Add only what's missing to the schema; never touch what works.

**Schema additions:**
```
model DeviceRegistration {
  id           String   @id @default(cuid())
  restaurantId String                          -- tenant isolation
  branchId     String                          -- which outlet this device serves
  deviceLabel  String                          -- e.g. "Table 4 iPad"
  deviceFingerprint String                     -- browser fingerprint or UUID stored client-side
  isApproved   Boolean  @default(false)
  approvedAt   DateTime?
  approvedById String?
  revokedAt    DateTime?
  createdAt    DateTime @default(now())
}

model PinAttempt {                             -- per-user lockout (beyond IP throttle)
  id        String   @id @default(cuid())
  userId    String
  deviceId  String?
  attemptedAt DateTime @default(now())
  success   Boolean
}

model ApprovalLog {                            -- manager approves a 🔐 action
  id            String   @id @default(cuid())
  restaurantId  String
  requesterId   String                        -- staff who triggered the action
  approverId    String                        -- manager/owner who entered PIN
  permissionKey String                        -- e.g. "order.cancel_item"
  orderId       String?                       -- context (optional)
  reason        String?
  deviceId      String?
  createdAt     DateTime @default(now())
}
```

**New permission keys to add to `packages/types/src/permissions.ts`:**
```
order.modify_after_kot     — edit order after KOT sent
order.cancel_item          — cancel individual item on a KOT
bill.cancel_settled        — void a settled bill
discount.apply_small       — apply discount up to X% (threshold set in settings)
table.transfer_merge       — transfer/merge tables
kitchen.view_kot           — view KDS / KOT screen
item.mark_out_of_stock     — mark an item unavailable
```

**Seed additions:**  
Extend `DEFAULT_ROLE_PERMISSIONS` for new keys across all roles per the matrix in requirements.

---

### PHASE 2 — Backend: Device Linking, PIN Lockout & Approval Flow

#### 2A — Device Registration API
```
POST   /v1/devices/register        — device self-registers, gets pending status
POST   /v1/devices/:id/approve     — @Auth('devices.manage') owner approves
DELETE /v1/devices/:id             — revoke device
GET    /v1/devices                 — list all devices for restaurant
```

**PIN login change:** After PIN validates, check `DeviceRegistration` table — if device fingerprint not approved, return 403 `DEVICE_NOT_APPROVED`.

#### 2B — PIN Lockout (beyond IP throttle)
- After each failed PIN attempt, write to `PinAttempt` table.
- Before validating, count failed attempts in last 15 min for that `userId`.
- Lockout at 5 fails → `HTTP 429`, include `retryAfter` timestamp.
- Lockout at 10 cumulative fails → flag user, require owner PIN reset.
- Existing `@Throttle` on the route stays as IP-level first line.

#### 2C — Manager Approval Flow API
```
POST /v1/approvals/request
  body: { permissionKey, context: { orderId? }, deviceId }
  → creates a pending record, returns approvalRequestId

POST /v1/approvals/:id/approve
  body: { approverPin, approverId }
  → verifies approver's PIN, checks approver has the permission, records ApprovalLog
  → returns a short-lived token (15 min) the frontend uses to execute the guarded action

Middleware: @RequireApproval('order.cancel_item')
  → decorator on endpoint that accepts the approval token header
```

#### 2D — Force Logout on Deactivation
- `users.service.ts → deactivate()` → delete all `DeviceToken` rows + push JWT blocklist entry (Redis or short-lived DB table with `invalidatedAt`).
- `JwtAuthGuard` checks blocklist on every request (with 60s in-memory cache to avoid DB hit per request).

---

### PHASE 3 — Owner UI: Staff & Roles (complete rebuild of existing basic page)

**Three tabs under `/settings/staff`:**

#### Tab 1: Staff List
- Searchable table: Name | Role badge | Outlet(s) | Status toggle | Actions
- Actions: Change Role (dropdown) | Reset PIN (shows new PIN once) | Deactivate | View permission overrides
- "Add Staff" button → drawer (see below)

#### Tab 2: Add / Edit Staff Drawer
- Fields: Name, Phone, Role (dropdown of roles for this restaurant), Outlet(s) (multi-select), PIN
- PIN: auto-generate button (4-6 digit, unique in restaurant) OR manual entry
- Generated PIN shown once in a copy-able box — never shown again
- Validation: duplicate PIN check in real time

#### Tab 3: Role Editor
- List of roles (system + custom) with permission counts
- "+ New Role" → start from a template
- Toggle matrix: grouped by module (Orders / Billing / Kitchen / Menu / Reports / Settings / Admin)
- Right side: live "What this role CAN do" summary list
- Safeguard: cannot toggle a permission you don't have yourself
- Save → updates DB, invalidates active sessions for affected users

#### Tab 4: Devices
- List of registered devices with label, outlet, status (approved/pending/revoked)
- Approve / Revoke buttons
- "Link new device" → generates a QR code / restaurant code for the device to scan

---

### PHASE 4 — Full 11-Step Onboarding Wizard

**Current state:** 4-step wizard exists (restaurant name, cuisine, branch, creds). Needs to expand to 11 steps with save-and-resume.

**New steps to add after the current 4:**

| Step | What it collects |
|---|---|
| 5 | **Taxes & Charges** — GST slabs (5%, 12%, 18%, 28%), service charge %, packaging charge |
| 6 | **Menu Setup** — categories, items (name, price, veg/non-veg, photo), variants, add-ons. CSV bulk upload with row-by-row error display |
| 7 | **Floors & Tables** — sections, table count, optional QR per table |
| 8 | **Kitchen Stations & Printers** — station names (Grill, Cold, Bar), map categories to stations, KOT printer IP/USB config |
| 9 | **Payment Modes** — toggle: Cash, UPI, Card, Swiggy Pay, etc. |
| 10 | **Staff & Roles** — add first staff member(s), assign roles, generate PINs |
| 11 | **Device Linking** — link tablet via restaurant code/QR, owner approves |
| 12 | **Test Mode** — place a sample order → KOT → bill → payment → "Go Live" |

**Save & resume:** Each completed step saves progress to `OnboardingProgress` JSON column on `Restaurant` model. Navigating away and returning picks up where left off.

**"Help me setup" button:** Opens a guided tooltip overlay per step.

---

### PHASE 5 — Offline PIN Login

**How it works:**
1. When device is online, download encrypted staff list (`{ userId, encryptedPinHash, name, role, permissions }`) to IndexedDB.
2. Encryption key = derived from `restaurantId` + device fingerprint (PBKDF2).
3. Offline login: compare entered PIN against local hashed list → issue a local JWT (signed with offline secret, short 2h expiry).
4. All actions during offline are queued in outbox (already built in Phase 6 of previous work).
5. On reconnect: sync PIN list updates (deactivated users, PIN resets), flush outbox.

**Security:**  
- Offline JWTs only accepted by the local service worker, not the backend.  
- After reconnect, force re-auth within 30 min.

---

### PHASE 6 — Automated Tests

```
Tests to write:
  RBAC matrix: for each role × each permission key → assert allow/deny
  Escalation: Manager cannot grant permissions they don't hold
  Cross-tenant: User A cannot read/write User B's restaurant data
  Approval flow: 
    - Cashier cannot cancel item without approval
    - Manager approval token allows the action once
    - Token is not reusable (replay attack)
  Device lockout: 5 wrong PINs → 429, correct PIN after lockout → still denied
  Last-owner guard: Cannot deactivate/demote last owner
```

---

### PHASE 7 — Security Review

Formal review document covering:
- PIN brute-force exposure
- Cross-tenant data isolation
- JWT invalidation on deactivation
- Approval token replay
- Offline sync integrity
- Privilege escalation vectors
- Audit log tamper-resistance

---

## 4. File Change Inventory

### New Files
```
backend/src/devices/                     — device registration module
backend/src/approvals/                   — approval flow module
backend/src/auth/pin-lockout.service.ts  — per-user lockout logic
packages/types/src/devices.ts            — DeviceRegistration DTOs
packages/types/src/approvals.ts          — ApprovalRequest DTOs
web/app/(dashboard)/settings/staff/      — rebuilt staff & roles UI
web/app/onboarding/steps/               — 11 step components
web/lib/offline-pin.ts                   — IndexedDB offline PIN cache
web/lib/device-fingerprint.ts            — deterministic browser fingerprint
```

### Modified Files
```
packages/types/src/permissions.ts        — +7 new permission keys
apps/backend/prisma/schema.prisma        — +DeviceRegistration, +PinAttempt, +ApprovalLog
apps/backend/src/auth/auth.service.ts    — PIN login checks device + lockout
apps/backend/src/modules/users/          — PIN generate, uniqueness check
apps/backend/src/app.module.ts           — register new modules
apps/web/app/onboarding/page.tsx         — expand to 11 steps
```

---

## 5. Execution Order (Dependencies)

```
Phase 1 (Schema + Keys)
  ↓
Phase 2A (Devices API)  ←──┐
Phase 2B (PIN Lockout)      ├── can be done in parallel
Phase 2C (Approval Flow)   ←┘
  ↓
Phase 2D (Force Logout)
  ↓
Phase 3 (Staff & Roles UI)
  ↓
Phase 4 (Onboarding Wizard)
  ↓
Phase 5 (Offline PIN) ← depends on device fingerprinting from Phase 3
  ↓
Phase 6 (Tests)
  ↓
Phase 7 (Security Review)
```

---

## 6. Clarifying Questions (answered inline from codebase audit)

| Question | Answer found |
|---|---|
| PIN length? | Current schema allows any length. We'll default to 4-digit, configurable to 6 in settings |
| Replace existing onboarding? | No — expand it. Current 4-step is signup; we add 8 more steps after |
| Device linking: QR or manual code? | Both — QR (camera scan) primary, manual restaurant code fallback |
| Offline storage mechanism? | IndexedDB (already pattern exists in offline-outbox.ts) |
| Keep existing `/signup` and `/login`? | Yes — untouched. Only the POS terminal PIN login path changes |

---

## 7. What We Won't Change

- Existing `@Auth()` decorator — already works perfectly
- `PermissionsGuard` — solid, server-enforced  
- `AuditService` — will only add more callers
- `roles.service.ts` CRUD — already production-grade
- `UserPermissionOverride` with expiry + DENY — already built
- `effectivePermissions()` helper in `auth/effective-permissions.ts`
- All existing tests (330 backend + 59 frontend) must stay green after every phase

---

_Ready to execute Phase 1 on your GO signal._
