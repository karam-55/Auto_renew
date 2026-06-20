# 🚀 دليل النشر على Hetzner

## المتطلبات
- سيرفر Hetzner بـ Ubuntu 22.04
- IP ثابت
- SSH Access (root أو sudo user)
- (اختياري) Domain name للـ SSL

---

## 📋 الخطوات

### 1. تجهيز ملفات المشروع محلياً

#### أ. بناء الـ Backend:
```bash
cd backend
npm install
npm run build
```

#### ب. التأكد من وجود الملفات:
- `deploy/docker-compose.prod.yml` ✅
- `deploy/nginx.conf` ✅
- `deploy/.env.production` ✅
- `deploy/deploy.sh` ✅
- `backend/Dockerfile` ✅
- `backend/package.json` ✅
- `customer_frontend/` ✅
- `evolution-api-main/evolution-api-main/` ✅

> **ملاحظة:** Admin Frontend (Tauri Desktop App) يركب على جهاز المستخدم محلياً ويتصل بالـ API على السيرفر.

---

### 2. نقل الملفات للسيرفر

#### الخيار أ: بـ SCP (أفضل)
```bash
# من جهازك المحلي (PowerShell أو Terminal)
scp -r deploy/ backend/ customer_frontend/ evolution-api-main/ root@YOUR_SERVER_IP:/opt/auto-renew/
```

#### الخيار ب: بـ WinSCP (واجهة رسومية)
1. حمل WinSCP
2. اتصل بالسيرفر بالـ IP
3. انقل المجلدات إلى `/opt/auto-renew/`

---

### 3. إعداد السيرفر

#### أ. سجل دخول:
```bash
ssh root@YOUR_SERVER_IP
```

#### ب. نفذ سكريبت الـ Deploy:
```bash
cd /opt/auto-renew/deploy
chmod +x deploy.sh
sudo ./deploy.sh
```

هذا السكريبت رح يعمل:
1. تحديث النظام
2. تثبيت Docker
3. تثبيت Nginx
4. إعداد Firewall
5. توليد باسوردات عشوائية
6. بناء و تشغيل الخدمات

---

### 4. بعد الـ Deploy

#### أ. شغل migrations:
```bash
cd /opt/auto-renew/deploy
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

#### ب. إنشاء حساب admin أولي (إذا بدك):
```bash
docker compose -f docker-compose.prod.yml exec backend node -e "
// هون بتضيف seed script
"
```

---

### 5. إعداد WhatsApp (Evolution API)

#### أ. افتح الرابط:
```
http://YOUR_SERVER_IP:8081
```

#### ب. أنشئ Instance:
```bash
# أو عبر API:
curl -X POST http://YOUR_SERVER_IP:8081/instance/create \
  -H "apikey: YOUR_EVO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "garage", "qrcode": true}'
```

#### ج. اربط رقم الواتساب (scan QR code)

---

### 6. إضافة Domain + SSL (اختياري)

#### أ. حدث `deploy/.env`:
```
CORS_ORIGIN=https://yourdomain.com
```

#### ب. شغل Certbot:
```bash
sudo certbot --nginx -d yourdomain.com
```

#### ج. فعل HTTPS block في nginx.conf

---

## 🔧 أدوات مفيدة

### مراقبة اللوقز:
```bash
# كل الخدمات
docker compose -f docker-compose.prod.yml logs -f

# خدمة معينة
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f evolution-api
```

### إعادة تشغيل خدمة:
```bash
docker compose -f docker-compose.prod.yml restart backend
```

### تحديث الكود:
```bash
cd /opt/auto-renew/deploy
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### نسخة احتياطية للـ DB:
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U garage_admin garage_master > backup_$(date +%Y%m%d).sql
```

---

## ⚠️ أمان مهم

1. **غيّر كل الباسوردات الافتراضية**
2. **احفظ ملف `.env` بمكان آمن**
3. **افتح port 22 (SSH) بس للـ IPs الموثوقة**
4. **فعّل 2FA على SSH**
5. **حدّث النظام باستمرار:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## 📞 دعم

إذا واجهت مشاكل، افحص:
1. `docker compose -f docker-compose.prod.yml ps` — هل كل الخدمات شغالة؟
2. `docker compose -f docker-compose.prod.yml logs backend` — هل في أخطاء؟
3. `sudo nginx -t` — هل Nginx مظبوط؟
4. `sudo ufw status` — هل Firewall مفتوح للـ ports المطلوبة؟
