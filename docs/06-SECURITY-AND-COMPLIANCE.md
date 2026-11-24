# Volume 06: Security, 38-Key RBAC & Access Control Guide

> **KIVOKO RESTAURANT OS — Enterprise Cloud & Offline-First POS System**  
> Document Type: Security, Role-Based Access Control, Device Pairing & Fraud Prevention Guide  
> Companion PRD: [`01-PRD-PRODUCT-REQUIREMENTS.md`](./01-PRD-PRODUCT-REQUIREMENTS.md)  
> Version: 1.0.0  
> Status: Approved / Production Security Standard  

---

## 1. Role-Based Access Control (RBAC) Architecture

KIVOKO strictly prohibits hardcoded role string comparisons (e.g., `if (user.role === 'admin')`). Instead, **every action is gated by an individually toggleable permission key**:

- The canonical catalog consists of **38 specific permission keys** grouped across 10 functional domains.
- Roles are collections of these keys, but user-level overrides (`UserPermissionOverride`) can explicitly `GRANT` or `DENY` any permission.
- Back-compatibility is guaranteed by `PERMISSION_IMPLIES`, allowing canonical keys to satisfy legacy route requirements seamlessly.

### 1.1 The Canonical 38 Granular Permission Capabilities

| Category | Permission Key | Human-Readable Label | Default Role Assignment |
| :--- | :--- | :--- | :--- |
| **Tables** | `table.view` | View Floors & Tables | Waiter, Cashier, Captain, Manager, Admin, Owner |
| | `table.transfer_merge` | Transfer & Merge Tables | Captain, Manager, Admin, Owner |
| | `table.assign` | Assign Tables to Staff | Captain, Manager, Admin, Owner |
| **Orders** | `order.create` | Create Orders & Add Items | Waiter, Cashier, Captain, Manager, Admin, Owner |
| | `order.send_kot` | Send KOT to Kitchen | Waiter, Cashier, Captain, Manager, Admin, Owner |
| | `order.modify` | Modify Own Orders / Assigned Tables | Waiter, Cashier, Captain, Manager, Admin, Owner |
| | `order.modify_any` | Modify Any Order across Restaurant | Captain, Manager, Admin, Owner |
| | `order.modify_after_kot`| Modify Order After KOT Sent | Manager, Admin, Owner (Requires Approval if Waiter) |
| | `order.cancel_item` | Cancel Item on Order | Manager, Admin, Owner (Requires Approval if Waiter) |
| **Billing** | `bill.generate_settle` | Generate & Settle Bills | Cashier, Manager, Admin, Owner |
| | `bill.reprint` | Reprint Bills | Cashier, Manager, Admin, Owner |
| | `bill.cancel_settled` | Void Settled Bill | Manager, Admin, Owner (Strict Approval Required) |
| | `bill.move_item` | Move Items Between Split Bills | Cashier, Captain, Manager, Admin, Owner |
| | `discount.apply_small` | Apply Small Discount ($\le 5\%$) | Cashier, Captain, Manager, Admin, Owner |
| | `discount.apply_any` | Apply Any Discount ($> 5\%$) | Manager, Admin, Owner (Approval Required for Cashier) |
| | `refund.process` | Process Refunds | Manager, Admin, Owner (Claws back loyalty points) |
| **Kitchen** | `kitchen.view_kot` | View & Update Kitchen Status | Kitchen Cook, Chef, Bartender, Manager, Owner |
| | `kot.reprint` | Reprint KOT Tickets | Chef, Expediter, Manager, Owner |
| **Menu** | `menu.view` | View Menu (Read-only) | All Staff Roles |
| | `menu.edit` | Edit Menu & Prices | Store Manager, Admin, Owner |
| | `item.mark_out_of_stock`| Mark Items Out of Stock (86) | Chef, Kitchen Staff, Manager, Owner |
| **Payments** | `payment.collect` | Collect Cash / UPI at Table | Waiter, Captain, Cashier, Manager, Owner |
| | `payment.verify` | Verify Received Payments | Cashier, Manager, Admin, Owner |
| | `payment.void` | Void Verified Payment | Manager, Admin, Owner (Requires PIN Approval) |
| **QR Orders** | `qrorder.view` | View Incoming QR Orders Queue | Cashier, Captain, Manager, Owner |
| | `qrorder.manage` | Accept, Reject & Edit QR Orders | Captain, Cashier, Manager, Owner |
| | `qr.pause_ordering` | Emergency Pause QR Ordering | Manager, Admin, Owner |
| | `qr.generate` | Generate & Rotate QR Codes | Manager, Admin, Owner |
| | `qrsettings.manage` | Manage QR Menu Settings | Manager, Admin, Owner |
| | `qrsettings.payment` | Update Payment QR & UPI ID | Owner PIN Only |
| | `guest.block` | Block Abusive Guest / Phone | Manager, Admin, Owner |
| **Devices** | `device.manage` | Pair, Approve & Revoke Devices | Store Manager, Admin, Owner |
| | `device.unlock` | Unlock Locked Device Early | Store Manager, Admin, Owner |
| **Admin** | `staff.manage` | Manage Staff, Roles & PINs | Admin, Owner |
| | `settings.tax` | Manage Taxes & Outlet Settings | Admin, Owner |
| | `data.bulk_delete` | Bulk Delete & Reset Data | Owner Only |
| **Reports** | `reports.view_basic` | View Basic Sales Reports | Cashier, Accountant, Manager, Owner |
| | `reports.view_all` | View All Reports & Financials | Accountant, General Manager, Owner |

---

## 2. Privilege Escalation Prevention Guard

To prevent rogue managers or sub-admins from elevating their privileges:
1. **Scope Boundary**: An actor can only grant permissions that they themselves hold directly. Attempting to assign higher permissions results in `403 Forbidden` (`INSUFFICIENT_PRIVILEGE_TO_GRANT`).
2. **Owner Immunity**: Only the root `OWNER` can alter system-wide tax configurations, reset transaction databases, or change UPI payout credentials.
3. **Immutable Audit Trail**: All role modifications, permission overrides, and PIN changes log the actor's ID, timestamp, target ID, and before/after permission arrays in `AuditLog`.

---

## 3. Dual-Token Authentication & Fast PIN Switching

Restaurant terminals must balance multi-user staff velocity with ironclad security:

```
┌────────────────────────────────────────────────────────┐
│               DUAL-TOKEN ARCHITECTURE                  │
├───────────────────────────┬────────────────────────────┤
│ Device Session Token      │ Staff Access Token         │
│ (dev_sess_...)            │ (staff_...)                │
├───────────────────────────┼────────────────────────────┤
│ • Bound to physical tablet│ • 6-digit bcrypt PIN login │
│ • 30-day lifetime         │ • 8-hour shift lifetime    │
│ • Validates hardware / IP │ • Carries staff permissions│
└───────────────────────────┴────────────────────────────┘
```

### 3.1 Device Registration & Pairing Flow
1. An admin generates an alphanumeric 6-digit pairing code in the Dashboard (`/v1/devices/codes`).
2. The newly unboxed terminal inputs the code at `/pair`.
3. The backend executes an **atomic single-use update**:
   ```typescript
   const updated = await prisma.devicePairingCode.updateMany({
     where: { id: codeRecord.id, usedAt: null },
     data: { usedAt: new Date() },
   });
   if (updated.count === 0) throw new ConflictException("Code already claimed");
   ```
4. A dedicated rate limiter (`@Throttle({ default: { limit: 10, ttl: 60_000 } })`) blocks brute-force enumeration attacks.

### 3.2 Fast 6-Digit PIN Switching
- Waitstaff and cashiers log in with their assigned 6-digit numeric PIN.
- PINs are hashed using **bcrypt with 10 salt rounds** and verified using constant-time string comparisons.
- If a staff member enters an invalid PIN 5 consecutive times, the account is temporarily locked for 15 minutes.

---

## 4. In-Place Manager Approval Flow (🔐)

Sensitive restaurant actions (voiding settled bills, applying >5% discounts, cancelling items after KOT dispatch) must not require the manager to log out the cashier:

1. **Trigger**: Cashier attempts a restricted action (e.g. 15% promotional discount).
2. **Action Lock**: Frontend displays an in-place modal with a persistent red security banner (`Approval Required`).
3. **Request Creation**: Terminal posts `{ action: 'DISCOUNT_APPLY', details: {...} }` to `/v1/approvals/request`.
4. **On-Screen Verification**: The Floor Manager enters their 6-digit PIN directly into the modal.
5. **Validation**: The backend verifies the manager holds the prerequisite permission (`discount.apply_any`), issues a single-use approval token, and logs the authorization to `AuditLog`.

---

## 5. Indian GST Compliance & Invoicing Standards

KIVOKO is fully compliant with Indian GST laws governing restaurants and food services:

### 5.1 Standard GST Rates & SAC Codes

| Service / Item Type | SAC / HSN Code | CGST Rate | SGST Rate | Total GST |
| :--- | :--- | :--- | :--- | :--- |
| **Restaurant Dining (Standalone)** | `SAC 996331` | 2.5% | 2.5% | **5.0%** (Without ITC) |
| **Restaurant in Hotel Room (Tariff > ₹7,500)** | `SAC 996332` | 9.0% | 9.0% | **18.0%** (With ITC) |
| **Packaged Bottled Beverages (MRP Items)** | `HSN 2201 / 2202` | 9.0% | 9.0% | **18.0%** + Cess |
| **Interstate Catering / Supplies** | `SAC 996331` | — | — | **5.0% IGST** |

### 5.2 Tax Calculation Formulas

#### Tax-Inclusive Reverse Calculation:
$$\text{Taxable Base} = \frac{\text{Gross Price}}{1 + \text{Tax Rate}}$$
$$\text{CGST} = \text{Taxable Base} \times \frac{\text{CGST Rate}}{100}$$
$$\text{SGST} = \text{Taxable Base} \times \frac{\text{SGST Rate}}{100}$$

#### Tax-Exclusive Forward Calculation:
$$\text{CGST} = \text{Net Price} \times \frac{\text{CGST Rate}}{100}$$
$$\text{SGST} = \text{Net Price} \times \frac{\text{SGST Rate}}{100}$$
$$\text{Final Total} = \text{Net Price} + \text{CGST} + \text{SGST}$$

---

## 6. Anti-Fraud Audit Trails & Veri*factu Chaining

1. **Immutable Audit Log**: Every sensitive action (`BILL_VOIDED`, `ITEM_CANCELLED`, `DISCOUNT_OVERRIDE`, `DRAWER_OPEN`) records monotonic UTC timestamps, actor ID, and full before/after snapshots.
2. **Loyalty Refund Reversal**: When refunds are processed, any loyalty points accrued on the original transaction are proportionally subtracted and logged as a `REFUND_REVERSAL` in `PointsLedger`.
3. **Spain Veri*factu Standards**: Invoices are cryptographically chained using SHA-256 hashes ($Hash_N = \text{SHA-256}(Hash_{N-1} + InvNum + Date + Total)$), preventing retrospective deletion or tax manipulation.
