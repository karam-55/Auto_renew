import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

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

export async function generateWarrantyPdf(warranty: any, dealer: any): Promise<{ pdfPath: string; pdfUrl: string; base64: string }> {
  const pdfDir = path.join(process.cwd(), 'uploads', 'pdfs', 'warranties');
  fs.mkdirSync(pdfDir, { recursive: true });
  const pdfPath = path.join(pdfDir, `${warranty.id}.pdf`);
  const pdfUrl = `/uploads/pdfs/warranties/${warranty.id}.pdf`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(pdfPath);
    const chunks: Buffer[] = [];

    // Collect for base64
    doc.on('data', (chunk) => chunks.push(chunk));

    doc.pipe(stream);

    // Header
    doc.fontSize(24).text('Auto Renew', { align: 'center' });
    doc.fontSize(18).text('شهادة كفالة المركبات', { align: 'center' });
    doc.moveDown(2);

    // Dealer Info
    doc.fontSize(12).text(`الوكيل: ${dealer?.name || ''} - ${dealer?.companyName || ''}`);
    doc.fontSize(12).text(`تاريخ الإصدار: ${new Date(warranty.startDate).toLocaleDateString('ar-SY')}`);
    doc.moveDown(1);

    // Customer Info
    doc.fontSize(16).text('معلومات العميل', { underline: true });
    doc.fontSize(12).text(`الاسم: ${warranty.customerName}`);
    doc.fontSize(12).text(`رقم الهاتف: ${warranty.customerPhone}`);
    doc.moveDown(1);

    // Vehicle Info
    doc.fontSize(16).text('معلومات المركبة', { underline: true });
    doc.fontSize(12).text(`الشركة المصنعة: ${warranty.manufacturer}`);
    doc.fontSize(12).text(`الموديل: ${warranty.vehicleModel}`);
    doc.fontSize(12).text(`سنة الصنع: ${warranty.vehicleYear}`);
    doc.fontSize(12).text(`رقم الشاصيه: ${warranty.chassisNumber}`);
    doc.fontSize(12).text(`رقم اللوحة: ${warranty.plateNumber}`);
    doc.fontSize(12).text(`العداد: ${warranty.mileage} كم`);
    doc.fontSize(12).text(`اللون: ${warranty.color}`);
    doc.moveDown(1);

    // Warranty Info
    doc.fontSize(16).text('تفاصيل الكفالة', { underline: true });
    doc.fontSize(12).text(`المدة: ${warranty.durationMonths} شهر`);
    doc.fontSize(12).text(`تاريخ البدء: ${new Date(warranty.startDate).toLocaleDateString('ar-SY')}`);
    doc.fontSize(12).text(`تاريخ الانتهاء: ${new Date(warranty.endDate).toLocaleDateString('ar-SY')}`);
    doc.fontSize(12).text(`المبلغ المدفوع: ${warranty.amountPaid} ل.س`);
    doc.moveDown(2);

    // Terms
    doc.fontSize(14).text('شروط الكفالة', { underline: true });
    doc.fontSize(10).text(warrantyTermsText, { align: 'right' });
    doc.moveDown(2);

    // Footer
    doc.fontSize(10).text('هذه الشهادة صادرة إلكترونياً من نظام Auto Renew', { align: 'center' });
    doc.fontSize(10).text(`رقم الكفالة: ${warranty.id}`, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      const buffer = Buffer.concat(chunks);
      const base64 = buffer.toString('base64');
      resolve({ pdfPath, pdfUrl, base64 });
    });
    stream.on('error', reject);
  });
}
