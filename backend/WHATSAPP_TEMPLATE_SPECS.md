# WhatChimp WhatsApp Templates - AUTO_Renew

This document lists all WhatsApp Business API templates that must be created in your WhatChimp / Meta WhatsApp Business Account dashboard for the system to work correctly.

> **Important**: Templates must be created in Arabic (`language: ar`) and approved by Meta before they can be used. While waiting for approval, the system will fall back to free-form text messages (works within 24h conversation window).

---

## 1. Welcome Message (for new customers)
**Template Name**: `welcome`
**Language**: Arabic (ar)
**Category**: UTILITY

**Body**: 
```
مرحباً {{1}}! 

أهلاً وسهلاً بك في {{2}}. نحن سعداء بانضمامك لعائلتنا ونتطلع لخدمة سيارتك على أفضل وجه.

يمكنك حجز موعد الصيانة في أي وقت عبر موقعنا أو بالاتصال بنا.
```

**Variables**:
- `{{1}}` = Customer Name
- `{{2}}` = Garage/Business Name

---

## 2. Booking Confirmation
**Template Name**: `booking_confirmation`
**Language**: Arabic (ar)
**Category**: UTILITY

**Body**:
```
مرحباً {{1}}،

تم استلام حجزك في {{2}} بنجاح.

رقم الحجز: {{3}}
المركبة: {{4}}
التاريخ: {{5}}

يمكنك متابعة حالة الحجز بمسح الكود QR المرفق أو عبر الرابط أدناه.

شكراً لثقتك بنا!
```

**Variables**:
- `{{1}}` = Customer Name
- `{{2}}` = Garage Name
- `{{3}}` = Booking ID / Number
- `{{4}}` = Vehicle Make + Model
- `{{5}}` = Scheduled Date

---

## 3. Booking Status Update
**Template Name**: `booking_status_update`
**Language**: Arabic (ar)
**Category**: UTILITY

**Body**:
```
مرحباً {{1}}،

تم تحديث حالة حجزك في {{2}}.

رقم الحجز: {{3}}
الحالة الجديدة: {{4}}
المركبة: {{5}}

يمكنك متابعة التفاصيل عبر رابط التتبع الخاص بك.
```

**Variables**:
- `{{1}}` = Customer Name
- `{{2}}` = Garage Name
- `{{3}}` = Booking ID
- `{{4}}` = Status (Arabic text: "جاري العمل", "جاهز للاستلام", "مكتمل", etc.)
- `{{5}}` = Vehicle Make + Model

---

## 4. Invoice Ready (with PDF)
**Template Name**: `invoice_new`
**Language**: Arabic (ar)
**Category**: UTILITY

**Body**:
```
مرحباً {{1}}،

فاتورتك جاهزة في {{2}}.

رقم الفاتورة: {{3}}
المجموع: {{4}} ل.س
تاريخ الاستحقاق: {{5}}

سيتم إرسال نسخة PDF من الفاتورة في الرسالة التالية.
```

**Variables**:
- `{{1}}` = Customer Name
- `{{2}}` = Garage Name
- `{{3}}` = Invoice Number
- `{{4}}` = Total Amount
- `{{5}}` = Due Date

---

## 5. Payment Received (with PDF)
**Template Name**: `payment_received`
**Language**: Arabic (ar)
**Category**: UTILITY

**Body**:
```
مرحباً {{1}}،

تم استلام دفعتك في {{2}} بنجاح.

رقم الفاتورة: {{3}}
المبلغ المدفوع: {{4}} ل.س

شكراً لك! نسخة PDF من الفاتورة المدفوعة مرفقة أدناه.
```

**Variables**:
- `{{1}}` = Customer Name
- `{{2}}` = Garage Name
- `{{3}}` = Invoice Number
- `{{4}}` = Total Paid Amount

---

## 6. Warranty Created (with PDF)
**Template Name**: `warranty_new`
**Language**: Arabic (ar)
**Category**: UTILITY

**Body**:
```
مرحباً {{1}}،

تم إنشاء كفالة جديدة لك في {{2}}.

رقم الكفالة: {{3}}
تاريخ الانتهاء: {{4}}

سيتم إرسال شهادة الكفالة PDF في الرسالة التالية.
```

**Variables**:
- `{{1}}` = Customer Name
- `{{2}}` = Garage/Dealer Name
- `{{3}}` = Warranty Number
- `{{4}}` = Expiry Date

---

## 7. Service Completed
**Template Name**: `service_completed`
**Language**: Arabic (ar)
**Category**: UTILITY

**Body**:
```
مرحباً {{1}}،

تم الانتهاء من صيانة سيارتك في {{2}}.

رقم الحجز: {{3}}
المركبة: {{4}}

سيارتك جاهزة للاستلام. نرجو تقييم خدمتنا عبر رابط التتبع.
```

**Variables**:
- `{{1}}` = Customer Name
- `{{2}}` = Garage Name
- `{{3}}` = Booking ID
- `{{4}}` = Vehicle Make + Model

---

## Backend Configuration

Add these environment variables to your `.env` file:

```env
# Watchimp WhatsApp API
WATCHIMP_ENABLED=true
WATCHIMP_API_KEY=your_watchimp_api_key
WATCHIMP_API_URL=https://app.whatchimp.com/api/v1
WATCHIMP_PHONE_NUMBER_ID=your_phone_number_id

# Public URL for PDF and tracking links
BASE_URL=https://your-domain.com
```

The `BASE_URL` must be publicly accessible because WhatChimp needs to download PDF documents from this URL.

---

## How to Create Templates in WhatChimp

1. Log in to your [WhatChimp Dashboard](https://app.whatchimp.com)
2. Go to **Templates** section
3. Click **Create New Template**
4. Enter the template name exactly as listed above (e.g., `booking_confirmation`)
5. Select language: **Arabic**
6. Copy the body text exactly (including variable placeholders like `{{1}}`)
7. Submit for approval
8. Wait for Meta approval (usually 1-24 hours)

> **Note**: Until templates are approved, the system will automatically use free-form text messages as a fallback.
