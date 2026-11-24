# Kivoko HORECA SaaS — Security Audit & Penetration Testing Report

**Date:** November 24, 2026  
**Auditor / Roles Simulated:** QA Lead · Senior Systems Architect · Offensive Security & Penetration Reviewer  
**Target Architecture:** Multi-tenant Restaurant Management System (Backend NestJS + Prisma ORM + Frontend Next.js App Router)  
**Branch:** `feature/final-build-v1`  
**Commits:** `fa1f7b9`, `534ef4c`, `1318b63`  

---

## 1. Executive Summary

A comprehensive multi-angle audit was conducted covering:
1. **Human QA End-to-End Walkthrough:** Table QR scanning, guest data capture, DPDP Act 2023 consent, KOT transmission, bill splitting, settlement, and CRM lifetime history aggregation.
2. **Offensive Security & Hacker Penetration Testing:** Privilege escalation, session token tampering, QR token spoofing, cross-tenant IDOR, 3-hour TTL privacy bypass, abuse/spam injection, and rate limit exhaustion.
3. **Defensive Hardening (Senior Developer):** Remediation of all identified security oversights with zero regressions across the monorepo.

---

## 2. Attack Vectors Evaluated & Penetration Results

| # | Attack Vector Tested | Methodology / Hacker Vector | Pre-Audit Vulnerability | Post-Hardening State & Fix |
|---|---|---|---|---|
| **1** | **Abusive Guest Bypassing Ban** | An abusive customer banned via `GuestBlock` attempts to place orders via Table QR. | `public-menu.service.ts` did not check `GuestBlock`. Banned users could still order. | **FIXED:** SHA-256 phone hash is computed and queried against active `GuestBlock`. Rejects with `403 Forbidden`. |
| **2** | **Emergency Pause & Basket Overflow** | Attacker floods cart with 10,000 items or sends orders while kitchen is paused. | `QrSettings` (`orderingPaused`, `maxItemsPerOrder`, `maxQtyPerLine`) was never checked. | **FIXED:** Verified `QrSettings`. Rejects paused orders and enforces basket size limits with `400 Bad Request`. |
| **3** | **DoS / Status Endpoint Scraping** | Script spams `/public/menu/:qrToken/status` 1,000 req/sec to flood DB connections. | `/status` had no rate limiting. | **FIXED:** Enforced `@Throttle({ default: { limit: 30, ttl: 60_000 } })`. |
| **4** | **Skipping Kitchen Acceptance Gate** | Attacker sends order directly bypassing manager approval. | `createOrder` called without `requireAcceptance: true`, defaulting to `NOT_REQUIRED`. | **FIXED:** Set `requireAcceptance: true` to honor `branch.autoConfirmOrders`. |
| **5** | **Cross-Tenant IDOR on CRM** | Token from Restaurant B attempts to query `/customers/:id/history` of Restaurant A. | Route checked `branchAccess`, but consent audit had no `restaurantId` filter. | **FIXED:** Added explicit `restaurantId` filter to `getConsentAudit` query. |
| **6** | **Session Hijacking / Snooping** | Guest sitting at Table 4 at 5:00 PM scans QR to inspect 1:00 PM guest's bill. | Stale orders on table were previously visible indefinitely. | **FIXED:** Strict 3-Hour TTL filter (`createdAt: { gte: threeHoursAgo }`). Replaces old order with Privacy Shield notice. |
| **7** | **JWT / Permission Tampering** | Attacker edits JWT claims from `WAITER` to `OWNER` or injects `customers.manage`. | JWT signature verification fails on modified token (`401`). | **PASSED:** `jwt.strategy.ts` validates HMAC signature and re-queries live DB permissions on every request. |
| **8** | **Negative / Price Tampering** | Attacker passes negative prices (`price: -500`) in order body. | Client-supplied prices ignored; prices calculated server-side. | **PASSED:** Only `menuItemId` and `quantity` accepted. Server prices are computed from database truth. |

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
- **Backend Test Suite:** **49 test suites passed, 399 / 399 tests passed (100% green)**.
  - Unit tests added for phone deduplication, guest blocking, QR pause, modifier limits, and consent audit scoped queries.
