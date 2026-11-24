# Comprehensive Indian Legal, Regulatory, Tax & DPDP Act 2023 Compliance Manual
## For HORECA Management, POS, Kiosk & Table QR Self-Ordering SaaS Platforms (KIVOKO)

**Document Version:** 1.0 (Enterprise Statutory Baseline)  
**Effective Year:** 2026  
**Jurisdiction:** Republic of India  
**Target Entities:** Restaurants, Cafes, Quick Service Restaurants (QSRs), Cloud Kitchens, Bars, Food Courts, and the KIVOKO Multi-Tenant Restaurant SaaS Platform.

---

## 1. Executive Summary & Purpose

Operating a restaurant, food & beverage (HORECA) business, or deploying a cloud-native restaurant management & Point of Sale (POS) system in the Republic of India requires strict, multi-layered adherence to Indian federal and state statutes. 

Failure to comply exposes both the restaurant business owner and the software platform provider to severe statutory consequences, including **fines up to ₹250 Crores under the DPDP Act 2023**, immediate cancellation of FSSAI operating licenses, prosecution under the Consumer Protection Act, and tax penalties under the Central Goods and Services Tax (CGST) Act.

This document serves as the authoritative, definitive statutory reference guide and technical design specification for KIVOKO. It details every law, mandatory software behavior, database schema requirement, UI consent pattern, and fiscal rule mandated for operation in India.

---

## 2. Digital Personal Data Protection Act, 2023 (DPDP Act 2023)

The Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023), enacted by the Parliament of India and administered by the Ministry of Electronics and Information Technology (MeitY), governs the processing of digital personal data.

### 2.1 Statutory Roles & Definitions
* **Data Principal (Section 2(t)):** The individual/customer dining at the restaurant who provides their Name, Mobile Phone Number, or orders via the Table QR.
* **Data Fiduciary (Section 2(i)):** The Restaurant Entity/Merchant that determines the purpose and means of collecting customer data for order fulfillment, billing, and loyalty.
* **Data Processor (Section 2(k)):** **KIVOKO (Futora)**, the multi-tenant SaaS application that processes, hashes, stores, and serves personal data strictly on behalf of the Data Fiduciary.

---

### 2.2 Section 6: Notice & Explicit, Unbundled Consent (Non-Negotiable)
Under Section 6(1) of the DPDP Act 2023, consent must be **free, specific, informed, unconditional, and unambiguous with clear affirmative action**.

```
[❌ PROHIBITED UNDER INDIAN LAW]
[X] Pre-checked: "I agree to receive promotional messages and agree to terms."
(Pre-checked boxes or bundled forced consent are expressly illegal under DPDP Act 2023)

[✅ COMPLIANT KIVOKO IMPLEMENTATION]
[ ] I agree to the Restaurant's Terms & Conditions and Privacy Policy for order processing and digital receipts.
(Must be UNCHECKED by default. Guest must explicitly tap/check the box).
```

#### Mandatory Rules for Table QR Self-Ordering:
1. **Notice Before Consent (Section 5(1)):** Before or at the time of collecting personal data, a clear notice in plain English (and scheduled 8th Schedule languages) must be accessible via a prominent link (`Terms & Privacy`).
2. **Specific Purpose:** The notice must specify that the Name and Mobile Number are collected solely for:
   * Generating the food bill and kitchen ticket (KOT).
   * Sending the digital GST invoice / receipt (via WhatsApp / SMS).
   * Maintaining restaurant visit records and loyalty rewards.
3. **Unbundled Consent:** Transactional consent (order processing) cannot be bundled with marketing opt-ins. If the restaurant wishes to send promotional discount offers, a separate secondary opt-in must be provided.
4. **No Service Denial for Legitimate Rights:** A guest cannot be denied food service if they decline promotional marketing messages.

---

### 2.3 Section 8: Obligations of Data Fiduciary & Retention Limits
1. **Purpose Limitation:** Customer data collected on Table 4 cannot be shared, sold, or aggregated for third-party ad networks.
2. **Data Retention & Eradication (Section 8(7)):** The Data Fiduciary must erase personal data upon the customer withdrawing consent or as soon as it is reasonable to assume that the specified purpose is no longer being served.
3. **Data Security Safeguards (Section 8(5)):** The Data Processor (KIVOKO) must implement reasonable security safeguards to prevent personal data breach (encryption in transit via TLS 1.3, salted hashing for credentials, tenant isolation).

---

### 2.4 Sections 11–14: Rights of the Data Principal
1. **Right to Access Information (Section 11):** Customers have the right to obtain a summary of their personal data and order history held by the restaurant.
2. **Right to Correction and Erasure ("Right to be Forgotten") (Section 12):** Customers can request correction of inaccurate phone numbers or complete erasure of their profile.
   * *Technical Rule in POS:* The customer's contact record in `Customer` table is wiped/anonymized, but past settled tax invoices (`Order` / `Bill` / `PaymentRecord`) retain their required financial snapshots for mandatory 6-year GST audit retention.
3. **Right of Grievance Redressal (Section 13):** Every restaurant and KIVOKO must publish contact details of a Data Protection / Grievance Officer on their public portal.

---

### 2.5 Section 33 & Schedule: Statutory Penalties for Non-Compliance
The DPDP Act establishes the Data Protection Board of India with draconian monetary penalties:

| Section & Violation Type | Maximum Statutory Penalty |
| :--- | :--- |
| **Section 8(5) / Schedule Item 1:** Failure to take reasonable security safeguards to prevent personal data breach | **Up to ₹250 Crores** |
| **Section 8(6) / Schedule Item 2:** Failure to notify the Data Protection Board and affected Data Principals of a data breach | **Up to ₹200 Crores** |
| **Section 9 / Schedule Item 3:** Non-compliance with additional obligations regarding children's data | **Up to ₹200 Crores** |
| **Schedule Item 4:** Failure to fulfill general obligations of Data Fiduciary (Consent, Notice, Erasure) | **Up to ₹50 Crores** |

---

### 2.6 Technical POS Implementation Blueprint for DPDP Act
1. **Customer Consent Audit Table (`customer_consents`):**
   * `customerId`: UUID linking to `Customer`
   * `restaurantId`: Multi-tenant restaurant ID
   * `consentedAt`: Precise UTC timestamp of affirmative tick
   * `consentIp`: Client IP address
   * `userAgent`: Mobile browser user agent
   * `termsVersion`: Version of terms presented (e.g., `v1.0-2026`)
   * `scope`: `['BILLING', 'SERVICE', 'LOYALTY']`
2. **3-Hour Customer Screen Auto-Expiry (Privacy Shield):**
   * Live order status on mobile web `/m/:qrToken/status` must automatically terminate 3 hours after order creation.
   * Prevents subsequent table occupants or nearby patrons from viewing previous guests' food choices, spend amounts, or personal notes.
3. **Consent Audit Column (`#`) in CRM:**
   * Owner and Manager dashboard displays a clickable `#` indicator.
   * Clicking surfaces modal with immutable proof of consent timestamp, IP, and policy version.

---

## 3. Food Safety and Standards Authority of India (FSSAI) Regulations

Governed by the Food Safety and Standards Act, 2006, and rules promulgated by the Food Safety and Standards Authority of India (FSSAI).

### 3.1 Mandatory 14-Digit FSSAI License Number Display
* **Statutory Order:** FSSAI Order No. 15(31)2020/FoSCoS/RCD/FSSAI dated 8th June 2021.
* **Mandatory Requirement:**
  1. The 14-digit FSSAI License or Registration Number **must be printed on all invoices, cash memos, bills, and digital receipts** issued by the food business operator (FBO).
  2. The FSSAI License Number and Food Safety Display Board (FSDB) must be displayed at prominent locations inside the premises and on the **digital QR Menu**.
* **POS System Enforcement:**
  * KIVOKO POS must enforce an `fssaiNumber` field in Branch Settings (`^\d{14}$`).
  * Every ESC/POS thermal receipt (80mm/58mm), HTML receipt, and WhatsApp e-bill must display:
    ```
    FSSAI Lic. No.: 11526001000123
    ```

---

### 3.2 FSSAI Labelling and Display Regulations, 2020
1. **Veg / Non-Veg Declarative Icons:**
   * **Vegetarian Food:** Green filled circle inside a green square outline (mandatory on all physical and digital QR menu items).
   * **Non-Vegetarian Food:** Brown filled triangle inside a brown square outline (mandatory for any item containing animal meat, poultry, seafood, or egg).
   * **Egg-Containing Products:** Brown triangle or specific egg indicator where required.
2. **Allergen Declarations (Regulation 5(3)):**
   * Digital menus must declare the presence of the 8 major statutory allergens:
     1. Cereals containing gluten (wheat, rye, barley, oats).
     2. Crustaceans and products thereof (prawns, crab, lobster).
     3. Eggs and egg products.
     4. Fish and fish products.
     5. Peanuts, tree nuts, and products thereof.
     6. Soybeans and products thereof.
     7. Milk and milk products (including lactose).
     8. Sulphite in concentrations of 10 mg/kg or more.
3. **Calorie & Nutritional Information:**
   * Applicable to Food Service Establishments having central licenses or an outlet chain of 10 or more outlets.
   * Must display caloric value (in kcal per serving) against menu items on the digital QR menu.

---

## 4. Goods and Services Tax (GST) Act Compliance for Restaurants

Administered under the Central Goods and Services Tax Act, 2017 (CGST), State Goods and Services Tax Acts (SGST), and Integrated Goods and Services Tax Act (IGST).

### 4.1 Service Accounting Code (SAC Code)
* **SAC Code 9963:** Food and beverage service supplied by restaurants, cafes, food trucks, and canteens.

---

### 4.2 GST Tax Rates & Slabs for Restaurants

| Restaurant Category | GST Rate | Tax Split | Input Tax Credit (ITC) |
| :--- | :---: | :---: | :---: |
| **Standalone Restaurants** (Air Conditioned or Non-AC) | **5%** | **2.5% CGST + 2.5% SGST** | **NO ITC** (Input tax credit cannot be claimed on inputs/rent) |
| **Restaurants in Hotel Premises** (Where room tariff is **₹7,500 or above** per day) | **18%** | **9.0% CGST + 9.0% SGST** | **FULL ITC** Allowed |
| **Outdoor Catering Services** | **5%** | **2.5% CGST + 2.5% SGST** | **NO ITC** |
| **Composition Scheme Restaurants** (Annual turnover up to ₹1.5 Cr) | **5%** | **2.5% CGST + 2.5% SGST** | **NO ITC** (Cannot charge tax separately; bill of supply) |

---

### 4.3 Mandatory Tax Invoice Fields (Rule 46, CGST Rules 2017)
Every bill/invoice printed by KIVOKO POS or dispatched electronically must contain:
1. **Invoice Header:** `TAX INVOICE` prominently stated.
2. **Business Details:** Legal Business Name, Trade Name, Outlet Address, State, and State Code.
3. **GSTIN:** 15-character Goods and Services Tax Identification Number of the restaurant.
4. **Unique Serial Number:** Consecutive serialized invoice number containing only alphabets, numerals, and special characters (hyphen `/` or `-`), unique for each financial year.
5. **Date & Time:** Date and time of invoice generation.
6. **Recipient Details (B2B):** If customer requests a B2B tax invoice (corporate dining), customer's Registered Trade Name, Address, and GSTIN must be included.
7. **SAC Code:** `SAC: 9963` displayed.
8. **Itemized Breakdown:**
   * Taxable Value of food/beverages.
   * Rate and Amount of **CGST (2.5%)**.
   * Rate and Amount of **SGST (2.5%)**.
   * Total Invoice Value (rounded to nearest Rupee under Section 170).

---

### 4.4 Rounding of Tax (Section 170 of CGST Act)
Under Section 170, the final tax amount and total bill value shall be rounded off to the nearest rupee (part of a rupee consisting of 50 paise or more rounded up, less than 50 paise ignored). KIVOKO computes item lines in exact cents/paise and rounds final totals to the nearest integer.

---

## 5. Central Consumer Protection Authority (CCPA) Guidelines on Service Charges

Issued by the Ministry of Consumer Affairs, Food & Public Distribution under Section 18(2)(l) of the Consumer Protection Act, 2019 (Guideline Order J-24/53/2020-CPU).

### 5.1 Prohibition of Mandatory Service Charge
1. **No Automatic Addition:** No restaurant shall add service charge automatically or by default in the food bill.
2. **No Coercion:** Service charge shall not be collected under any other name (e.g. "Staff Welfare Fund", "Kitchen Service Surcharge") as a mandatory levy.
3. **Voluntary Discretion:** Tipping and service charge are **strictly voluntary, optional, and at the sole discretion of the consumer**.
4. **No Service Refusal:** No restaurant shall restrict entry or refuse services to any customer based on collection of service charge.

### 5.2 POS & Digital Billing Compliance Rules
* KIVOKO POS must **NEVER** pre-populate or force a service charge onto a guest bill by default.
* If a restaurant enables an optional staff gratuity feature, the POS and QR payment screen must:
  * Explicitly label it as: `"Service Charge / Gratuity is completely voluntary"`.
  * Provide an easy, one-tap button to remove or edit the amount to ₹0.

---

## 6. Legal Metrology (Packaged Commodities) Rules, 2011

Governed under the Legal Metrology Act, 2009.

### 6.1 Sale of Packaged Goods at MRP
1. **Maximum Retail Price (MRP):** Pre-packaged commodities (packaged mineral water bottles, soft drinks in cans/PET bottles, packaged ice creams, confectionery) cannot be sold at a price higher than the printed MRP.
2. **Dual MRP Prohibition:** Under Rule 18(2), no retail seller shall charge a price exceeding the MRP printed on the package.
3. **Restaurant Service Exemption (Supreme Court Guidelines):**
   * If a sealed beverage bottle is handed over the counter unopened -> **Must strictly be sold at or below printed MRP**.
   * If a beverage is served in restaurant glassware with ice, sliced lemon, waiter table service, and air-conditioned ambient seating -> The establishment is providing a composite restaurant service, but transparent menu pricing is mandatory.

---

## 7. TRAI Telecom Commercial Communications Regulations (TCCCPR, 2018)

Governed by the Telecom Regulatory Authority of India (TRAI).

### 7.1 DLT (Distributed Ledger Technology) Registration for SMS & WhatsApp
Any SMS or WhatsApp communication sent to customers via KIVOKO (e.g. OTP, order confirmations, bill PDF links) must strictly comply with DLT regulations:
1. **Entity Registration:** The business must register as a Principal Entity (PE) on Telecom DLT portals (Vilpower, Jio DLT, Airtel DLT).
2. **Sender ID / Header:** 6-character registered alphabetic header (e.g. `KIVOKO`, `FUTORA`).
3. **Template Registration:** Every message text must have an approved Content Template with dynamic variables:
   ```
   "Dear {#var#}, thank you for dining at {#var#}. Your bill amount is Rs. {#var#}. View invoice: {#var#} - KIVOKO"
   ```
4. **Service vs Promotional Segregation:**
   * **Service Implicit (Transactional):** Bill invoices, OTPs, booking confirmations (deliverable to DND numbers 24x7).
   * **Promotional:** Offers, discounts, festive menus (strictly sent between 10:00 AM to 08:00 PM; must respect National Customer Preference Register / DND).

---

## 8. Summary of Mandatory POS Capabilities Checklist for India

| Statutory Requirement | Governing Authority | KIVOKO System Implementation |
| :--- | :--- | :--- |
| **Explicit Consent Checkbox** | MeitY / DPDP Act 2023 | Un-checked mandatory checkbox on QR screen with link to T&C |
| **Consent Audit Logging** | MeitY / DPDP Act 2023 | `#` Audit popup recording IP, Timestamp, and Terms Version |
| **3-Hour Customer Screen TTL** | MeitY / DPDP Act 2023 | Mobile live order tracking expires automatically after 3 hours |
| **Customer Right to Erasure** | MeitY / DPDP Act 2023 | Owner/Manager CRM "Anonymize/Delete Profile" action |
| **14-Digit FSSAI License Number** | FSSAI / FoSCoS | Printed on thermal bills, WhatsApp receipts, and QR header |
| **Veg / Non-Veg Markers** | FSSAI Labelling 2020 | Green square/circle and Brown triangle/square icons on all menus |
| **SAC Code 9963** | CBIC / CGST Act 2017 | Embedded on all generated tax bills and fiscal summaries |
| **5% GST (2.5% CGST + 2.5% SGST)** | CBIC / CGST Act 2017 | Dual tax rate breakdown calculated without ITC |
| **Consecutive Fiscal Invoice No.** | Rule 46 CGST Rules | Monotonically increasing unique annual invoice numbers |
| **Voluntary Service Charge Notice** | CCPA / Consumer Affairs | Explicit opt-in disclaimer; zero forced service fee |
| **DLT Compliant SMS / WhatsApp** | TRAI / TCCCPR 2018 | Approved sender ID and transactional template routing |

---

## 9. Conclusion

Compliance in India is not a one-time configuration but a real-time operational standard. By enforcing these rules at the schema, API, UI, and ledger levels, KIVOKO protects restaurant owners from severe penalties while delivering a trustworthy, legally compliant dining experience to guests across India.
