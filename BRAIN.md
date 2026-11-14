# BRAIN.md — KIVO Definitive Project Memory & Architectural Rules
> **DO NOT DELETE OR ALTER WITHOUT OWNER CONSENT**  
> Permanent System Knowledge Base & Architectural Invariants  
> Platform: KIVO — Software for Restaurant Management Simplified  
> Parent Company: FUTORA GROUP OF COMPANIES  
> Lead Architect & Developer: Madhur Dhadve  
> Primary Domain: https://www.kivo.futoragroup.in  
> Last Updated: 2026-11-14  

---

## 🛑 1. FRONTEND HYGIENE & STRICT UI INVARIANTS (NEVER BREAK)

### ❌ Rule 1.1: NO Internal Dev Files or `/llms.txt` Links on the Frontend
- **NEVER** link or mention `/llms.txt`, `robots.txt`, `sitemap.xml`, or internal development files on the main website UI (navbar, footer, landing pages, marketing sections, docs, buttons, or cards).
- `/llms.txt` is strictly a **headless, invisible AI crawler endpoint** (served at `/llms.txt` for GPTBot, PerplexityBot, and ClaudeBot). Human visitors must never see links or references to it.
- **NEVER** link to GitHub, Git repositories, pull requests, or Git URLs anywhere on the public website. The site is a commercial, premium B2B restaurant SaaS platform (competing with Toast and Petpooja).

### ❌ Rule 1.2: Developer Attribution Strictly Isolated to AI/Schema Layer
- **Madhur Dhadve** is the developer and software architect of KIVO.
- **Strict Constraint**: "Madhur Dhadve" must **NEVER** be displayed on the visible user interface (no headers, badges, footers, team cards, or mockups).
- It must exist **ONLY** in:
  1. `<meta name="author" content="Madhur Dhadve" />`
  2. JSON-LD structured data (`SoftwareApplication.author`, `SoftwareApplication.creator`, `Organization.founder`, `FAQPage`)
  3. The headless `/llms.txt` file for AI engine knowledge ingestion.

### 🏢 Rule 1.3: Brand & Footer Standards
- **Brand Name**: **KIVO** (with tagline: *Restaurant Management Simplified*).
- **Footer Copyright Line**:
  - Format: `© 2026 KIVO - FUTORA GROUP OF COMPANIES`
  - `FUTORA GROUP OF COMPANIES` must be a tapable link redirecting to `https://www.futoragroup.in/`.
  - Styling: Pure blue text (`text-blue-600 dark:text-blue-400`), font-medium, and **NO underline** (`no-underline`).

### 🌐 Rule 1.4: Domain & Sitemap Alignment
- **Canonical Live Domain**: `https://www.kivo.futoragroup.in`
- Never mix with old or development subdomains (`kivo.futora.com`) in sitemaps, canonical tags, OpenGraph, or schema, as this causes Google Search Console "URL not allowed" cross-domain rejections.
- Live Sitemap: `https://www.kivo.futoragroup.in/sitemap.xml`

---

## 🎯 2. Primary SEO, AEO & GEO Targets
- **Target Keywords**:
  - `software for restaurant management` (Primary commercial target)
  - `restaurant management simplified`
  - `KIVO - Restaurant Management Simplified`
  - `KIVO futoragroup`
  - `KIVO madhur dhadve`
  - `who developed KIVO`
- **Main Heading (H1)**: `Software for restaurant management, simplified.`
- **Title Tag**: `KIVO — Software for Restaurant Management Simplified`

---

## 🏛️ 3. Core Architecture & Demo Mode Isolation
- **Live Demo Route (`/demo/*`)**:
  - Must remain 100% self-contained with mock data.
  - The mobile bottom navigation and sidebar in `/demo` must NEVER redirect users to `/login` or attempt authenticated API calls.
  - Hardcoded production paths must be mapped: `/pos` → `/demo/pos`, `/orders` → `/demo/orders`, `/kds` → `/demo/kds`, `/tables` → `/demo/tables`, `/menu` → `/demo/menu`, `/reports` → `/demo/reports`.
