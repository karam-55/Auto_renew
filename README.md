# 🚗 Garage Go 2.0

نظام إدارة مرآب السيارات المتكامل - إعادة بناء كاملة

⚠️ **IMPORTANT: NO EMAILS ALLOWED** - See [NO_EMAILS.md](NO_EMAILS.md)

## 📋 نظرة عامة

Garage Go 2.0 هو نظام ERP + CRM + محاسبة متكامل لإدارة مرآب السيارات، مبني باستخدام أحدث التقنيات مع دعم Multi-tenancy ومحاسبة ذكية تلقائية.

## 🏗️ التقنيات

| الطبقة | التقنية |
|--------|---------|
| **Backend** | Node.js + Express + TypeScript + Prisma |
| **Database** | PostgreSQL 16+ |
| **Cache** | Redis 7+ |
| **File Storage** | MinIO (S3-compatible) |
| **Queue** | BullMQ |
| **Monitoring** | Prometheus + Grafana |
| **Admin Frontend** | Flutter Web + Windows Desktop |
| **Mechanic App** | Flutter Mobile (Android/iOS) |
| **Customer Frontend** | HTML5 + CSS3 + Vanilla JS |
| **Real-time** | Socket.io |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |
| **WhatsApp** | WhatsApp Business API |
| **Export** | PDFKit, ExcelJS |
| **Charts** | Chart.js |
| **Deployment** | Docker + Nginx |

## 📁 هيكل المشروع

```
AUTO_Renew/
├── backend/              # Node.js Backend
├── admin_frontend/       # Flutter Admin (Web + Desktop)
├── mechanic_app/         # Flutter Mechanic (Mobile)
├── customer_frontend/    # HTML Customer Page
├── docker-compose.yml    # Docker Orchestration
├── nginx.conf            # Nginx Configuration
├── PROJECT_PLAN.md       # خطة المشروع الشاملة
└── README.md             # هذا الملف
```

## 🚀 البدء السريع

### المتطلبات

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+
- Flutter 3.0+ (للتطبيقات)

### إعداد السيرفر (Hetzner Ubuntu 22.04)

```bash
# Update & Clean
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install postgresql-16 -y

# Install Nginx
sudo apt install nginx -y

# Install Flutter (للبناء)
sudo snap install flutter --classic
```

### إعداد المشروع

#### الخطوة 1: تشغيل Docker Desktop (مهم جداً)

1. **افتح Docker Desktop** من قائمة Start أو من اختصار سطح المكتب
2. **انتظر** حتى يبدأ Docker بالكامل (ستظهر أيقونة الحوت في شريط النظام)
3. **تأكد** أن Docker يعمل بشكل صحيح قبل المتابعة

#### الخطوة 2: تشغيل السكريبت التلقائي (موصى به)

```bash
# من جذر المشروع، شغل السكريبت التلقائي
.\scripts\check-docker.ps1
```

هذا السكريبت سيقوم بـ:
- ✅ التحقق من أن Docker Desktop يعمل
- ✅ تشغيل خدمات Docker المطلوبة (PostgreSQL, Redis, MinIO)
- ✅ تنفيذ قاعدة البيانات migrations
- ✅ تشغيل seed data إذا وجد

#### الخطوة 3: إعداد يدوي (اختياري)

إذا فضلت الإعداد اليدوي:

```bash
# Clone the repository
git clone <repo-url>
cd AUTO_Renew

# تشغيل خدمات Docker
docker-compose up -d postgres redis minio

# انتظر 15 ثانية حتى تبدأ الخدمات
# ثم نفذ المigrations
cd backend
npx prisma migrate dev --name init

# تشغيل seed data إذا وجد
npx prisma db seed

# Backend Setup
npm install
npx prisma generate
npm run dev

# Admin Frontend Setup
cd ../admin_frontend
flutter pub get
flutter run -d chrome

# Mechanic App Setup
cd ../mechanic_app
flutter pub get
flutter run
```

#### استكشاف الأخطاء

**إذا لم يعمل Docker:**
- تأكد أن Docker Desktop مفتوح ويعمل
- أعد تشغيل Docker Desktop إذا لزم الأمر
- تحقق من أن Docker لديه موارد كافية (RAM, CPU)

**إذا فشلت المigrations:**
- تأكد أن PostgreSQL يعمل: `docker-compose ps postgres`
- تحقق من DATABASE_URL في backend/.env
- حذف قاعدة البيانات وإعادة البناء: `docker-compose down -v && docker-compose up -d`

**إذا فشلت الاختبارات:**
- تأكد أن قاعدة البيانات تحتوي على جداول
- نفذ `npx prisma migrate dev` مرة أخرى
- تحقق من أن جميع الـ dependencies مثبتة

## 🔧 التكوين

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/garage_master"

# JWT
JWT_SECRET="your_jwt_secret_min_32_chars"
JWT_REFRESH_SECRET="your_refresh_secret_min_32_chars"

# Server
PORT=8080
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:3000"
CUSTOMER_CORS_ORIGIN="http://localhost:3001"
MECHANIC_CORS_ORIGIN="http://localhost:3002"
```

## 📊 قاعدة البيانات

### Schema

الـ Schema الكامل موجود في `backend/prisma/schema.prisma`

### الميزات

- **Multi-tenancy**: Schema per tenant
- **UUID Primary Keys**: لكل الجداول
- **Relations**: علاقات كاملة بين الجداول
- **Enums**: للحالات والأنواع
- **Indexes**: لتحسين الأداء

## 🔐 الأدوار والصلاحيات

| الدور | الصلاحيات |
|-------|-----------|
| OWNER | كل شيء |
| MANAGER | كل شيء ما عدا الإعدادات المتقدمة |
| RECEPTIONIST | الحجوزات، الزبائن، المركبات |
| MECHANIC | مهامه، اقتراح قطع، تحديث حالة |
| ACCOUNTANT | المحاسبة، القيود، التقارير المالية |
| CASHIER | الفواتير، المدفوعات، الصندوق |
| SALES | المخزون، الفواتير، الزبائن |

## 🎯 الميزات المتقدمة

### نظام الكاشير
- Cash registers مع sessions
- تسوية الصندوق (Cash Reconciliation)
- تتبع كل عملية دفع

### نظام الخصومات والعروض
- Promotions مع coupon codes
- شروط تنفيذ العروض
- تقرير أداء العروض

### نظام المهام والملاحظات
- Tasks مع assignments
- Notes على الحجوزات والزبائن
- تذكيرات WhatsApp

### نظام المركبات المتقدم
- Mileage logging
- Vehicle issues tracking
- Inspection checklists

### نظام المشتريات المتقدم
- Purchase orders
- Goods Receipt Notes (GRN)
- Three-way matching

### نظام التقسيط
- Installment plans
- Payment tracking
- إشعارات WhatsApp
- Accounts Receivable Aging

### نظام التقييمات
- Customer reviews (1-5 stars)
- Mechanic ratings
- تقييمات عبر WhatsApp

### نظام المواعيد
- Time slots
- Appointment scheduling
- إشعارات تذكير
- Rescheduling

### نظام الضمان
- Warranty tracking
- Warranty claims
- التحقق التلقائي من الصلاحية

### نظام التكاليف الإضافية
- Extra charge types
- Manager approval
- إضافة تكاليف للحجز

### نظام الصيانة الوقائية
- Preventive maintenance templates (معتمدة من الوكيل)
- Maintenance logs مع الصور والفواتير
- Maintenance packages (حزم جاهزة)
- تذكيرات متعددة قبل الموعد
- تحذير من التأخير

### نظام الشيكات
- Cheques (صادرة/واردة)
- Cheque transactions
- تتبع حالة الشيك
- إشعارات قبل الاستحقاق
- شيكات مرتجعة (Bounced)
- تسوية مع الفواتير
- القيود المحاسبية التلقائية

### نظام جرد المخزون
- Inventory counts (دوري/مفاجئ)
- Inventory count items
- Inventory count adjustments
- تسجيل الفرق (Variance)
- تعديل المخزون تلقائياً
- تسوية محاسبية
- إقرار الجرد

---

## 💰 المحاسبة الذكية

### القيود التلقائية

- إنشاء حجز + دفع → دائن: الإيرادات / مدين: النقدية
- شراء قطع غيار → دائن: الموردين / مدين: المخزون
- صرف راتب → دائن: النقدية / مدين: المصاريف
- استهلاك قطع للحجز → دائن: المخزون / مدين: تكلفة البضاعة المباعة

### الميزات

- توازن القيود تلقائي (debits = credits)
- دعم العملات المزدوجة (SYP + USD)
- فترات مالية مغلقة
- تقارير: ميزانية عمومية، أرباح وخسائر، دفتر يومية

## 📱 صفحة الزبون

```
https://your-domain.com/track?token={public_token}
```

- كل حجز له `public_token` فريد
- QR Code يحتوي على الرابط
- معلومات الحجز، المركبة، الخدمات، الفاتورة
- تحديث تلقائي كل 30 ثانية

## 🚀 الإطلاق

```bash
# Build all
cd backend && npm run build
cd ../admin_frontend && flutter build web
cd ../mechanic_app && flutter build apk

# Docker
docker-compose up -d

# Nginx (SSL)
sudo certbot --nginx -d your-domain.com
```

## 📝 خطة التنفيذ

الخطة الكاملة موجودة في `PROJECT_PLAN.md`

## 🤝 المساهمة

...

## 📄 الترخيص

ISC

---

**تاريخ الإنشاء**: 2026-05-25
**الحالة**: قيد التطوير
