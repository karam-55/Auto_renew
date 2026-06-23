import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
  } catch {
    // ignore
  }
  return '';
}

const warrantyTermsText = `تقدّم شركة Auto Renew كفالة محددة للمركبات وفق الشروط التالية، ويُعدّ استفادة العميل من الكفالة موافقة كاملة على جميع البنود المذكورة أدناه.

أولاً – شروط الاستفادة من الكفالة
لا يحق للمستفيد من الكفالة التعامل مع أي طرف آخر أو ورشة أو مركز صيانة خارج Auto Renew خلال مدة الكفالة.
في حال تم التعامل مع طرف ثالث، تُلغى الكفالة مباشرة عن المركبة دون أي تعويض.

الالتزام بمواعيد الصيانة الدورية المحددة من قبل الشركة.
الإبلاغ عن أي عطل فور ظهوره وعدم تأجيل الصيانة.

ثانياً – ما تشمله الكفالة
تشمل الكفالة الخدمات التالية ضمن المدة المحددة:

تغطية أعطال سوء التصنيع (Manufacturing Defects) التي تُثبت بعد الفحص الفني لدى Auto Renew.
تبديل زيت المحرك بأنواعه وفق المواصفات المعتمدة.
تبديل الإطارات ضمن الحالات المغطاة بالكفالة.
برمجة المركبة (تحديث البرامج).
الكوليات (Brake Pads).
أعمال كهرباء السيارات ضمن الأعطال المغطاة.

ثالثاً – ميزات الكفالة
أول تبديل زيت محرك مجاني بالكامل.
أول تحديث برامج مجاني.

رابعاً – حالات تُلغى فيها الكفالة
صيانة المركبة خارج Auto Renew.
استخدام قطع غير أصلية أو غير معتمدة.
إهمال الصيانة الدورية أو تجاهل الأعطال.
إجراء أي تعديل على المركبة دون موافقة الشركة.
ثبوت سوء الاستخدام أو التشغيل الخاطئ للمركبة.

خامساً – ملاحظات عامة
الكفالة غير قابلة للتحويل إلا بموافقة خطية من Auto Renew.
تسري الكفالة فقط على الأعطال المغطاة والمذكورة في هذا المستند.
تحتفظ الشركة بحق تعديل الشروط بما يتوافق مع سياسات العمل.`;

function generateHtml(warranty: any, dealer: any): string {
  const issueDate = warranty.createdAt
    ? new Date(warranty.createdAt).toLocaleDateString('ar-SY')
    : new Date().toLocaleDateString('ar-SY');
  const warrantyId = warranty.id.substring(0, 8).toUpperCase();
  const currencySymbol = warranty.currency === 'USD' ? '$' : 'ل.س';
  const logoData = getLogoBase64();

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>شهادة كفالة - Auto Renew</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
      padding: 40px;
      color: #000000;
      background: #fff;
      font-size: 11pt;
      line-height: 1.6;
    }
    .page {
      max-width: 210mm;
      margin: 0 auto;
      min-height: 277mm;
      position: relative;
      padding-bottom: 60px;
    }
    .top-border {
      border-top: 4px solid #E31E24;
      margin-bottom: 2px;
    }
    .top-border-thin {
      border-top: 1px solid #E31E24;
      margin-bottom: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
    }
    .logo-img {
      width: 80px;
      height: 80px;
      margin-bottom: 8px;
    }
    .company-name {
      font-size: 28pt;
      font-weight: 700;
      color: #000000;
      margin-bottom: 4px;
      letter-spacing: 2px;
    }
    .company-name-en {
      font-size: 14pt;
      font-weight: 600;
      color: #E31E24;
      margin-bottom: 8px;
      letter-spacing: 3px;
    }
    .title {
      font-size: 18pt;
      font-weight: 700;
      color: #000000;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 10pt;
      color: #333333;
      margin-bottom: 8px;
    }
    .meta {
      font-size: 9pt;
      color: #333333;
      text-align: center;
      margin-bottom: 4px;
    }
    .warranty-id {
      font-size: 10pt;
      color: #E31E24;
      font-weight: 600;
      text-align: center;
      margin-bottom: 20px;
    }
    .section {
      margin-bottom: 14px;
      border: 1px solid #E5E5E5;
      border-radius: 8px;
      overflow: hidden;
    }
    .section-title {
      background: #F5F5F5;
      padding: 8px 14px;
      font-size: 11pt;
      font-weight: 700;
      color: #E31E24;
      border-bottom: 1px solid #E5E5E5;
    }
    .section-body {
      padding: 10px 14px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dashed #F5F5F5;
    }
    .row:last-child {
      border-bottom: none;
    }
    .row-label {
      color: #333333;
      font-size: 10pt;
    }
    .row-value {
      color: #000000;
      font-weight: 600;
      font-size: 10pt;
      text-align: left;
      flex: 1;
      margin-right: 12px;
    }
    .terms {
      font-size: 8.5pt;
      color: #333333;
      line-height: 1.7;
      white-space: pre-line;
    }
    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      padding-top: 10px;
      border-top: 1px solid #E5E5E5;
    }
    .footer-text {
      font-size: 8.5pt;
      color: #666666;
    }
    .bottom-border {
      border-bottom: 1px solid #E31E24;
      margin-top: 2px;
    }
    .bottom-border-thick {
      border-bottom: 4px solid #E31E24;
    }
    @media print {
      body { padding: 0; }
      .page { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="top-border"></div>
    <div class="top-border-thin"></div>

    <div class="header">
      ${logoData ? `<img src="${logoData}" class="logo-img" alt="Auto Renew Logo" />` : ''}
      <div class="company-name-en">Auto Renew</div>
      <div class="title">شهادة كفالة مركبة</div>
      <div class="subtitle">Warranty Certificate</div>
    </div>

    <div class="meta">الوكيل: ${dealer?.companyName || dealer?.name || ''} | تاريخ الإصدار: ${issueDate}</div>
    <div class="warranty-id">رقم الكفالة: WARRANTY-${warrantyId}</div>

    <div class="section">
      <div class="section-title">معلومات العميل</div>
      <div class="section-body">
        <div class="row">
          <span class="row-label">الاسم:</span>
          <span class="row-value">${warranty.customerName || ''}</span>
        </div>
        <div class="row">
          <span class="row-label">رقم الهاتف:</span>
          <span class="row-value">${warranty.customerPhone || ''}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">معلومات المركبة</div>
      <div class="section-body">
        <div class="row">
          <span class="row-label">الشركة المصنعة:</span>
          <span class="row-value">${warranty.manufacturer || ''}</span>
        </div>
        <div class="row">
          <span class="row-label">الموديل:</span>
          <span class="row-value">${warranty.vehicleModel || ''}</span>
        </div>
        <div class="row">
          <span class="row-label">سنة الصنع:</span>
          <span class="row-value">${warranty.vehicleYear || ''}</span>
        </div>
        <div class="row">
          <span class="row-label">رقم الشاصيه:</span>
          <span class="row-value">${warranty.chassisNumber || ''}</span>
        </div>
        <div class="row">
          <span class="row-label">رقم اللوحة:</span>
          <span class="row-value">${warranty.plateNumber || ''}</span>
        </div>
        <div class="row">
          <span class="row-label">العداد:</span>
          <span class="row-value">${warranty.mileage || 0} كم</span>
        </div>
        <div class="row">
          <span class="row-label">اللون:</span>
          <span class="row-value">${warranty.color || ''}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">تفاصيل الكفالة</div>
      <div class="section-body">
        <div class="row">
          <span class="row-label">مدة الكفالة:</span>
          <span class="row-value">${warranty.durationMonths || 0} شهر</span>
        </div>
        <div class="row">
          <span class="row-label">تاريخ البدء:</span>
          <span class="row-value">${warranty.startDate ? new Date(warranty.startDate).toLocaleDateString('ar-SY') : ''}</span>
        </div>
        <div class="row">
          <span class="row-label">تاريخ الانتهاء:</span>
          <span class="row-value">${warranty.endDate ? new Date(warranty.endDate).toLocaleDateString('ar-SY') : ''}</span>
        </div>
        <div class="row">
          <span class="row-label">المبلغ المدفوع:</span>
          <span class="row-value">${warranty.amountPaid || 0} ${currencySymbol}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">الشروط والأحكام</div>
      <div class="section-body">
        <div class="terms">${warrantyTermsText.replace(/\n/g, '<br>')}</div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-text">هذه الشهادة صادرة إلكترونياً من نظام Auto Renew</div>
      <div class="footer-text">www.autorenew.sy | support@autorenew.sy</div>
    </div>

    <div class="bottom-border"></div>
    <div class="bottom-border-thick"></div>
  </div>
</body>
</html>
`;
}

export async function generateWarrantyPdf(
  warranty: any,
  dealer: any
): Promise<{ pdfPath: string; pdfUrl: string; base64: string }> {
  const pdfDir = path.join(process.cwd(), 'uploads', 'pdfs', 'warranties');
  fs.mkdirSync(pdfDir, { recursive: true });
  const pdfPathFile = path.join(pdfDir, `${warranty.id}.pdf`);
  const pdfUrl = `/uploads/pdfs/warranties/${warranty.id}.pdf`;

  const html = generateHtml(warranty, dealer);

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    await browser.close();

    fs.writeFileSync(pdfPathFile, pdfBuffer);

    return {
      pdfPath: pdfPathFile,
      pdfUrl,
      base64: pdfBuffer.toString('base64'),
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
