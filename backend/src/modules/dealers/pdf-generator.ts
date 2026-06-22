import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Handle both ESM and CJS exports for arabic-reshaper
const arabicReshaperModule = require('arabic-reshaper');
const arabicReshaper = arabicReshaperModule.default || arabicReshaperModule;

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

const fontPath = path.join(__dirname, '../../../assets/fonts/Cairo-Regular.ttf');

function setArabicFont(doc: any): void {
  if (fs.existsSync(fontPath)) {
    doc.registerFont('Cairo', fontPath);
    doc.font('Cairo');
  }
}

/** Prepare Arabic text for PDF: reshape letters + reverse word order for RTL */
function ar(text: string): string {
  if (!text) return '';
  const reshapeFn = arabicReshaper && (arabicReshaper.reshape || (arabicReshaper.default && arabicReshaper.default.reshape));
  if (!reshapeFn) {
    // Fallback: just reverse word order if reshape is unavailable
    return text.split(/\s+/).reverse().join(' ');
  }
  const words = text.split(/\s+/);
  const reshaped = words.map((w) => reshapeFn(w));
  return reshaped.reverse().join(' ');
}

export async function generateWarrantyPdf(warranty: any, dealer: any): Promise<{ pdfPath: string; pdfUrl: string; base64: string }> {
  const pdfDir = path.join(process.cwd(), 'uploads', 'pdfs', 'warranties');
  fs.mkdirSync(pdfDir, { recursive: true });
  const pdfPathFile = path.join(pdfDir, `${warranty.id}.pdf`);
  const pdfUrl = `/uploads/pdfs/warranties/${warranty.id}.pdf`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(pdfPathFile);
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.pipe(stream);

    setArabicFont(doc);

    // Helper to write Arabic text aligned right
    const writeAr = (size: number, text: string, opts?: any) => {
      doc.fontSize(size).text(ar(text), { align: 'right', ...opts });
    };

    writeAr(24, 'Auto Renew', { align: 'center' });
    writeAr(18, 'شهادة كفالة المركبات', { align: 'center' });
    doc.moveDown(2);

    writeAr(12, `الوكيل: ${dealer?.name || ''} - ${dealer?.companyName || ''}`);
    writeAr(12, `تاريخ الإصدار: ${new Date(warranty.startDate).toLocaleDateString('ar-SY')}`);
    doc.moveDown(1);

    writeAr(16, 'معلومات العميل', { underline: true });
    writeAr(12, `الاسم: ${warranty.customerName}`);
    writeAr(12, `رقم الهاتف: ${warranty.customerPhone}`);
    doc.moveDown(1);

    writeAr(16, 'معلومات المركبة', { underline: true });
    writeAr(12, `الشركة المصنعة: ${warranty.manufacturer}`);
    writeAr(12, `الموديل: ${warranty.vehicleModel}`);
    writeAr(12, `سنة الصنع: ${warranty.vehicleYear}`);
    writeAr(12, `رقم الشاصيه: ${warranty.chassisNumber}`);
    writeAr(12, `رقم اللوحة: ${warranty.plateNumber}`);
    writeAr(12, `العداد: ${warranty.mileage} كم`);
    writeAr(12, `اللون: ${warranty.color}`);
    doc.moveDown(1);

    writeAr(16, 'تفاصيل الكفالة', { underline: true });
    writeAr(12, `المدة: ${warranty.durationMonths} شهر`);
    writeAr(12, `تاريخ البدء: ${new Date(warranty.startDate).toLocaleDateString('ar-SY')}`);
    writeAr(12, `تاريخ الانتهاء: ${new Date(warranty.endDate).toLocaleDateString('ar-SY')}`);
    writeAr(12, `المبلغ المدفوع: ${warranty.amountPaid} ل.س`);
    doc.moveDown(2);

    writeAr(14, 'شروط الكفالة', { underline: true });
    writeAr(10, warrantyTermsText);
    doc.moveDown(2);

    writeAr(10, 'هذه الشهادة صادرة إلكترونياً من نظام Auto Renew', { align: 'center' });
    writeAr(10, `رقم الكفالة: ${warranty.id}`, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      const buffer = Buffer.concat(chunks);
      const base64 = buffer.toString('base64');
      resolve({ pdfPath: pdfPathFile, pdfUrl, base64 });
    });
    stream.on('error', reject);
  });
}
