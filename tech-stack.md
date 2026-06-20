# AUTO_Renew — Tech Stack & Deployment Guide

> **Project:** Garage Go 2.0 — Auto Garage Management System
> **Last Updated:** June 20, 2026
> **Status:** Production-Ready

---

## 📋 Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Backend Stack](#2-backend-stack)
3. [Database & Caching](#3-database--caching)
4. [File Storage](#4-file-storage)
5. [Frontend Applications](#5-frontend-applications)
6. [API Communication](#6-api-communication)
7. [Real-Time & Notifications](#7-real-time--notifications)
8. [Monitoring & Observability](#8-monitoring--observability)
9. [Security Stack](#9-security-stack)
10. [Docker & Orchestration](#10-docker--orchestration)
11. [Reverse Proxy (Nginx)](#11-reverse-proxy-nginx)
12. [Build & Deploy Commands](#12-build--deploy-commands)
13. [Environment Variables](#13-environment-variables)
14. [Ports & Services Map](#14-ports--services-map)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Admin App   │  │ Mechanic App │  │ Customer Web │             │
│  │ (Tauri/Win)  │  │(Flutter/Mob) │  │ (Static/HTML)│             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                 │                      │
│         └─────────────────┼─────────────────┘                      │
│                         ▼                                          │
│              ┌──────────────────────┐                               │
│              │     Nginx (80)     │  ← Reverse Proxy             │
│              └──────────┬─────────┘                               │
└─────────────────────────┼───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           Node.js + Express Backend (Port 8080)              │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │  │
│  │  │  REST   │ │Socket.IO│ │ BullMQ  │ │ MinIO   │            │  │
│  │  │  API    │ │ WS API  │ │ Workers │ │ Client  │            │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA & INFRASTRUCTURE                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ PostgreSQL │  │   Redis    │  │   MinIO    │  │ Prometheus │    │
│  │  (5433)    │  │  (6379)    │  │(9000/9001) │  │  (9090)   │    │
│  │ +pgBouncer │  │   Cache    │  │   S3 API   │  │  Metrics   │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
│  ┌────────────┐                                                      │
│  │  Grafana   │  ← Visualization (Port 3000)                         │
│  └────────────┘                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **TypeScript** | ^5.6.3 | Type-safe development |
| **Express.js** | ^4.19.2 | HTTP server framework |
| **Prisma ORM** | ^5.20.0 | Database ORM & migrations |
| **ts-node / ts-node-dev** | ^2.0.0 | Dev hot-reload |

### Key Backend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `bullmq` | ^5.77.6 | Background job queues (Redis-based) |
| `socket.io` | ^4.7.5 | Real-time WebSocket communication |
| `jsonwebtoken` | ^9.0.3 | JWT authentication |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `joi` | ^18.2.1 | Request validation schemas |
| `helmet` | ^7.2.0 | Security headers |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing |
| `express-rate-limit` | ^8.5.2 | Rate limiting |
| `multer` | ^2.1.1 | File upload handling |
| `minio` | ^7.1.3 | S3-compatible object storage client |
| `ioredis` | ^5.11.0 | Redis client |
| `axios` | ^1.16.1 | HTTP client for external APIs |
| `firebase-admin` | ^12.7.0 | Firebase Cloud Messaging |
| `pdfkit` | ^0.15.0 | PDF generation |
| `exceljs` | ^4.4.0 | Excel export |
| `qrcode` | ^1.5.4 | QR code generation |
| `prom-client` | ^15.1.0 | Prometheus metrics |
| `@bull-board/api` + `@bull-board/express` | ^7.1.5 | Queue monitoring UI |
| `compression` | ^1.8.1 | Gzip response compression |
| `dotenv` | ^16.4.5 | Environment variable management |

### Testing
| Technology | Version | Purpose |
|------------|---------|---------|
| **Jest** | ^29.7.0 | Unit testing framework |
| **ts-jest** | ^29.2.5 | TypeScript Jest preprocessor |
| **Playwright** | ^1.61.0 | E2E API & UI testing |
| **supertest** | ^7.0.0 | HTTP assertion library |

---

## 3. Database & Caching

### Primary Database
| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 16-alpine | Primary relational database |
| **pgBouncer** | latest | Connection pooling (port 6432) |

**Prisma Schema Stats:**
- **105 Models** (tables)
- **60 Enums**
- **Soft-delete** middleware on all models (except 35 child tables)
- **Multi-tenancy** via `tenantId` on every model

### Caching
| Technology | Version | Purpose |
|------------|---------|---------|
| **Redis** | 7-alpine | Caching, session store, BullMQ backend |
| **ioredis** | ^5.11.0 | Node.js Redis client |

**Redis Features Used:**
- Token blacklisting (JWT logout)
- Settings caching (5-min TTL)
- Analytics cache invalidation
- BullMQ job queues (5 queues)

---

## 4. File Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| **MinIO** | latest | S3-compatible object storage |

**MinIO Configuration:**
- **API Port:** 9000
- **Console Port:** 9001
- **Bucket:** `garage-files`
- **Use Cases:** Invoice PDFs, vehicle attachments, reports, receipts

---

## 5. Frontend Applications

### 5.1 Admin Application (`admin_tauri/`)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tauri** | ^2.11.0 | Rust-based desktop app framework |
| **Vite** | ^5.0.0 | Frontend build tool |
| **TypeScript** | ^5.0.0 | Type safety |
| **@tauri-apps/api** | ^2.11.0 | Tauri JS API |

**Target Platform:** Windows Desktop (primary)
**Window Size:** 1400x900 (min: 1024x768)
**Dev URL:** http://localhost:1420
**Bundle:** `.exe` installer with WebView2 bootstrapper

### 5.2 Mechanic App (`mechanic_app/`)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Flutter** | SDK >=3.0.0 <4.0.0 | Cross-platform mobile framework |
| **Dart** | 3.0+ | Programming language |

**Key Flutter Packages:**
| Package | Version | Purpose |
|---------|---------|---------|
| `dio` | ^5.6.0 | HTTP client |
| `pretty_dio_logger` | ^1.3.1 | Request/response logging |
| `socket_io_client` | ^2.0.3+1 | WebSocket client |
| `flutter_riverpod` | ^2.5.1 | State management |
| `go_router` | ^14.2.0 | Navigation routing |
| `firebase_messaging` | ^15.1.0 | Push notifications |
| `firebase_core` | ^3.6.0 | Firebase integration |
| `shared_preferences` | ^2.3.2 | Local storage |
| `flutter_screenutil` | ^5.9.3 | Responsive UI |
| `table_calendar` | ^3.1.2 | Calendar widget |
| `camera` | ^0.11.0 | Camera access |
| `image_picker` | ^1.1.2 | Gallery access |
| `qr_code_scanner` | ^1.0.1 | QR scanning |
| `uuid` | ^4.5.1 | UUID generation |
| `intl` | ^0.20.2 | Internationalization |
| `google_fonts` | ^6.2.1 | Typography |

**Target Platforms:** Android, iOS

### 5.3 Customer Frontend (`customer_frontend/`)
| Technology | Version | Purpose |
|------------|---------|---------|
| **HTML5** | — | Markup |
| **CSS3** | — | Styling |
| **Vanilla JavaScript** | ES6+ | Logic |

**Purpose:** Public booking tracking page (no framework, lightweight)

---

## 6. API Communication

### REST API
| Aspect | Detail |
|--------|--------|
| **Protocol** | HTTP/1.1 (via Nginx proxy) |
| **Format** | JSON |
| **Authentication** | Bearer JWT (`Authorization: Bearer <token>`) |
| **Response Format** | `{success: true/false, data: ..., error: {code, message}}` |
| **Base URL (Dev)** | `http://localhost:8080/api` |
| **Base URL (Prod)** | `http://localhost/api` (via Nginx) |

### API Client (Flutter)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Dio** | ^5.6.0 | HTTP client for Flutter |
| **pretty_dio_logger** | ^1.3.1 | Debug logging |

**Dio Configuration:**
- Base URL: `http://localhost:8080/api`
- Timeout: 30 seconds
- Interceptors: Auth token injection, refresh token rotation, error handling
- **Debounce on logout:** 5-second cooldown to prevent logout loops

### CORS Origins
```
Admin Frontend:      http://localhost:3000
Customer Frontend:   http://localhost:3001
Mechanic Frontend:   http://localhost:3002
```

---

## 7. Real-Time & Notifications

### WebSocket (Socket.IO)
| Technology | Version | Purpose |
|------------|---------|---------|
| **socket.io** (Server) | ^4.7.5 | Real-time backend events |
| **socket_io_client** (Flutter) | ^2.0.3+1 | Real-time frontend events |

**Use Cases:**
- Live booking status updates
- Mechanic assignment notifications
- Inventory alerts
- Chat/messaging (future)

### Push Notifications
| Technology | Version | Purpose |
|------------|---------|---------|
| **Firebase Cloud Messaging (FCM)** | ^15.1.0 | Push notifications to mobile |
| **firebase-admin** (Node.js) | ^12.7.0 | Server-side FCM management |

### WhatsApp Notifications
| Technology | Version | Purpose |
|------------|---------|---------|
| **Meta WhatsApp Cloud API** | v18.0+ | Business messaging |
| **axios** | ^1.16.1 | HTTP client for API calls |

---

## 8. Monitoring & Observability

### Metrics Collection
| Technology | Version | Purpose |
|------------|---------|---------|
| **Prometheus** | latest | Metrics scraping & storage (Port 9090) |
| **prom-client** (Node.js) | ^15.1.0 | Application metrics export |

**Metrics Exposed:**
- HTTP request duration (histogram)
- Request rate (counter)
- Active connections (gauge)
- Queue job counts (custom)
- Database query performance

### Visualization
| Technology | Version | Purpose |
|------------|---------|---------|
| **Grafana** | latest | Dashboards & alerts (Port 3000) |

### Queue Monitoring
| Technology | Version | Purpose |
|------------|---------|---------|
| **Bull Board** | ^7.1.5 | Queue UI at `/admin/queues` |

---

## 9. Security Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Headers** | Helmet.js | Security headers (CSP, HSTS, X-Frame-Options) |
| **CORS** | cors | Cross-origin policy enforcement |
| **Rate Limit** | express-rate-limit | Brute-force protection |
| **Input Sanitization** | express-sanitizer | XSS prevention |
| **Validation** | joi + express-validator | Request body/query validation |
| **Auth** | JWT (jsonwebtoken) | Stateless token authentication |
| **Passwords** | bcryptjs | Argon2-like hashing (10 rounds) |
| **Files** | multer | Upload validation & size limits |
| **Audit** | Custom middleware | Change tracking to `AuditLog` table |
| **RBAC** | Custom middleware | Role-based access control |
| **Tenant Isolation** | Custom middleware | Multi-tenant data separation |

---

## 10. Docker & Orchestration

### Docker Compose Services
| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | postgres:16-alpine | 5433 | Primary database |
| `pgbouncer` | pgbouncer/pgbouncer | 6432 | Connection pooler |
| `redis` | redis:7-alpine | 6379 | Cache & queues |
| `minio` | minio/minio | 9000/9001 | Object storage |
| `backend` | Custom Dockerfile | 8080 | API server |
| `nginx` | nginx:alpine | 80/443 | Reverse proxy |
| `prometheus` | prom/prometheus | 9090 | Metrics |
| `grafana` | grafana/grafana | 3000 | Dashboards |

### Resource Limits
| Service | CPU Limit | Memory Limit |
|---------|-----------|--------------|
| PostgreSQL | 2 cores | 2 GB |
| Redis | 1 core | 512 MB |
| Backend | 2 cores | 2 GB |

### Security Features
- Network isolation (`garage_network` bridge)
- Read-only root filesystem for backend container
- Non-root user for PostgreSQL
- tmpfs for `/tmp`
- Log rotation (10MB max, 3-5 files)

---

## 11. Reverse Proxy (Nginx)

**File:** `nginx.conf`

### Routes
| Path | Destination | Purpose |
|------|-------------|---------|
| `/admin` | `admin_frontend/build/web` | Admin Flutter Web app |
| `/customer` | `customer_frontend` | Customer static site |
| `/api` | `backend:8080` | REST API proxy |
| `/socket.io` | `backend:8080` | WebSocket upgrade proxy |

### Headers Injected
- `X-Real-IP`
- `X-Forwarded-For`
- `X-Forwarded-Proto`
- `Upgrade` / `Connection` (for WebSockets)

---

## 12. Build & Deploy Commands

### Backend
```bash
# Development
cd backend && npm run dev           # ts-node-dev hot-reload

# Production Build
cd backend && npm run build         # tsc → dist/
cd backend && npm run start         # node dist/server.js

# Database
cd backend && npx prisma generate    # Generate Prisma client
cd backend && npx prisma migrate dev # Run migrations
cd backend && npx prisma studio      # DB GUI (Port 5555)
```

### Admin Tauri
```bash
cd admin_tauri && npm run dev       # Vite dev server (Port 1420)
cd admin_tauri && npm run build     # Production build
cd admin_tauri && npm run tauri build  # Build .exe installer
```

### Mechanic App (Flutter)
```bash
cd mechanic_app && flutter pub get
cd mechanic_app && flutter run      # Debug mode
cd mechanic_app && flutter build apk --release
cd mechanic_app && flutter build ios --release
```

### Docker (Full Stack)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Restart specific service
docker-compose restart backend
```

---

## 13. Environment Variables

### Database
| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | garage_secure_password_2024 | PostgreSQL password |
| `DATABASE_URL` | (composed) | Prisma connection string |

### Redis
| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_PASSWORD` | redis_password_2024 | Redis auth password |
| `REDIS_URL` | (composed) | Redis connection string |

### MinIO
| Variable | Default | Description |
|----------|---------|-------------|
| `MINIO_ROOT_USER` | garage_minio | MinIO admin user |
| `MINIO_ROOT_PASSWORD` | — | MinIO admin password |
| `MINIO_SECRET_KEY` | — | Backend access key |
| `MINIO_BUCKET` | garage-files | Default bucket |

### JWT
| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | (required) | Access token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | (required) | Refresh token secret |

### CORS
| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGIN` | http://localhost:3000 | Admin frontend origin |
| `CUSTOMER_CORS_ORIGIN` | http://localhost:3001 | Customer frontend origin |
| `MECHANIC_CORS_ORIGIN` | http://localhost:3002 | Mechanic frontend origin |

### Monitoring
| Variable | Default | Description |
|----------|---------|-------------|
| `GF_SECURITY_ADMIN_PASSWORD` | (required) | Grafana admin password |

---

## 14. Ports & Services Map

| Port | Service | Protocol | Access |
|------|---------|----------|--------|
| 80 | Nginx | HTTP | Public |
| 443 | Nginx | HTTPS | Public (future) |
| 8080 | Backend API | HTTP | Internal / Proxy |
| 5433 | PostgreSQL | TCP | Internal |
| 6432 | pgBouncer | TCP | Internal |
| 6379 | Redis | TCP | Internal |
| 9000 | MinIO API | HTTP | Internal |
| 9001 | MinIO Console | HTTP | Internal |
| 9090 | Prometheus | HTTP | Internal |
| 3000 | Grafana | HTTP | Internal |
| 1420 | Admin Tauri Dev | HTTP | Local Dev |

---

## 15. Production Deployment (Hetzner)

### Target Server
| Detail | Value |
|--------|-------|
| **Provider** | Hetzner Cloud |
| **OS** | Ubuntu 22.04 LTS |
| **IP** | `178.105.209.59` |
| **Protocol** | SFTP (SSH) |
| **UserName** | `root` |
| **Deploy Directory** | `/opt/auto-renew` |

### SSH Authentication
| Detail | Value |
|--------|-------|
| **Auth Method** | SSH Key (Ed25519) |
| **Key Name** | `hetzner_deployer` |
| **Private Key** | `~/.ssh/hetzner_deployer` |
| **Public Key** | `~/.ssh/hetzner_deployer.pub` |
| **Key Fingerprint** | `FIX 11@DESKTOP-RAL02E0` |

> **Status:** ✅ SSH key authentication active — password login disabled

### SSH Key Content (Public)
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDDXmqWGikXY2X3/R7IUymeIFk/rg44PtSa2U6CfVIy0kL8XwCkN6WoXPg1vT1HmevC9FpTsMgNtyTdm9CFPD/bLqbVWtLahesVaDy6LfEh4TeyHacThzveiZDmwk7PZ0h7/dneXAUDNE+x7YaYV3V3wg1+8xzKxbNtxnkWSN+ALkD2jkZgFdBgL4xkOsDgd8fMb+NU4cNQ5rM4CcnHVzvqJE1uNZ9pIO4BMtBYib+dWoxWGokp0stJqZJcu/T7z7EPBtj7zu+peLJmGc0BgBQlBKSI+oM4T8udaHn6wOImnA4mBzka+YjkWwRp5Jc+WCnD58Fqs8GVY4Ab+1Q7bGiEcBBkKZFssDzu87XmPAXUK3Mqzfxp72Kh5erlmjBJRXwJC2ZcLaw1YNIUOB6wDClylX4IJfgGI/i3OUL+0gseukcvbdbFB0Kmd8oqfBQXe53SDBZmi7mdAyLFafX27gnIs2fhVe1k5DL6fHqZ3UbQOw7GxTDizwfrzQVVgwrvLO8xGMcG3BzrRKC+uU26h29XT8L6xa9dc3vZo1GHgz2Qn0IkpwNkHJcoLr9TauUpbUAdCQD4/v5QpwIK6nThvDJg1+brE8MXcTKGlXYuG+/ig93qxXoMxlJc3KwYZlNj6M/8wFe2qVRFpgWbs40xNvbAHdGmDI+VQkk9JzSsoK28OQ== FIX 11@DESKTOP-RAL02E0
```

### SSH Connection Test
```bash
# Using SSH key (recommended)
ssh -i ~/.ssh/hetzner_deployer root@178.105.209.59

# Verify server status
ssh -i ~/.ssh/hetzner_deployer root@178.105.209.59 "uptime && hostname"
```

> **Security Note:** Password authentication has been disabled. Root login now requires SSH key only.

### Server Setup Script (`deploy/deploy.sh`)

**9-Step Automated Setup:**

| Step | Action | Details |
|------|--------|---------|
| 1 | **System Update** | `apt-get update && apt-get upgrade -y` |
| 2 | **Install Docker** | Docker CE + Compose plugin from official repo |
| 3 | **Create Directory** | `/opt/auto-renew` |
| 4 | **Configure UFW** | Allow SSH (22), HTTP (80), HTTPS (443) — deny all else |
| 5 | **Configure Fail2Ban** | SSH brute-force protection |
| 6 | **Copy Files** | `deploy/`, `backend/`, `customer_frontend/`, `evolution-api-main/` |
| 7 | **Generate Secrets** | Auto-generate random passwords via `openssl rand` |
| 8 | **Build & Deploy** | Build backend Docker image, start all services |
| 9 | **Verify** | `docker compose ps`, print access URLs |

**Auto-Generated Secrets:**
- `POSTGRES_PASSWORD` — 32 bytes base64
- `EVO_POSTGRES_PASSWORD` — 32 bytes base64
- `REDIS_PASSWORD` — 32 bytes base64
- `MINIO_PASSWORD` — 32 bytes base64
- `JWT_SECRET` — 48 bytes base64
- `JWT_REFRESH_SECRET` — 48 bytes base64
- `EVO_API_KEY` — 32 bytes hex uppercase

### Production Docker Compose (`deploy/docker-compose.prod.yml`)

**Services (7 containers):**

| Service | Image | Internal Port | Notes |
|---------|-------|---------------|-------|
| `postgres` | postgres:16-alpine | 5432 | Main DB, healthcheck, bound to `127.0.0.1:5433` |
| `evolution-postgres` | postgres:15-alpine | 5432 | Evolution API DB |
| `redis` | redis:7-alpine | 6379 | Auth password, AOF persistence |
| `evolution-redis` | redis:7-alpine | 6379 | Evolution API cache |
| `minio` | minio/minio | 9000/9001 | Bound to `127.0.0.1` |
| `backend` | Custom Dockerfile | 8080 | Healthcheck, `NODE_ENV=production`, bound to `127.0.0.1` |
| `evolution-api` | evoapicloud/evolution-api | 8081 | WhatsApp gateway, bound to `127.0.0.1` |
| `nginx` | nginx:alpine | 80 | Public-facing reverse proxy |

**Volumes (6 persistent):**
- `postgres_data` — Main database
- `evolution_postgres_data` — Evolution API database
- `redis_data` — Redis cache
- `evolution_redis_data` — Evolution API cache
- `minio_data` — File storage
- `evolution_instances` — WhatsApp instance configs

**Security:**
- All internal services bound to `127.0.0.1` (not publicly exposed)
- Only Nginx (port 80) exposed to public
- No resource limits in prod (unrestricted)

### Production Nginx (`deploy/nginx.conf`)

**Features:**
- `worker_connections 4096`
- **Gzip** compression (level 6, all text/json/css/js types)
- **Security Headers:** X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy

**Routes:**

| Location | Destination | Description |
|----------|-----------|-------------|
| `/` | Redirect → `/customer/` | Root redirects to customer portal |
| `/customer` | `customer_frontend/` files | Static customer portal |
| `/api` | `backend:8080` | REST API proxy |
| `/socket.io` | `backend:8080` | WebSocket proxy |
| `/evolution/*` | `evolution-api:8081` | WhatsApp API proxy |
| `/health` | `backend:8080/health` | Health check (no access log) |

**SSL Template:**
- HTTPS block commented out (enable after domain acquisition)
- TLS 1.2/1.3, strong cipher suite
- Certbot integration ready

### Production Environment (`deploy/.env.production`)

**Template Variables (all `<REQUIRED>`):**
```
POSTGRES_USER=garage_admin
POSTGRES_PASSWORD=<REQUIRED>
POSTGRES_DB=garage_master
EVO_POSTGRES_DB=evolution_db
EVO_POSTGRES_USER=postgres
EVO_POSTGRES_PASSWORD=<REQUIRED>
REDIS_PASSWORD=<REQUIRED>
MINIO_ROOT_USER=garage_minio
MINIO_PASSWORD=<REQUIRED>
MINIO_BUCKET=garage-files
JWT_SECRET=<REQUIRED: 32+ chars>
JWT_REFRESH_SECRET=<REQUIRED: 32+ chars>
CORS_ORIGIN=*
CUSTOMER_CORS_ORIGIN=*
MECHANIC_CORS_ORIGIN=*
EVO_API_KEY=<REQUIRED>
EVO_INSTANCE_NAME=garage
DEFAULT_TENANT_ID=default
SERVER_IP=<YOUR_HETZNER_IP>
```

### Deploy Steps Summary

```bash
# 1. Build backend locally
cd backend && npm install && npm run build

# 2. Copy files to server
scp -r deploy/ backend/ customer_frontend/ evolution-api-main/ root@SERVER_IP:/opt/auto-renew/

# 3. Run deploy script on server
ssh root@SERVER_IP
cd /opt/auto-renew/deploy && chmod +x deploy.sh && sudo ./deploy.sh

# 4. Run database migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 5. Setup WhatsApp (scan QR code)
# Open: http://SERVER_IP:8081
```

### Useful Production Commands

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Restart service
docker compose -f docker-compose.prod.yml restart backend

# Full update
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Database backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U garage_admin garage_master > backup_$(date +%Y%m%d).sql
```

### Production Access URLs

| Service | URL | Auth |
|---------|-----|------|
| Customer Portal | `http://SERVER_IP/customer` | Public |
| REST API | `http://SERVER_IP/api` | JWT Bearer |
| Evolution API (WhatsApp) | `http://SERVER_IP:8081` | API Key |
| MinIO Console | `http://SERVER_IP:9001` | MinIO credentials |
| Admin Desktop App | Local `.exe` | Connects to `http://SERVER_IP/api` |
| Mechanic Mobile App | Android/iOS | Connects to `http://SERVER_IP/api` |

---

## 16. CI/CD & GitHub Actions (Auto-Deploy)

### GitHub Repository
| Detail | Value |
|--------|-------|
| **Repository** | `https://github.com/karam-55/Auto_renew.git` |
| **Owner** | `karam-55` |
| **Default Branch** | `main` |
| **Local Workspace** | `C:\Users\FIX 11\projects\AUTO_Renew` |

### GitHub Actions Workflow
**File:** `.github/workflows/deploy.yml`

| Detail | Value |
|--------|-------|
| **Trigger** | Push to `main` branch + Manual (`workflow_dispatch`) |
| **Runner** | `ubuntu-latest` |
| **SSH Secret** | `SSH_KEY` (Repository secret) |
| **Server IP** | `178.105.209.59` |

### Auto-Deploy Pipeline

**What happens on every `git push origin main`:**

```
GitHub Push (main)
       ↓
[GitHub Actions triggers]
       ↓
[Setup SSH key from secrets]
       ↓
[Add server to known_hosts]
       ↓
rsync backend/         → root@178.105.209.59:/opt/auto-renew/backend/
rsync customer_frontend/ → root@178.105.209.59:/opt/auto-renew/customer_frontend/
rsync deploy/          → root@178.105.209.59:/opt/auto-renew/deploy/
       ↓
[SSH into server]
       ↓
docker compose build backend
       ↓
docker compose up -d backend
       ↓
npx prisma migrate deploy
       ↓
docker compose ps (verify)
```

### Synced Folders (3 folders only)

| Local Folder | Remote Path | Description |
|--------------|-------------|-------------|
| `backend/` | `/opt/auto-renew/backend/` | Backend API source + Dockerfile |
| `customer_frontend/` | `/opt/auto-renew/customer_frontend/` | Customer static web app |
| `deploy/` | `/opt/auto-renew/deploy/` | Docker Compose + Nginx + scripts |

**Excluded from sync:**
- `node_modules/` (rebuilt on server)
- `dist/` (built on server)
- `*.log` files
- `.env` file (managed separately on server)

### Verification Status

| Check | Status | Details |
|-------|--------|---------|
| Server directory exists | ✅ | `/opt/auto-renew/` present |
| `backend/` synced | ✅ | Last sync: `Jun 20 00:52 UTC` |
| `customer_frontend/` synced | ✅ | Last sync: `Jun 20 00:52 UTC` |
| `deploy/` synced | ✅ | Last sync: `Jun 20 00:52 UTC` |
| Matches latest commit | ✅ | Commit `1ac264c` — `fix: correct health check endpoint path` |
| Uncommitted changes | ✅ None | Both local and server are clean |

### How to Deploy

**Option A: Automatic (recommended)**
```bash
# Make changes, commit, and push — server auto-syncs
git add .
git commit -m "your commit message"
git push origin main
# → GitHub Actions auto-deploys to 178.105.209.59
```

**Option B: Manual Trigger**
1. Go to GitHub → Actions → "Deploy to Production"
2. Click "Run workflow" → Select branch `main`

### Production Commands (on Server)

```bash
# SSH into server
ssh -i ~/.ssh/hetzner_deployer root@178.105.209.59

# Check deployed files
cd /opt/auto-renew/
ls -la

# View containers
cd /opt/auto-renew/deploy && docker compose -f docker-compose.prod.yml ps

# View logs
cd /opt/auto-renew/deploy && docker compose -f docker-compose.prod.yml logs -f backend

# Restart backend manually (if needed)
cd /opt/auto-renew/deploy && docker compose -f docker-compose.prod.yml restart backend
```

---

## 🎯 Summary

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 18+ + TypeScript |
| **Framework** | Express.js 4 |
| **Database** | PostgreSQL 16 + pgBouncer |
| **ORM** | Prisma 5 |
| **Cache** | Redis 7 |
| **Queues** | BullMQ (Redis-backed) |
| **Storage** | MinIO (S3-compatible) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Real-Time** | Socket.IO |
| **Push** | Firebase Cloud Messaging |
| **WhatsApp** | Meta Cloud API |
| **Frontend (Admin)** | Tauri 2 + Vite + TypeScript |
| **Frontend (Mechanic)** | Flutter 3 + Riverpod + Dio |
| **Frontend (Customer)** | Static HTML/CSS/JS |
| **Proxy** | Nginx |
| **Containerization** | Docker + Docker Compose |
| **Monitoring** | Prometheus + Grafana |
| **Testing** | Jest + Playwright |
| **PDF** | PDFKit |
| **Excel** | ExcelJS |
