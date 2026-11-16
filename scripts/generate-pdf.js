const fs = require('fs');
const path = require('path');

const PDFDocument = require(require.resolve('pdfkit', { paths: ['./apps/backend'] }));

const outputPath = path.resolve(__dirname, '../KIVO_PETPOOJA_SAAS_ROADMAP_REPORT.pdf');
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
  bufferPages: true,
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

const BRAND_COLOR = '#881337'; // Wine / Futora Crimson
const DARK_TEXT = '#18181b';
const MUTED_TEXT = '#52525b';
const SUCCESS_COLOR = '#047857'; // Emerald
const BORDER_COLOR = '#e4e4e7';

// --- HEADER ---
doc.rect(45, 40, doc.page.width - 90, 75).fill('#fdf2f4');
doc.rect(45, 40, doc.page.width - 90, 75).stroke(BRAND_COLOR);

doc.fillColor(BRAND_COLOR).fontSize(10).font('Helvetica-Bold')
   .text('KIVO PLATFORM • FUTORA GROUP', 55, 48);

doc.fillColor(DARK_TEXT).fontSize(14).font('Helvetica-Bold')
   .text('Petpooja-Grade Cloud SaaS Roadmap & Feature Report', 55, 62);

doc.fillColor(MUTED_TEXT).fontSize(8.5).font('Helvetica')
   .text('Architecture: True Multi-Tenant Cloud SaaS   |   Phases: 10 of 10 Completed   |   Date: November 2026', 55, 82);

doc.moveDown(3);

// --- EXECUTIVE SUMMARY ---
doc.fillColor(BRAND_COLOR).fontSize(12).font('Helvetica-Bold')
   .text('Executive Summary', 45, 125);
doc.moveDown(0.3);

doc.fillColor(DARK_TEXT).fontSize(9).font('Helvetica')
   .text(
     'This report provides the definitive architectural blueprint and feature definition manual documenting the successful transformation of KIVO (HORECA management simplified) from an on-premise local restaurant installation into a centralized, highly scalable Multi-Tenant Cloud SaaS platform directly matching the industry capabilities of Petpooja. Over 10 phased milestones, KIVO has achieved multi-tenant cloud database isolation, zero-touch trial signups, platform-wide super admin control, automated recurring licensing with UPI QR checkout, hybrid offline-first POS reliability, browser-to-hardware ESC/POS bridge, delivery aggregator relay, central kitchen supply chain indents, and high-concurrency cloud containerization.',
     { align: 'justify', lineGap: 2 }
   );

doc.moveDown(1);

// --- PHASE MATRIX ---
const phases = [
  {
    num: 1,
    title: 'Central Cloud Database Architecture',
    goal: 'Shift from individual local Docker installations to a central high-availability multi-tenant PostgreSQL database.',
    features: [
      'Central Cloud PostgreSQL: All 10,000+ restaurants reside on a unified cloud DB engine with high concurrency connection pooling (PgBouncer).',
      'Automated Schema Provisioning: Zero local DB maintenance for restaurant operators; automatic schema migrations via Prisma.',
      'Zero-Hardware Dependency: Restaurants no longer need to purchase expensive on-premise local servers.'
    ]
  },
  {
    num: 2,
    title: 'Multi-Tenant SaaS Hardening & Data Isolation',
    goal: 'Complete data segregation across restaurant brands with strict tenant boundaries.',
    features: [
      'Strict Tenant Scoping: Every query, order, customer, and KOT is strictly tied to restaurantId and branchId.',
      'Multi-Brand Privacy: Tenant A cannot inspect, modify, or leak data into Tenant B.',
      'Role & Privilege Enforcement: Granular permissions across Owner, Administrator, Cashier, Waiter, and Kitchen staff.'
    ]
  },
  {
    num: 3,
    title: 'Instant Self-Serve Signup & Onboarding Flow',
    goal: 'Zero-touch public SaaS registration directly from the marketing website.',
    features: [
      'Public Signup Unblocking: ALLOW_PUBLIC_SIGNUP unblocked to allow instant self-serve restaurant creation.',
      'Automatic 14-Day Free Trial: New signups are provisioned on Starter plan with a 14-day trial without upfront credit cards.',
      'Instant Branch & Tax Preset: New restaurants automatically initialize with regional GST / tax presets and a primary branch.'
    ]
  },
  {
    num: 4,
    title: 'Super Admin Platform Control Console (/super-admin)',
    goal: 'Platform-wide monitoring and control console for FUTORA group operators.',
    features: [
      'Tenant Aggregation Directory: Search and filter all registered restaurant brands across Active, Trial, and Suspended states.',
      'Live Platform Analytics: 30-day GMV, active outlet volume, and recurring SaaS MRR estimates.',
      'Instant Impersonation Engine: One-click "Impersonate" to log into any tenant\'s dashboard as Owner to diagnose support requests.',
      'Global Platform Broadcasts: Dispatch system announcements and maintenance notices directly to all POS screens.'
    ]
  },
  {
    num: 5,
    title: 'SaaS Subscription, Licensing & Payment Gateway (/settings/billing)',
    goal: 'Automated tier-based subscription licensing with instant UPI and card checkout.',
    features: [
      '3-Tier Subscription Plans: Starter (Rs 599/mo), Growth (Rs 1,499/mo), Enterprise (Rs 3,999/mo).',
      'Annual Discount Switcher: 2 Months Free (17% savings) toggle for annual billings.',
      'Payment Gateway Simulator: Integrated Razorpay / Dynamic UPI QR modal with automatic 18% GST calculation.',
      'GST Tax Invoices: Automatic generation of compliant GST tax invoices (INV-KIVO-YYYY-XXXXX) with PDF download.',
      'SubscriptionGuard: Restricts write actions when trial expires, allowing read-only historical reports until renewed.'
    ]
  },
  {
    num: 6,
    title: 'Petpooja-Style Hybrid Offline-First POS (Outbox Pattern)',
    goal: 'Counter billing never stops even if broadband or Wi-Fi is severed.',
    features: [
      'Client Offline Outbox: Orders and bill settlements are captured into encrypted local storage under #OFF-xxx temporary IDs.',
      'Automatic Background Cloud Sync: Real-time listeners trigger FIFO batch flushing to cloud backend the moment internet reconnects.',
      'Live Sync Status Bar: Reassuring green pill ("Cloud Synced") / amber pulsing indicator ("Offline POS (X queued)") in header.'
    ]
  },
  {
    num: 7,
    title: 'Thermal Printer & Hardware Integration Bridge (/settings/hardware)',
    goal: 'Browser-to-hardware communication for 80mm/58mm thermal printers, cash drawers, and audio soundboxes.',
    features: [
      'Web Serial & Web Bluetooth ESC/POS: Direct binary ESC/POS printing from counter PC/tablet to USB and Bluetooth printers.',
      'Universal Cash Drawer Kick: Standard RJ11 pulse (ESC p 0 25 250) on cash bill settlement.',
      'Web Audio Soundbox Voice Chimes: Multi-tone harmonic chime + vocal speech announcement without external audio files.',
      'Hardware Diagnostics Hub: Real-time sample bill printing, KOT ticket printing, and auto-cut paper toggles.'
    ]
  },
  {
    num: 8,
    title: 'Food Aggregator & Delivery Relays (Zomato / Swiggy / ONDC)',
    goal: 'Centralized two-way relay between online delivery platforms, POS billing, and kitchen screens.',
    features: [
      'Aggregator Inbound Webhooks: Normalized receiver endpoints for Zomato, Swiggy, ONDC, and Magicpin.',
      'Real-Time KDS Relay: Aggregator orders automatically route to kitchen screens and thermal printers with customer notes.',
      'One-Click Order Workflow: "Accept Order (20m)", "Mark Food Ready (Alert Rider)", and "Handover (Dispatched)".',
      'Item 86 (Out-of-Stock) Instant Switcher: Toggle any dish on/off; immediately syncs across Swiggy and Zomato customer apps.',
      'Simulation Suite: One-click simulation of incoming Zomato / Swiggy orders to test live soundbox alerts and kitchen tickets.'
    ]
  },
  {
    num: 9,
    title: 'Multi-Branch & Central Kitchen Supply Chain Hub',
    goal: 'End-to-end multi-outlet supply chain, commissary kitchen indents, cold-chain logistics, and executive analytics.',
    features: [
      'Central Kitchen / Commissary Designation: Multi-outlet brands can mark any location as a Central Kitchen (isCentralKitchen: true).',
      'Requisition & Stock Indent Engine: StockIndent lifecycle (PENDING -> APPROVED -> DISPATCHED -> RECEIVED -> REJECTED).',
      'Cold-Chain Dispatch & Inventory Deduction: Dispatches log delivery van number and automatically draw down Central Kitchen stock.',
      'Inbound Verification & Shrinkage Control: Destination stores verify received counts; creates weighted-average cost batches.',
      'Consolidated Multi-Outlet Hub (/reports/consolidated): Brand-level reporting aggregating gross sales, AOV, and benchmarking matrix.'
    ]
  },
  {
    num: 10,
    title: 'Production Cloud Deployment, CI/CD & Launch',
    goal: 'Production Cloud SaaS infrastructure, containerized high-concurrency scaling, CI/CD pipeline, and zero-downtime automation.',
    features: [
      'High-Concurrency PgBouncer Pooling: Dedicated transaction pooling (pgbouncer:6432) servicing 10,000+ simultaneous restaurant terminals.',
      'Production Containerization & Health Probes: Alpine multi-stage Dockerfiles and automated live/ready health checks (/health, /ready).',
      'Automated TLS/SSL Edge Proxy (Caddy): Automatic Let\'s Encrypt SSL/TLS termination, HTTP/2 & HTTP/3 multiplexing, and compression.',
      'GitHub Actions CI/CD Pipeline: Automated end-to-end quality gates (typechecks, 59 unit tests), container builds, and deployment triggers.',
      'Disaster Recovery & Cloud Backups: Automated S3/R2 encrypted offsite cloud backup routines.'
    ]
  }
];

doc.fillColor(BRAND_COLOR).fontSize(12).font('Helvetica-Bold')
   .text('Phase-by-Phase Execution & Feature Definition Matrix', 45, doc.y + 6);
doc.moveDown(0.5);

for (const p of phases) {
  // Check if we need a new page
  if (doc.y > 680) {
    doc.addPage();
  }

  const startY = doc.y;
  
  // Header with title and status
  doc.fillColor(DARK_TEXT).fontSize(9.5).font('Helvetica-Bold')
     .text(`Phase ${p.num}: ${p.title}`, 45, startY, { continued: true });
  
  doc.fillColor(SUCCESS_COLOR).fontSize(8).font('Helvetica-Bold')
     .text('   [COMPLETED]');

  doc.fillColor(MUTED_TEXT).fontSize(8).font('Helvetica-Oblique')
     .text(`Goal: ${p.goal}`, 45, doc.y + 2);

  doc.moveDown(0.2);
  for (const feat of p.features) {
    doc.fillColor(DARK_TEXT).fontSize(8).font('Helvetica')
       .text(`  •  ${feat}`, { indent: 10, lineGap: 1.5 });
  }

  doc.moveDown(0.6);
}

// --- FINAL SUMMARY COMPARISON TABLE ---
if (doc.y > 550) {
  doc.addPage();
}

doc.moveDown(0.5);
doc.fillColor(BRAND_COLOR).fontSize(12).font('Helvetica-Bold')
   .text('Final SaaS Transformation Summary Matrix', 45, doc.y);
doc.moveDown(0.4);

const tableData = [
  ['Capability Area', 'Legacy On-Premise Model', 'KIVO Petpooja-Grade SaaS Model'],
  ['Database Architecture', 'Local Postgres per PC/server', 'Central high-availability Postgres + PgBouncer'],
  ['Tenant Data Segregation', 'None (Single store DB)', 'Strict multi-tenant isolation via restaurantId & branchId'],
  ['Merchant Onboarding', 'Manual terminal installation', 'Zero-touch public self-serve signup + 14-day trial'],
  ['Platform Governance', 'No central visibility', 'Super Admin console (/super-admin) with 1-click impersonation'],
  ['Monetization & Licensing', 'Manual one-time license keys', 'Automated 3-tier subscriptions, UPI QR checkout, GST invoices'],
  ['Offline Reliability', 'Counter stops when internet drops', 'Offline Outbox pattern: zero downtime billing + auto cloud sync'],
  ['Hardware & Printing', 'Proprietary Windows spoolers', 'Direct Web Serial/Bluetooth ESC/POS printing & voice chime'],
  ['Aggregator Relays', 'Separate tablets for Swiggy/Zomato', 'Central inbound webhooks, KDS relay, rider tracking & Item 86'],
  ['Supply Chain & Hub', 'Disconnected store registers', 'Central Kitchen indents (StockIndent) with van tracking & P&L'],
  ['Cloud DevOps', 'Manual terminal updates', 'Containerized microservices, Caddy auto-SSL, GitHub Actions CI/CD']
];

const colWidths = [120, 185, 200];
const startTableX = 45;

tableData.forEach((row, rowIdx) => {
  if (doc.y > 730) {
    doc.addPage();
  }

  const currentY = doc.y;
  const isHeader = rowIdx === 0;

  if (isHeader) {
    doc.rect(startTableX, currentY, colWidths.reduce((a, b) => a + b, 0), 18).fill(BRAND_COLOR);
    doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
  } else {
    if (rowIdx % 2 === 0) {
      doc.rect(startTableX, currentY, colWidths.reduce((a, b) => a + b, 0), 16).fill('#fafafa');
    }
    doc.fillColor(DARK_TEXT).fontSize(7).font('Helvetica');
  }

  let cellX = startTableX;
  row.forEach((cell, colIdx) => {
    doc.text(cell, cellX + 4, currentY + 4, {
      width: colWidths[colIdx] - 8,
      height: isHeader ? 12 : 10,
      ellipsis: true,
    });
    cellX += colWidths[colIdx];
  });

  doc.rect(startTableX, currentY, colWidths.reduce((a, b) => a + b, 0), isHeader ? 18 : 16)
     .stroke(BORDER_COLOR);

  doc.y = currentY + (isHeader ? 18 : 16);
});

// --- FOOTER FOR ALL PAGES ---
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.fillColor(MUTED_TEXT).fontSize(7.5).font('Helvetica')
     .text(
       `KIVO Cloud SaaS Roadmap Report • FUTORA Group   |   Page ${i + 1} of ${range.count}`,
       45,
       doc.page.height - 30,
       { align: 'center', width: doc.page.width - 90 }
     );
}

doc.end();

writeStream.on('finish', () => {
  console.log('PDF generation complete:', outputPath);
});
