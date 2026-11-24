# Volume 05: Inventory, Recipe Costing & Supply Chain Guide

> **KIVOKO RESTAURANT OS — Enterprise Cloud & Offline-First POS System**  
> Document Type: Inventory, Recipe Costing & Commissary Supply Chain Guide  
> Companion PRD: [`01-PRD-PRODUCT-REQUIREMENTS.md`](./01-PRD-PRODUCT-REQUIREMENTS.md)  
> Version: 1.0.0  
> Status: Approved / Operations & Finance  

---

## 1. Raw Materials & Master Catalog Setup

KIVO's inventory architecture enforces strict unit consistency to prevent calculation drift:

### 1.1 Supported Units of Measure (UOM)
- **Mass**: Kilograms (`kg`), Grams (`g`), Milligrams (`mg`).
- **Volume**: Liters (`L`), Milliliters (`ml`).
- **Count / Units**: Pieces (`pcs`), Portions (`ptn`), Packets (`pkt`), Cans (`can`), Bottles (`btl`).

### 1.2 Conversion Matrix
KIVO maintains an automated conversion matrix:
$$1\text{ kg} = 1,000\text{ g}$$
$$1\text{ L} = 1,000\text{ ml}$$
For custom items (e.g., 1 Box of Cheese = 12 Packets = 2.4 kg), conversion ratios are defined directly in the master item card.

---

## 2. Recipe Bill of Materials (BOM) & Real-Time Deductions

Unlike retail inventory that tracks sold units directly, restaurant food costing requires recipe decomposition:

```
[Customer Orders: Paneer Tikka Masala]
                     │
                     ▼
          [Recipe BOM Execution]
                     │
         ├── 180g Fresh Paneer
         ├── 120ml Makhani Gravy (Sub-Recipe)
         │       └── 80g Tomatoes
         │       └── 20g Cashew Paste
         │       └── 15g Butter
         ├── 10g Kasuri Methi
         └── 15ml Fresh Cream
                     │
                     ▼
  [Atomic Real-Time Deduction from Store Stock]
```

### 2.1 Sub-Recipes (Base Preparations)
Restaurants frequently prepare large batches of base stocks, gravies, and pizza dough:
1. **Batch Preparation**: Chef logs preparation of 20 Liters of *Yellow Curry Base*.
2. **Component Deduction**: Cashews, onions, tomatoes, and spices are depleted from raw stores.
3. **Yield Registration**: 20 Liters of *Yellow Curry Base* are credited to the kitchen prep station stock.
4. **Dish-Level Depletion**: Each curry sold subsequently depletes 150ml of the base gravy.

### 2.2 Theoretical vs. Actual Food Cost Variance
KIVO calculates food cost variances in real time:
$$\text{Variance \%} = \frac{\text{Actual Usage} - \text{Theoretical Recipe Usage}}{\text{Theoretical Recipe Usage}} \times 100$$
A variance $>5\%$ automatically flags an alert on the store manager's dashboard indicating potential kitchen over-portioning or pilferage.

---

## 3. FIFO Waste Logging & Expiry Control (`/inventory/waste`)

### 3.1 Waste Logging Workflow
When kitchen staff drop, burn, or discard spoiled ingredients:
1. Open `/inventory/waste` $\rightarrow$ Click **+ Log Waste**.
2. Select ingredient or prepared dish.
3. Choose reason code:
   - `BURNT / PREP ERROR`: Kitchen training metric.
   - `EXPIRED / SPOILED`: Supplier quality or over-ordering issue.
   - `DAMAGED / DROPPED`: Accidental loss.
   - `STAFF MEAL / COMP`: Accounting operational cost.
4. The system calculates the exact financial loss using the FIFO batch cost and debits the store balance.

---

## 4. Procurement & Goods Receipt Notes (GRN)

```
[Low Stock Threshold Reached]
               │
               ▼
   [Generate Purchase Order (PO)]
               │
               ▼
       [Supplier Delivery]
               │
               ▼
[Goods Receipt Note (GRN) Verification]
  ├── Count physical quantity
  ├── Check batch / lot number
  ├── Verify expiry date
  └── Record invoice unit price
               │
               ▼
[Stock Balance Credited + Accounts Payable Updated]
```

### 4.1 Purchase Order (PO) Management
- **Automated Reorder Suggestions**: KIVO calculates recommended reorder quantities based on average 7-day dish consumption and supplier delivery lead times.
- **Vendor Rate Cards**: Stores historical vendor rates to flag unapproved supplier price hikes.

### 4.2 GRN Variance Tracking
If a supplier delivers 45 kg of onions against a PO of 50 kg:
- Staff records 45 kg accepted; system automatically creates a 5 kg pending backorder or generates an adjustment debit note for the accounting ledger.

---

## 5. Multi-Outlet Commissary & Stock Transfers

For restaurant chains operating central kitchens (commissaries):

### 5.1 The 3-Step Transfer Protocol
1. **Indenting / Requisition**: Branch Manager submits stock request (e.g., 50 kg Marinated Chicken) to the central commissary.
2. **Dispatch & Transit**: Central store approves and dispatches items; stock enters `IN_TRANSIT` status.
3. **Branch Receiving & Acceptance**: Branch verifies received quantity, logs transit spillage/variance, and acknowledges receipt; stock transfers to branch inventory.

---

## 6. Bulk Data Migration & CSV Imports (`/inventory/import`)

To switch smoothly from legacy systems (Petpooja, Excel, POSist), KIVO supports direct CSV batch imports:

### CSV Import Template Format:
```csv
item_name,category,sku,unit,current_stock,min_stock,cost_price,supplier_name
Fresh Paneer,Dairy,RAW-PAN-01,kg,18.5,5.0,320.00,Amul Dairy
Mozzarella Cheese,Dairy,RAW-MOZ-01,kg,12.0,3.0,480.00,D'lecta
Basmati Rice,Grains,RAW-RIC-01,kg,75.0,20.0,95.00,India Gate
Woodfired Pizza Flour,Dry Store,RAW-FLU-01,kg,40.0,15.0,65.00,Sunfeast
```
- **Validation Engine**: Automatically checks for duplicate SKUs, invalid unit types, or negative stock quantities prior to database commit.
