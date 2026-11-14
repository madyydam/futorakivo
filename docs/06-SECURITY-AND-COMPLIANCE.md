# Volume 06: Security, RBAC & India GST Compliance Guide

> **KIVO — Software for Restaurant Management Simplified**  
> Document Type: Security, Role-Based Access Control & Regulatory Compliance Guide  
> Companion PRD: [`01-PRD-PRODUCT-REQUIREMENTS.md`](./01-PRD-PRODUCT-REQUIREMENTS.md)  
> Version: 1.0.0  
> Status: Approved / Security & Regulatory Compliance  

---

## 1. Role-Based Access Control (RBAC) Matrix

KIVO strictly prohibits hardcoded role string comparisons (e.g., `if (user.role === 'admin')`). Instead, **every action is gated by an individually toggleable permission**:

### 1.1 The 25+ Granular Permission Capabilities

| Domain | Permission Identifier | Typical Roles Granted |
| :--- | :--- | :--- |
| **Orders & POS** | `orders:create` | Cashier, Captain, Store Manager |
| | `orders:modify_price` | Store Manager only |
| | `orders:apply_discount` | Cashier (up to 10%), Manager (up to 100%) |
| | `orders:cancel_item` | Head Chef, Store Manager |
| | `orders:cancel_order` | Store Manager only |
| | `orders:process_refund` | Store Manager, Accountant |
| | `orders:reprint_bill` | Cashier, Captain, Manager |
| **Kitchen & KDS** | `kds:view_station` | Kitchen Cook, Head Chef, Expediter |
| | `kds:bump_ticket` | Kitchen Cook, Head Chef |
| | `kds:toggle_86_item` | Head Chef, Store Manager |
| **Table Management** | `tables:seat_guest` | Captain, Hostess, Manager |
| | `tables:transfer_table` | Captain, Manager |
| | `tables:edit_floor_plan` | Store Manager, Owner |
| **Inventory & Stock** | `inventory:view_levels` | Chef, Storekeeper, Manager |
| | `inventory:log_waste` | Head Chef, Storekeeper, Manager |
| | `inventory:create_po` | Storekeeper, Store Manager |
| | `inventory:approve_grn` | Store Manager only |
| | `inventory:transfer_stock`| Storekeeper, Manager |
| **Finance & Reports** | `reports:view_daily_sales`| Store Manager, Accountant, Owner |
| | `reports:view_pnl` | Owner, Executive General Manager |
| | `reports:export_tax_gst` | Accountant, Store Manager |
| **System Admin** | `settings:manage_staff` | Owner, General Manager |
| | `settings:manage_printers`| Store Manager, Technical Lead |
| | `settings:api_keys` | Technical Lead, Owner |

---

## 2. Multi-Tenant Data Isolation & Encryption

### 2.1 Database Tenant Isolation
- **Row-Level Security**: Every table (`orders`, `menu_items`, `customers`, `inventory_items`) contains an immutable foreign key `restaurant_id`.
- **Database Middleware**: All Prisma ORM queries automatically inject tenant scoping at the database driver level:
  ```typescript
  prisma.$use(async (params, next) => {
    if (params.model && !['SuperAdmin', 'Tenant'].includes(params.model)) {
      params.args.where = {
        ...params.args.where,
        restaurantId: currentTenantContext.getRestaurantId(),
      };
    }
    return next(params);
  });
  ```

### 2.2 Shared Terminal Fast PIN Switching
In fast-paced restaurant environments, multiple waiters and cashiers share the same physical POS terminal:
- **Master Device Session**: Terminal authenticates once via secure `httpOnly` JWT session cookie.
- **Operator PIN Gate**: For sensitive actions (applying discounts, processing refunds, voiding KOTs), the terminal requires a 4-digit numeric PIN.
- **Audit Attribution**: Every transaction records both the `terminalId` and the specific `operatorUserId` who keyed in the PIN.

---

## 3. Indian GST Compliance & Invoicing Standards

KIVO is fully compliant with Indian GST laws governing restaurants and food services:

### 3.1 Standard GST Rates & SAC Codes

| Service / Item Type | SAC / HSN Code | CGST Rate | SGST Rate | Total GST |
| :--- | :--- | :--- | :--- | :--- |
| **Restaurant Dining (Standalone)** | `SAC 996331` | 2.5% | 2.5% | **5.0%** (Without ITC) |
| **Restaurant in Hotel Room (Tariff > ₹7,500)** | `SAC 996332` | 9.0% | 9.0% | **18.0%** (With ITC) |
| **Packaged Bottled Beverages (MRP Items)** | `HSN 2201 / 2202` | 9.0% | 9.0% | **18.0%** + Cess |
| **Interstate Catering / Supplies** | `SAC 996331` | — | — | **5.0% IGST** |

### 3.2 Tax Calculation Engine
KIVO supports both tax-inclusive and tax-exclusive pricing models:

#### Tax-Inclusive Backward Calculation Formula:
$$\text{Pre-Tax Amount} = \frac{\text{MRP}}{1 + \text{Tax Rate}}$$
$$\text{GST Amount} = \text{MRP} - \text{Pre-Tax Amount}$$

*Example: Dish priced at ₹500 inclusive of 5% GST:*
$$\text{Pre-Tax Amount} = \frac{500}{1 + 0.05} = ₹476.19$$
$$\text{CGST (2.5\%)} = ₹11.905 \approx ₹11.91$$
$$\text{SGST (2.5\%)} = ₹11.905 \approx ₹11.91$$

### 3.3 Receipt Compliance Checklist
Every printed thermal receipt includes:
1. Restaurant Legal Name & Trade Name.
2. Branch Address, Contact Email & Phone Number.
3. 15-digit GSTIN (Goods and Services Tax Identification Number).
4. FSSAI License Number (14 digits) displayed clearly below the header.
5. Sequential Invoice Number (unique per financial year).
6. Split itemization of CGST, SGST, or IGST amounts.

---

## 4. Digital Personal Data Protection (DPDP) Act 2023

Under India's DPDP Act 2023, restaurants collecting guest phone numbers and delivery addresses are legally classified as **Data Fiduciaries**:

1. **Explicit Customer Consent**: Phone number capture at counter checkout includes an opt-in toggle for promotional SMS/WhatsApp marketing.
2. **Right to Erasure**: Customers can request removal of their profile and dining history via `/customers/[id]` with one-click anonymization.
3. **Restricted Staff Access**: Customer phone numbers and addresses require the specialized permission scope `orders:read_customer`.

---

## 5. Anti-Fraud Audit Trails & Veri*factu Chaining

To prevent restaurant cash shrinkage and invoice tampering:

### 5.1 Immutable Audit Log
Every critical action is logged into an immutable append-only table (`audit_logs`):
- `TIMESTAMP`: Monotonic UTC ISO string.
- `USER_ID`: Staff ID who authorized the action.
- `EVENT_TYPE`: `BILL_VOIDED`, `ITEM_CANCELLED`, `DISCOUNT_OVERRIDE`, `DRAWER_OPEN`.
- `METADATA`: Before/after snapshots and reason code.

### 5.2 Cryptographic Invoice Chaining (Veri*factu Standard)
Following international anti-tampering standards:
$$\text{Invoice Hash}_N = \text{SHA-256}(\text{Invoice Hash}_{N-1} + \text{Invoice Number} + \text{Date} + \text{Total Amount})$$
Deleting or modifying an existing invoice breaks the cryptographic hash chain, immediately exposing tampering during audits.

---

## 6. Accessibility & Keyboard Navigation (WCAG 2.1 AA)

- **Keyboard First**: Every POS terminal function can be operated via keyboard hotkeys (`F1`: Search, `F2`: Discount, `F4`: Cash Pay, `F8`: Split Bill, `Esc`: Cancel).
- **Reduced Motion**: All animations automatically swap to zero-transform fades when `prefers-reduced-motion: reduce` is detected.
- **High Contrast**: High-contrast dark mode optimized for dim restaurant and bar lighting environments.
