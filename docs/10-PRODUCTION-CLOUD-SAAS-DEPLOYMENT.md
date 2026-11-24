# Volume 10: Production Cloud SaaS Deployment & Operations Manual

> **KIVOKO RESTAURANT OS — Enterprise Cloud & Offline-First POS System**  
> Document Type: Production Cloud SaaS Deployment & Operations Manual  
> Companion Architecture Doc: [`02-TECHNICAL-ARCHITECTURE.md`](./02-TECHNICAL-ARCHITECTURE.md)  
> Version: 1.0.0  
> Status: Approved / Production Deployment Standard  

---

## 1. Overview
KIVO is deployed as a centralized Multi-Tenant Cloud SaaS application. Unlike legacy standalone installations where each restaurant runs local database servers, KIVO operates on a unified, high-availability cloud architecture with:
* **Edge Frontend:** Next.js application served via Vercel Edge CDN or containerized on AWS ECS / Google Cloud Run / Hetzner.
* **Central Backend API:** Scalable NestJS microservices handling real-time WebSockets, order state machines, and billing.
* **High-Concurrency PostgreSQL:** Managed PostgreSQL (AWS RDS / Supabase / Neon) paired with PgBouncer connection pooling to seamlessly support 10,000+ concurrent restaurant terminals.
* **Redis Pub/Sub:** Real-time distribution for Kitchen Display Systems (KDS) and third-party food aggregators (Zomato, Swiggy, ONDC).
* **Automated SSL/TLS:** Reverse-proxy SSL certificate management via Caddy with Let's Encrypt.

---

## 2. Infrastructure Architecture Diagram

```
[ Restaurant POS / Mobile Kiosk / Waiter Tablet ]
                     │
                     ▼ (HTTPS / WSS)
             [ Caddy / Cloud CDN ]
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  [ Next.js Web App ]     [ NestJS Backend API ]
  (Edge / Port 3000)      (Port 4000)
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
           [ PgBouncer ]    [ Redis Relay ]  [ S3 Backups ]
                 │          (KDS & Orders)   (Cloud Recovery)
                 ▼
          [ PostgreSQL 16 ]
         (Multi-Tenant Cloud)
```

---

## 3. Quickstart Deployment Guide

### Step 1: Clone Repository & Configure Environment
```bash
git clone https://github.com/madyydam/futorakivo.git
cd futorakivo
cp .env.production.saas.example .env
```
Fill in your domain (`SAAS_DOMAIN=kivo.cloud`), database passwords, and JWT secret in `.env`.

### Step 2: Launch with Production Docker Compose
```bash
docker compose -f docker-compose.saas-cloud.yml up -d --build
```

### Step 3: Run Database Migrations
```bash
docker compose -f docker-compose.saas-cloud.yml exec backend npx prisma migrate deploy
```

### Step 4: Healthcheck Verification
* Health Endpoint: `https://your-domain.com/health`
* Readiness Endpoint: `https://your-domain.com/ready`
* Super Admin Console: `https://your-domain.com/super-admin`

---

## 4. Disaster Recovery & Database Backups
Automated hourly backups can be shipped directly to AWS S3 / Cloudflare R2 by configuring `S3_BACKUP_*` environment variables. Point-in-Time Recovery (PITR) is enabled on the managed cloud database.
