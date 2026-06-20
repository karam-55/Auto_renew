# 🚗 Garage Go 2.0 - الخطة الشاملة لإعادة البناء

⚠️ **IMPORTANT: NO EMAILS ALLOWED** - See [NO_EMAILS.md](NO_EMAILS.md)

## 1. الملخص التنفيذي

إعادة بناء نظام Garage Go من الصفر باستخدام Node.js/TypeScript Backend + Flutter (Web/Desktop/Mobile) + PostgreSQL مع دعم Multi-tenancy، محاسبة ذكية تلقائية، وتقارير متقدمة.

---

## 2. التقنيات والـ Stack

| الطبقة | التقنية | السبب |
|--------|---------|-------|
| **Backend** | Node.js + Express + TypeScript | أداء، Typesafety، ecosystem واسع |
| **ORM** | Prisma | أحدث ORM، Typesafe، أفضل PostgreSQL support، migrations سهلة |
| **Database** | PostgreSQL 16+ | Robust، JSON support، Full-text search |
| **Multi-tenancy** | Schema per Tenant | عزل كامل للبيانات بين المرائب |
| **Admin Frontend** | Flutter Web + Windows Desktop | تطبيق واحد لكل المنصات |
| **Mechanic App** | Flutter Mobile (Android/iOS) | نفس codebase مع تخصيص للموبايل |
| **Customer Frontend** | HTML5 + CSS3 + Vanilla JS | صفحة خفيفة ديناميكية + QR Code |
| **Real-time** | Socket.io | إشعارات فورية |
| **WhatsApp** | WhatsApp Business API / Evolution API | إشعارات للزبائن |
| **AI (لاحقاً)** | OpenAI API / Ollama | تحليلات مالية وتوصيات |

---

## 3. هيكل المشروع

```
AUTO_Renew/
├── backend/                          # Node.js + Express + TypeScript
│   ├── prisma/                       # Schema + Migrations
│   ├── src/
│   │   ├── config/                   # Env, DB, Redis
│   │   ├── shared/                   # Utils, middlewares, base classes
│   │   ├── modules/                  # Feature-based
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── tenants/
│   │   │   ├── customers/
│   │   │   ├── vehicles/
│   │   │   ├── bookings/
│   │   │   ├── services/
│   │   │   ├── inventory/
│   │   │   ├── accounting/
│   │   │   ├── journal/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   ├── hr/
│   │   │   ├── payroll/
│   │   │   ├── reports/
│   │   │   ├── notifications/
│   │   │   └── whatsapp/
│   │   └── server.ts
│   ├── tests/
│   └── package.json
│
├── admin_frontend/                   # Flutter Web + Desktop
│   ├── lib/
│   │   ├── core/                     # Theme, Router, Network, Localization
│   │   ├── modules/                  # Feature-based
│   │   └── main.dart
│   └── pubspec.yaml
│
├── mechanic_app/                     # Flutter Mobile
│   ├── lib/
│   │   ├── core/
│   │   ├── modules/
│   │   └── main.dart
│   └── pubspec.yaml
│
├── customer_frontend/                # HTML/CSS/JS
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── docker-compose.yml
├── nginx.conf
└── PROJECT_PLAN.md
```

---

## 4. Database Schema (إعادة تصميم)

### 4.1 Core Tables
- `tenants` - معلومات المرآب
- `users` - الموظفين (Owner, Manager, Receptionist, Accountant, Mechanic, Sales, Cashier)
- `roles` - الأدوار
- `permissions` - الصلاحيات
- `customers` - الزبائن
- `vehicles` - المركبات (public_car_id للـ QR)
- `services` - الخدمات (صيانة)
- `bookings` - الحجوزات (public_token للصفحة)
- `booking_services` - خدمات الحجز
- `mechanic_assignments` - تعيين الميكانيكي

### 4.2 Inventory Tables
- `suppliers` - الموردين
- `parts` - القطع
- `part_categories` - أصناف القطع
- `inventory_transactions` - حركات المخزن
- `warehouses` - المستودعات

### 4.3 Accounting Tables (ذكي وتلقائي)
- `fiscal_periods` - الفترات المالية
- `accounts` - شجرة الحسابات (Chart of Accounts)
- `journal_entries` - القيود اليومية
- `journal_lines` - تفاصيل القيد
- `invoices` - الفواتير
- `invoice_lines` - بنود الفاتورة
- `payments` - المدفوعات
- `payment_methods` - طرق الدفع
- `currencies` - العملات (SYP, USD)
- `exchange_rates` - أسعار الصرف

### 4.4 HR Tables
- `employees` - الموظفين
- `attendance` - الحضور والانصراف
- `departments` - الأقسام
- `shifts` - الورديات

### 4.5 System Tables
- `audit_logs` - سجل التدقيق (مع Undo)
- `notifications` - الإشعارات
- `whatsapp_messages` - رسائل الواتساب
- `company_settings` - إعدادات الشركة

### 4.6 Advanced Features Tables
- `attachments` - الصور والملفات (S3/MinIO)
- `maintenance_schedules` - جداول الصيانة الدورية
- `loyalty_points` - نقاط الولاء
- `loyalty_rewards` - مكافآت الولاء
- `tax_rates` - أسعار الضرائب
- `mechanic_shifts` - ورديات الميكانيكيين
- `push_notification_tokens` - رموز الإشعارات (FCM)
- `electronic_signatures` - التوقيع الإلكتروني
- `preventive_maintenance_templates` - قوالب الصيانة الوقائية
- `preventive_maintenance_logs` - سجل الصيانة الوقائية
- `maintenance_packages` - حزم الصيانة
- `maintenance_package_items` - بنود حزم الصيانة
- `cheques` - الشيكات (صادرة/واردة)
- `cheque_transactions` - حركات الشيكات
- `inventory_counts` - رؤوس الجرد
- `inventory_count_items` - تفاصيل الجرد
- `inventory_count_adjustments` - تعديلات الجرد

---

## 5. الأدوار والصلاحيات (RBAC)

| الدور | الصلاحيات |
|-------|-----------|
| **OWNER** | كل شيء |
| **MANAGER** | كل شيء ما عدا الإعدادات المتقدمة |
| **RECEPTIONIST** | الحجوزات، الزبائن، المركبات |
| **MECHANIC** | مهامه، اقتراح قطع، تحديث حالة |
| **ACCOUNTANT** | المحاسبة، القيود، التقارير المالية |
| **CASHIER** | الفواتير، المدفوعات، الصندوق |
| **SALES** | المخزون، الفواتير، الزبائن |

---

## 6. نظام المحاسبة الذكي (Automatic Accounting)

### قيود تلقائية:
| الحدث | القيد المحاسبي |
|-------|---------------|
| إنشاء حجز + دفع | دائن: الإيرادات / مدين: النقدية |
| شراء قطع غيار | دائن: الموردين / مدين: المخزون |
| صرف راتب | دائن: النقدية / مدين: المصاريف |
| استهلاك قطع للحجز | دائن: المخزون / مدين: تكلفة البضاعة المباعة |
| دفعة من زبون | دائن: الحجز / مدين: النقدية |

### ميزات المحاسبة:
- كل العمليات تولد قيود تلقائية
- التحقق من توازن القيود (debits = credits)
- دعم العملات المزدوجة (SYP + USD)
- تحويل تلقائي حسب سعر الصرف
- فترات مالية مغلقة (Closed Periods)
- تقارير: ميزانية عمومية، أرباح وخسائر، دفتر يومية

---

## 7. الميزات المتقدمة (Advanced Features)

### 7.1 نظام سحب وإدارة الصور (Attachments)
- جدول `attachments` للملفات
- دعم صور قطع الغيار، فواتير مشتركة، صور المركبات
- ربط مع MinIO (Docker service) أو AWS S3
- دعم توقيع الزبون إلكترونياً عند استلام السيارة

### 7.2 نظام الصيانة الدورية التلقائي (Auto Maintenance Reminders)
- جدول `maintenance_schedules`
- إشعارات تلقائية للزبون كل X كيلومتر أو X شهر
- مثال: كل 5000 كم تغيير زيت
- تتبع currentKm للمركبة

### 7.3 نظام نقاط الولاء (Loyalty Program)
- جدول `loyalty_points`
- جدول `loyalty_rewards`
- كل فاتورة تولد نقاط
- الزبون يستبدل النقاط بخصومات أو خدمات مجانية

### 7.4 نظام الضرائب الذكي (Tax Engine)
- ضريبة مضافة (VAT) لكل خدمة أو قطعة
- جدول `tax_rates`
- تقارير ضريبة القيمة المضافة
- دعم أنواع مختلفة من الضرائب

### 7.5 نظام مناوبات الميكانيكيين (Shift Management)
- جدول `mechanic_shifts`
- كل ميكانيكي له وردية
- commissions نسبة من الفاتورة
- تتبع أوقات العمل

### 7.6 نظام الإشعارات متعدد القنوات
- WebSocket (live)
- WhatsApp
- Push Notification (FCM للموبايل)
- SMS (اختياري)

### 7.7 نظام Activity Log متقدم
- `audit_logs` مع IP address، User-Agent، Action type
- إمكانية "التراجع عن عملية" (Undo action)
- تصفية وتصدير السجلات

### 7.8 نظام صلاحيات أكثر تفصيلاً
- Column-level permissions (أعمدة حساسة)
- Row-level permissions (ميكانيكي يرى فقط سياراته)
- دورات مخصصة

### 7.9 تقارير متقدمة + Export
- Export إلى PDF، Excel، CSV
- تقارير مخصصة (Custom Report Builder)
- Dashboard مع Charts تفاعلية (Chart.js في Flutter)

### 7.10 نظام الكاشير (Cash Drawer Management)
- جدول `cash_registers` (كل صندوق له موظف كاشير)
- جدول `cash_register_sessions` (فتح الجلسة - إغلاق الجلسة)
- كل عملية دفع ترتبط بجلسة الكاشير المفتوحة
- تقرير "تسوية الصندوق" (Cash Reconciliation)

### 7.11 نظام الخصومات والعروض (Promotions & Discounts)
- جدول `promotions` (عروض: خصم 10%، قطعة مجانية، خدمة مجانية)
- جدول `promotion_conditions` (متى ينفذ العرض)
- كود خصم (Coupon Code) لكل عرض
- تقرير أداء العروض

### 7.12 نظام المهام والملاحظات (Tasks & Notes)
- جدول `tasks` (مهمة: فحص سيارة، اتصال بزبون، شراء قطعة)
- جدول `task_assignments` (تعيين لموظف)
- جدول `notes` (ملاحظات عامة على الحجز، الزبون، المركبة)
- تواريخ استحقاق للمهام + تذكير عبر WhatsApp

### 7.13 نظام المركبات بشكل أعمق (Advanced Vehicle Management)
- قراءة عداد الكيلومترات عند دخول وخروج السيارة
- جدول `vehicle_mileage_log` (تسجيل كل قراءة)
- جدول `vehicle_issues` (مشاكل السيارة)
- جدول `vehicle_inspection_checklist` (قائمة فحص دورية)

### 7.14 نظام الموردين والمشتريات المتقدم
- جدول `purchase_orders` (أمر شراء للمورد)
- جدول `purchase_order_lines`
- جدول `grn` (إذن استلام بضاعة)
- مطابقة فاتورة المورد مع أمر الشراء (Three-way matching)

### 7.15 نظام التقسيط (Installments)
- جدول `installment_plans` (خطة تقسيط)
- جدول `installments` (كل دفعة)
- إشعارات WhatsApp قبل استحقاق الدفعة بيومين
- تقرير "ذمم زبائن" (Accounts Receivable Aging)

### 7.16 نظام السمعة والتقييم (Reviews & Ratings)
- جدول `reviews` (تقييم الزبون للمرآب: 1-5 نجوم)
- جدول `mechanic_ratings` (تقييم الميكانيكي بشكل منفصل)
- رابط تقييم يرسل عبر WhatsApp بعد إنهاء الحجز
- عرض التقييمات في Dashboard

### 7.17 نظام الوقت والمواعيد المتقدم
- جدول `time_slots` (فترات زمنية متاحة للحجز)
- منع حجز موعدين في نفس الوقت لنفس الميكانيكي
- إشعار تذكير قبل الموعد بـ 1 ساعة (WhatsApp)
- إعادة جدولة الموعد (Reschedule)

### 7.18 نظام الضمان (Warranty)
- جدول `warranties` (ضمان على خدمة أو قطعة)
- جدول `warranty_claims` (مطالبة ضمان من زبون)
- تحقق تلقائي من صلاحية الضمان عند تسجيل مشكلة
- تقرير ضمانات منتهية

### 7.19 نظام التكاليف الإضافية (Extra Charges)
- جدول `extra_charge_types` (سحب سيارة، تخزين يومي، عمالة إضافية)
- إضافة تكاليف إضافية للحجز بعد البدء فيه
- مراجعة من المدير قبل إضافة التكلفة

### 7.20 نظام الصيانة الوقائية (Preventive Maintenance)
- جدول `preventive_maintenance_templates` (قوالب صيانة معتمدة من الوكيل)
- جدول `preventive_maintenance_logs` (تسجيل تاريخ الصيانة الفعلية)
- جدول `maintenance_packages` (حزم صيانة جاهزة: زيت + فلتر زيت + فلتر هواء)
- تذكيرات متعددة: قبل 1000 كم، قبل 500 كم، عند الوصول
- تحذير من التأخير: إذا تعدى الموعد بأكثر من 1000 كم أو شهر
- تسجيل مع الصور والفواتير

### 7.21 نظام الشيكات (Cheque Management)
- جدول `cheques` (شيكات موردين صادرة، شيكات زبائن واردة)
- جدول `cheque_transactions` (تسجيل حركات الشيك)
- تتبع حالة الشيك: تحت التحصيل، مقبوض، مرتجع، مؤجل
- تاريخ استحقاق مع إشعارات قبل 3 أيام
- شيكات مرتجعة (Bounced) مع تسجيل رسوم إعادة الشيك
- تسوية الشيكات مع الفواتير
- القيود المحاسبية التلقائية:
  - استلام شيك من زبون → مدين: شيكات تحت التحصيل / دائن: الزبون
  - صرف شيك لمورد → مدين: المورد / دائن: شيكات تحت الدفع
  - تحصيل شيك نقداً → مدين: النقدية / دائن: شيكات تحت التحصيل
  - شيك مرتجع → مدين: الزبون / دائن: شيكات تحت التحصيل + مصاريف بنكية

### 7.22 نظام جرد المخزون (Inventory Counting)
- جدول `inventory_counts` (رأس الجرد: قائمة جرد)
- جدول `inventory_count_items` (تفاصيل كل قطعة)
- جدول `inventory_count_adjustments` (تعديلات بعد الجرد)
- جرد دوري أو مفاجئ
- تسجيل الكمية الفعلية يدوياً أو عبر Scanner
- تسجيل الفرق (Variance): فرق الكمية + فرق السعر
- تعديل المخزون تلقائياً مع إنشاء حركة تعديل
- تسوية محاسبية مع قيد تسوية الفرق
- إقرار الجرد من مدير المخزن + مدقق
- القيود المحاسبية:
  - زيادة في المخزون → مدين: المخزون / دائن: أرباح تسوية الجرد
  - نقص في المخزون → مدين: خسائر تسوية الجرد / دائن: المخزون

---

## 8. صفحة الزبون الديناميكية (Customer Page)

```
https://your-domain.com/track/{public_token}
```

- كل حجز له `public_token` فريد
- كل مركبة لها `public_car_id` فريد
- QR Code يحتوي على الرابط
- معلومات الحجز (الحالة، الخدمات، الفاتورة)
- معلومات المركبة
- لا يحتاج تسجيل دخول

---

## 8. خطة التنفيذ (Phase by Phase)

### Phase 1: Foundation (الأسبوع 1)
- [ ] إعداد السيرفر (Hetzner Ubuntu 22.04)
- [ ] حذف المشاريع القديمة
- [ ] تثبيت Docker, Docker Compose, PostgreSQL, Node.js, Nginx
- [ ] إعداد بنية المشروع (Git repos)
- [ ] Prisma Schema + Initial Migration
- [ ] Multi-tenancy setup (schema per tenant)
- [ ] Auth system (JWT + RBAC)

### Phase 2: Core Module (الأسابيع 2-3)
- [ ] Users & Roles CRUD
- [ ] Customers CRUD
- [ ] Vehicles CRUD
- [ ] Services CRUD
- [ ] Bookings CRUD + Workflow
- [ ] Mechanic Assignments
- [ ] Flutter Admin UI (Core Screens)

### Phase 3: Inventory & CRM (الأسابيع 4-5)
- [ ] Suppliers, Parts, Categories
- [ ] Warehouse Management
- [ ] Inventory Transactions
- [ ] Customer Frontend (HTML/JS + QR)

### Phase 4: Accounting (الأسابيع 6-7)
- [ ] Chart of Accounts
- [ ] Fiscal Periods
- [ ] Automatic Journal Entries
- [ ] Invoices & Payments
- [ ] Multi-currency (SYP + USD)
- [ ] Accounting Reports

### Phase 5: HR & Payroll (الأسابيع 8-9)
- [ ] Employees & Departments
- [ ] Attendance
- [ ] Payroll Calculation
- [ ] Salary Vouchers (Automatic JE)

### Phase 6: Advanced Features (الأسابيع 10-11)
- [x] Notifications (WebSockets) - ✅ COMPLETED in Phases 1-4
- [ ] WhatsApp Integration - Planned for Phase 6 (placeholder module created)
- [x] Dashboard & Analytics - ✅ COMPLETED in Phases 1-4
- [x] Reports Engine - ✅ COMPLETED in Phase 4
- [x] Mechanic Mobile App - ✅ COMPLETED in Phases 1-3

**ملاحظة هامة**: WhatsApp Integration تم تأجيله إلى Phase 6. حالياً جميع الاتصالات تتم عبر الهاتف/WhatsApp فقط (NO EMAILS). تم إنشاء وحدة `backend/src/modules/whatsapp/` كـ placeholder للتنفيذ المستقبلي.
- [ ] Windows Desktop Build

### Phase 7: Polish & Deploy (الأسبوع 12)
- [ ] Testing & Bug Fixing
- [ ] Performance Optimization
- [ ] Security Audit
- [ ] Docker Production Setup
- [ ] Deployment on Hetzner
- [ ] Documentation

---

## 9. الإعدادات على السيرفر (Hetzner Ubuntu 22.04)

```bash
# 1. Update & Clean
sudo apt update && sudo apt upgrade -y

# 2. Remove old projects
sudo rm -rf /old-project-paths

# 3. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 4. Install Docker Compose
sudo apt install docker-compose-plugin -y

# 5. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 6. Install PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install postgresql-16 -y

# 7. Install Nginx
sudo apt install nginx -y

# 8. Install Flutter (for builds)
sudo snap install flutter --classic

# 9. Tools
sudo apt install git certbot python3-certbot-nginx -y
```

---

## 10. Docker Compose (Production)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: garage_postgres
    environment:
      POSTGRES_USER: garage_admin
      POSTGRES_PASSWORD: STRONG_PASSWORD
      POSTGRES_DB: garage_master
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: garage_redis
    ports:
      - "127.0.0.1:6379:6379"
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    container_name: garage_minio
    environment:
      MINIO_ROOT_USER: garage_minio
      MINIO_ROOT_PASSWORD: STRONG_PASSWORD
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: garage_backend
    environment:
      DATABASE_URL: postgresql://garage_admin:STRONG_PASSWORD@postgres:5432/garage_master
      REDIS_URL: redis://redis:6379
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: garage_minio
      MINIO_SECRET_KEY: STRONG_PASSWORD
      MINIO_BUCKET: garage-files
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      PORT: 8080
      NODE_ENV: production
    depends_on:
      - postgres
      - redis
      - minio
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: garage_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./admin_frontend/build/web:/usr/share/nginx/html/admin
      - ./customer_frontend:/usr/share/nginx/html/customer
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: garage_prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: garage_grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: STRONG_PASSWORD
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  minio_data:
  prometheus_data:
  grafana_data:
```

---

## 11. الإضافات التقنية للأداء

| الإضافة | الفائدة |
|---------|---------|
| **Redis** | Session store, Caching, Rate limiting |
| **BullMQ** | Job queue للإشعارات والتقارير الثقيلة |
| **MinIO** | File storage للصور والملفات (بديل S3) |
| **Prometheus + Grafana** | مراقبة أداء السيرفر |
| **Firebase Admin (FCM)** | Push notifications للموبايل |
| **PDFKit** | Export إلى PDF |
| **ExcelJS** | Export إلى Excel/CSV |
| **Chart.js** | Charts تفاعلية في Flutter |

---

## 12. الميزات الإضافية (لاحقاً)

- [ ] **AI Analytics**: توقعات الإيرادات، تحليل النفقات
- [ ] **Voice Commands**: إضافة حجز بالصوت
- [ ] **Barcode/QR Scanner**: للمخزون
- [ ] **Mobile Payments**: تكامل مع بوابات دفع
- [ ] **Multi-branch**: فروع متعددة لنفس المرآب
- [ ] **Backup Automation**: pg_dump + S3
- [ ] **Elasticsearch**: بحث سريع متقدم (للحجوزات والزبائن)

---

## 12. الأسئلة المتبقية للمستخدم

1. هل لديك اسم نطاق (Domain) نستخدمه؟
2. ما هي أولوية البدء - هل نبدأ فوراً؟
3. هل تريد إعدادات Flutter Desktop للويندوز من البداية أم لاحقاً؟

---

## 13. تاريخ الإنشاء

- التاريخ: 2026-05-25
- الحالة: قيد التخطيط
