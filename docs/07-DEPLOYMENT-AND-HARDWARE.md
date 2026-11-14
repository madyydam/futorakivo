# Volume 07: Hardware Setup, Mobile Apps & Production Deployment Guide

> **KIVO — Software for Restaurant Management Simplified**  
> Document Type: Hardware Integration, Mobile Architecture & Production Runbook  
> Companion Architecture Doc: [`02-TECHNICAL-ARCHITECTURE.md`](./02-TECHNICAL-ARCHITECTURE.md)  
> Version: 1.0.0  
> Status: Approved / DevOps & Hardware Engineering  

---

## 1. Hardware Integration & Thermal Printing

KIVO connects directly with standard, off-the-shelf restaurant hardware without requiring proprietary vendor adapters:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HARDWARE TOPOLOGY                               │
├─────────────────────┬─────────────────────┬────────────────────────────┤
│ 1. PRINTERS (ESC)   │ 2. SCANNERS / TILL  │ 3. SCREENS & MOBILES       │
├─────────────────────┼─────────────────────┼────────────────────────────┤
│ • 2-Inch (58mm)     │ • USB Barcode (HID) │ • iPad / Android Tablets   │
│ • 3-Inch (80mm)     │ • QR Scanners       │ • Captain Smartphones      │
│ • LAN (Port 9100)   │ • RJ11 Cash Drawers │ • Customer-Facing Display  │
│ • USB / Bluetooth   │ • Weighing Scales   │ • KDS Kitchen Displays     │
└─────────────────────┴─────────────────────┴────────────────────────────┘
```

### 1.1 Thermal Receipt Printers (ESC/POS)
KIVO generates raw ESC/POS binary buffers directly in the browser and backend:

#### Supported Connection Interfaces:
1. **Network LAN / Wi-Fi (Recommended)**: Connects directly via raw TCP socket to port `9100`. Fast, reliable, and shared across multiple POS terminals.
2. **USB Direct**: Uses WebUSB or Linux raw device nodes (`/dev/usb/lp0`).
3. **Bluetooth**: WebBluetooth on Android tablets or paired Bluetooth printer profiles.

#### ESC/POS Command Code Standards:
- **Initialize Printer**: `ESC @` (`0x1B, 0x40`)
- **Bold Text On/Off**: `ESC E 1` / `ESC E 0`
- **Center Alignment**: `ESC a 1`
- **Dynamic QR Code Generation**: `GS ( k` (`0x1D, 0x28, 0x6B`)
- **Auto Paper Cut**: `GS V 66 0` (`0x1D, 0x56, 0x42, 0x00`)
- **Cash Drawer Kick Pulse (RJ11)**: `ESC p 0 25 250` (`0x1B, 0x70, 0x00, 0x19, 0xFA`)

### 1.2 Barcode Scanners & Cash Drawers
- **USB HID Scanners**: Any standard barcode scanner operating in "Keyboard Emulation" mode works out of the box. KIVO automatically detects rapid character bursts ending with `Enter` as scanned item codes.
- **Cash Drawers**: Standard RJ11 cash drawers plug directly into the back of thermal receipt printers and kick open on cash tender.

---

## 2. Mobile Applications & Delivery Rider Architecture

### 2.1 Tableside Captain Webapp
- **PWA Architecture**: Service Worker cached application designed for handheld smartphones and tablets.
- **Optimized for Low Latency**: Touch-first menu navigation, quick modifier swiping, and instant order dispatch to kitchen KDS screens.

### 2.2 Delivery Rider Webapp (`/my-deliveries`)
- **Assigned Orders Queue**: Delivery riders receive real-time push alerts when food is marked `READY` on the expediter screen.
- **Rider Workflow**:
  1. Rider accepts order $\rightarrow$ Order status shifts to `OUT_FOR_DELIVERY`.
  2. Tap customer phone number $\rightarrow$ Launches native dialer.
  3. Tap address $\rightarrow$ Opens Google Maps with direct navigation coordinates.
  4. Collect payment (Cash/UPI) $\rightarrow$ Tap **Delivered & Settled**.

---

## 3. Self-Service Order Kiosks (`/kiosk/[token]`)

For high-traffic food courts and quick-service burger/coffee concepts:

### 3.1 Kiosk Operation Mode
1. **Sandboxed Token Authentication**: Terminal loads `/kiosk/:token`. Token provides restricted access solely to public menu reading and order creation.
2. **Fullscreen PWA Mode**: Prevents customer tampering or navigation away from the ordering screen.
3. **Customer Checkout**: Customer browses photos, selects combo items, pays via integrated dynamic UPI QR, and collects a printed order token.

---

## 4. Production Deployment Runbook

KIVO is architected for deployment across modern cloud infrastructure:

```
[Clients: POS / KDS / Captains]
               │
               ▼
   [Cloudflare / DNS / CDN]
               │
       ┌───────┴───────┐
       ▼               ▼
 [Vercel Edge]   [Docker Container]
 (Next.js 16)    (NestJS Backend)
                       │
               ┌───────┴───────┐
               ▼               ▼
         [PostgreSQL]       [Redis]
         (Primary DB)    (Socket.IO PubSub)
```

### 4.1 Environment Variables Reference

```env
# ── Server & Application ──
NODE_ENV=production
PORT=4000
NEXT_PUBLIC_APP_URL=https://www.kivo.futoragroup.in
CORS_ORIGIN=https://www.kivo.futoragroup.in

# ── Database & Redis ──
DATABASE_URL="postgresql://kivo_user:Secr3tP@ss@db-cluster.internal:5432/kivo_production?schema=public&sslmode=require"
REDIS_URL="redis://default:CacheToken@redis-cluster.internal:6379"

# ── Cryptography & Security ──
JWT_SECRET="e9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4..."
COOKIE_SECRET="7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2..."
WEBHOOK_SIGNING_KEY="whsec_live_99f8e7d6c5..."

# ── Analytics & Search Console (Optional) ──
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"
```

### 4.2 Production Deployment Commands
```bash
# 1. Install dependencies across all monorepo workspaces
pnpm install --frozen-lockfile

# 2. Run database schema migrations
pnpm --filter backend prisma migrate deploy

# 3. Build backend NestJS API
pnpm --filter backend build

# 4. Build Next.js frontend
pnpm --filter web build

# 5. Start production instances
pnpm --filter backend start:prod
pnpm --filter web start
```

### 4.3 Health Checks & Telemetry
- **API Health Endpoint**: `GET /api/v1/health`
  - Returns `200 OK` with database connection latency, Redis ping status, and process memory utilization.
