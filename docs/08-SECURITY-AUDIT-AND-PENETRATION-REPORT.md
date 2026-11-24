# Volume 08: Security Audit & Penetration Testing Report

> **KIVOKO RESTAURANT OS — Enterprise Cloud & Offline-First POS System**  
> Document Type: Security Audit, Penetration Testing & Defensive Hardening Report  
> Companion RBAC Doc: [`06-SECURITY-AND-COMPLIANCE.md`](./06-SECURITY-AND-COMPLIANCE.md)  
> Version: 1.0.0  
> Status: Approved / Production Security Verification  

---

## 1. Executive Summary

A comprehensive multi-angle security audit was conducted simulating both offensive adversarial attacks and defensive engineering audits:
1. **Human QA End-to-End Walkthrough:** Table QR scanning, guest data capture, DPDP Act 2023 consent, KOT transmission, bill splitting, settlement, and CRM lifetime history aggregation.
2. **Offensive Security & Hacker Penetration Testing:** Privilege escalation, session token tampering, QR token spoofing, cross-tenant IDOR, device pairing concurrency race conditions, approval PIN brute forcing, loyalty refund point exploits, and table state collisions.
3. **Defensive Hardening:** Complete remediation of all 18 identified vulnerability vectors with zero regressions across the monorepo.

---

## 2. Attack Vectors Evaluated & Penetration Results

| # | Attack Vector Tested | Methodology / Hacker Vector | Pre-Audit Vulnerability | Post-Hardening State & Fix |
|---|---|---|---|---|
| **1** | **Abusive Guest Bypassing Ban** | Banned customer via `GuestBlock` attempts to place orders via Table QR. | `public-menu.service.ts` did not check `GuestBlock`. Banned users could still order. | **FIXED:** SHA-256 phone hash is computed and queried against active `GuestBlock`. Rejects with `403 Forbidden`. |
| **2** | **Emergency Pause & Basket Overflow** | Floods cart with 10,000 items or sends orders while kitchen is paused. | `QrSettings` (`orderingPaused`, `maxItemsPerOrder`, `maxQtyPerLine`) was never checked. | **FIXED:** Verified `QrSettings`. Rejects paused orders and enforces basket size limits with `400 Bad Request`. |
| **3** | **DoS / Status Endpoint Scraping** | Script spams `/public/menu/:qrToken/status` 1,000 req/sec to flood DB connections. | `/status` had no rate limiting. | **FIXED:** Enforced `@Throttle({ default: { limit: 30, ttl: 60_000 } })`. |
| **4** | **Skipping Kitchen Acceptance Gate** | Attacker sends order directly bypassing manager approval. | `createOrder` called without `requireAcceptance: true`, defaulting to `NOT_REQUIRED`. | **FIXED:** Set `requireAcceptance: true` to honor `branch.autoConfirmOrders`. |
| **5** | **Cross-Tenant IDOR on CRM** | Token from Restaurant B attempts to query `/customers/:id/history` of Restaurant A. | Route checked `branchAccess`, but consent audit had no `restaurantId` filter. | **FIXED:** Added explicit `restaurantId` filter to `getConsentAudit` query. |
| **6** | **Session Hijacking / Privacy Leak** | Guest sitting at Table 4 at 5:00 PM scans QR to inspect 1:00 PM guest's bill. | Stale orders on table were previously visible indefinitely. | **FIXED:** Strict 3-Hour TTL filter (`createdAt: { gte: threeHoursAgo }`). Replaces old order with Privacy Shield notice. |
| **7** | **Concurrent Device Pairing Race** | Attacker issues simultaneous requests with the same pairing code to bind multiple rogue devices. | Non-atomic check-then-act read followed by update allowed TOCTOU race. | **FIXED:** Converted pairing code redemption to atomic `updateMany({ where: { id, usedAt: null } })`. |
| **8** | **Device Pairing Brute-Force** | Script cycles through 6-digit codes to claim open pairing sessions. | `/v1/devices/pair` was unthrottled. | **FIXED:** Added `@Throttle({ default: { limit: 10, ttl: 60_000 } })`. |
| **9** | **Manager Approval PIN Enumeration**| Attacker rapidly guesses 6-digit manager PINs during on-screen approval modal. | `/v1/approvals/request` was unthrottled. | **FIXED:** Added `@Throttle({ default: { limit: 10, ttl: 60_000 } })`. |
| **10** | **Premature Table Reset on Billed Bill**| Waiter or API resets table status to `AVAILABLE` while bill is printed (`BILLED`) but unpaid. | Table status was mutated without checking active order status, causing uncollected bills. | **FIXED:** Blocked table status reset to `AVAILABLE` if active order is `BILLED`. |
| **11** | **Table Deletion with Active Orders**| Malicious staff deletes table record while diners are seated with open or billed checks. | Table delete did not check active orders, orphan-locking open transactions. | **FIXED:** Enforced foreign-order check blocking table deletion if open or billed orders exist. |
| **12** | **Duplicate Floor Table Numbers** | Staff creates two "Table 1" records on the same floor, causing orders to cross. | No unique index on `(floorId, tableNumber)`. | **FIXED:** Enforced floor-level uniqueness check before table creation. |
| **13** | **Table Transfer Overwrite on Billed**| Cashier moves an order to another table that already has an unpaid `BILLED` order. | Overwrote destination table state without checking billed conflicts. | **FIXED:** Explicitly blocked order relocation to tables holding active billed orders. |
| **14** | **Loyalty Points Refund Exploit** | Customer buys ₹10,000 meal, earns 1,000 points, redeems points, and demands a cash refund. | Refund returned cash without subtracting earned loyalty points. | **FIXED:** Proportionally clawed back earned points and logged `REFUND_REVERSAL` in `PointsLedger`. |
| **15** | **Anonymous Store Credit Leak** | Cashier refunds walk-in order to `STORE_CREDIT` without an attached customer account. | Created orphaned ledger credits. | **FIXED:** Blocked store credit refunds unless customer profile is linked to order. |
| **16** | **Table QR Collision on Billed Table**| Guest scans QR code on table that has an existing printed bill awaiting payment. | Created parallel order and overwrote table state. | **FIXED:** Rejected guest QR order creation if table has an active `BILLED` order. |
| **17** | **Split Bill Premature Table Release**| Customer settles 1 of 3 split checks; table was prematurely released while 2 splits were unpaid. | Checked only single order status on table release. | **FIXED:** Prevented table release if any sibling split order remains unsettled or `BILLED`. |
| **18** | **Loyalty Earn Division by Zero** | Branch config with `pointsPerCurrency = 0` triggers unhandled exception on order checkout. | Division by zero crashed checkout transaction. | **FIXED:** Added zero-guard returning 0 earned points when multiplier is 0 or negative. |

---

## 3. Human QA Flow Walkthrough

```mermaid
flowchart TD
    A["Table QR Scan"] --> B["Mandatory Guest Modal: Name + Phone"]
    B --> C["DPDP Act Checkbox (Unchecked by Default)"]
    C -->|User Checks & Confirms| D["Menu View & Add to Cart"]
    D --> E["Order Submitted"]
    E --> F["Phone Deduplication (visitCount + 1, table captured)"]
    E --> G["CustomerConsent Logged (IP, UA, Timestamp, v1.0-2026)"]
    E --> H["KOT Generated & Sent to Kitchen Display"]
    H --> I["Waiters & Kitchen Staff Blocked from CRM (403)"]
    H --> J["Owner/Manager CRM Tab (/crm)"]
    J --> K["Eye Button (👁️): Full Order & Bill History Modal"]
    J --> L["Hash Button (#): DPDP Statutory Audit Trail Modal"]
    E --> M["3-Hour TTL Timer Active"]
    M -->|After 3 Hours| N["Status Query Conceals Orders (DPDP Privacy Shield)"]
```

---

## 4. Verification & Monorepo Test Results

- **TypeScript Typecheck:** 0 errors across `@futora/types`, `@futora/backend`, and `web`.
- **Web Test Suite:** **59 / 59 passed (100% green)**.
- **Backend Test Suite:** **50 test suites passed, 409 / 409 tests passed (100% green)**.
- **Security Assessment:** All 18 identified vulnerability vectors verified resolved with automated regression test cases.
