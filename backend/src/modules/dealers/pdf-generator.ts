import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const fontPath = path.join(__dirname, '../../../assets/fonts/Cairo-Regular.ttf');

// =============================================================================
// ARABIC RESHAPING - Converts Arabic chars to their Presentation Forms B
// =============================================================================

// Arabic letter mappings: [ISOLATED, FINAL, INITIAL, MEDIAL]
const arabicForms: Record<number, [number, number, number, number]> = {
  0x0621: [0xFE80, 0, 0, 0],
  0x0622: [0xFE81, 0xFE82, 0, 0],
  0x0623: [0xFE83, 0xFE84, 0, 0],
  0x0624: [0xFE85, 0xFE86, 0, 0],
  0x0625: [0xFE87, 0xFE88, 0, 0],
  0x0626: [0xFE89, 0xFE8A, 0xFE8B, 0xFE8C],
  0x0627: [0xFE8D, 0xFE8E, 0, 0],
  0x0628: [0xFE8F, 0xFE90, 0xFE91, 0xFE92],
  0x0629: [0xFE93, 0xFE94, 0, 0],
  0x062A: [0xFE95, 0xFE96, 0xFE97, 0xFE98],
  0x062B: [0xFE99, 0xFE9A, 0xFE9B, 0xFE9C],
  0x062C: [0xFE9D, 0xFE9E, 0xFE9F, 0xFEA0],
  0x062D: [0xFEA1, 0xFEA2, 0xFEA3, 0xFEA4],
  0x062E: [0xFEA5, 0xFEA6, 0xFEA7, 0xFEA8],
  0x062F: [0xFEA9, 0xFEAA, 0, 0],
  0x0630: [0xFEAB, 0xFEAC, 0, 0],
  0x0631: [0xFEAD, 0xFEAE, 0, 0],
  0x0632: [0xFEAF, 0xFEB0, 0, 0],
  0x0633: [0xFEB1, 0xFEB2, 0xFEB3, 0xFEB4],
  0x0634: [0xFEB5, 0xFEB6, 0xFEB7, 0xFEB8],
  0x0635: [0xFEB9, 0xFEBA, 0xFEBB, 0xFEBC],
  0x0636: [0xFEBD, 0xFEBE, 0xFEBF, 0xFEC0],
  0x0637: [0xFEC1, 0xFEC2, 0xFEC3, 0xFEC4],
  0x0638: [0xFEC5, 0xFEC6, 0xFEC7, 0xFEC8],
  0x0639: [0xFEC9, 0xFECA, 0xFECB, 0xFECC],
  0x063A: [0xFECD, 0xFECE, 0xFECF, 0xFED0],
  0x0640: [0x0640, 0x0640, 0x0640, 0x0640],
  0x0641: [0xFED1, 0xFED2, 0xFED3, 0xFED4],
  0x0642: [0xFED5, 0xFED6, 0xFED7, 0xFED8],
  0x0643: [0xFED9, 0xFEDA, 0xFEDB, 0xFEDC],
  0x0644: [0xFEDD, 0xFEDE, 0xFEDF, 0xFEE0],
  0x0645: [0xFEE1, 0xFEE2, 0xFEE3, 0xFEE4],
  0x0646: [0xFEE5, 0xFEE6, 0xFEE7, 0xFEE8],
  0x0647: [0xFEE9, 0xFEEA, 0xFEEB, 0xFEEC],
  0x0648: [0xFEED, 0xFEEE, 0, 0],
  0x0649: [0xFEEF, 0xFEF0, 0, 0],
  0x064A: [0xFEF1, 0xFEF2, 0xFEF3, 0xFEF4],
};

const LAM_ALEF_LIGATURES: Record<number, [number, number]> = {
  0x0622: [0xFEF5, 0xFEF6],
  0x0623: [0xFEF7, 0xFEF8],
  0x0625: [0xFEF9, 0xFEFA],
  0x0627: [0xFEFB, 0xFEFC],
};

function isArabicChar(charCode: number): boolean {
  return arabicForms[charCode] !== undefined;
}

function isRightJoining(charCode: number): boolean {
  const nonConnecting = [
    0x0621, 0x0622, 0x0623, 0x0624, 0x0625, 0x0627, 0x062F,
    0x0630, 0x0631, 0x0632, 0x0648, 0x0649
  ];
  return isArabicChar(charCode) && !nonConnecting.includes(charCode);
}

function reshapeText(text: string): string {
  const chars = Array.from(text);
  const result: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const charCode = chars[i].charCodeAt(0);

    if (!isArabicChar(charCode)) {
      result.push(chars[i]);
      continue;
    }

    const forms = arabicForms[charCode];
    if (!forms) {
      result.push(chars[i]);
      continue;
    }

    const prevCharCode = i > 0 ? chars[i - 1].charCodeAt(0) : null;
    const nextCharCode = i < chars.length - 1 ? chars[i + 1].charCodeAt(0) : null;

    const hasLeftJoin = prevCharCode !== null && isRightJoining(prevCharCode);
    const hasRightJoin = nextCharCode !== null && isArabicChar(nextCharCode);

    if (charCode === 0x0644 && nextCharCode !== null && LAM_ALEF_LIGATURES[nextCharCode]) {
      const isFinal = !hasRightJoin || !isArabicChar(nextCharCode);
      const ligature = LAM_ALEF_LIGATURES[nextCharCode];
      result.push(String.fromCharCode(isFinal ? ligature[1] : ligature[0]));
      i++;
      continue;
    }

    let selectedForm: number;
    if (hasLeftJoin && hasRightJoin) {
      selectedForm = forms[3] || forms[0];
    } else if (hasLeftJoin) {
      selectedForm = forms[1] || forms[0];
    } else if (hasRightJoin) {
      selectedForm = forms[2] || forms[0];
    } else {
      selectedForm = forms[0];
    }

    result.push(String.fromCharCode(selectedForm));
  }

  return result.join('');
}

function reverseWords(text: string): string {
  return text.split(/(\s+)/).reverse().join('');
}

function ar(text: string | null | undefined): string {
  if (!text) return '';
  const reshaped = reshapeText(text);
  return reverseWords(reshaped);
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

function setArabicFont(doc: any): void {
  if (fs.existsSync(fontPath)) {
    doc.registerFont('Cairo', fontPath);
    doc.font('Cairo');
  }
}

export async function generateWarrantyPdf(
  warranty: any,
  dealer: any
): Promise<{ pdfPath: string; pdfUrl: string; base64: string }> {
  const pdfDir = path.join(process.cwd(), 'uploads', 'pdfs', 'warranties');
  fs.mkdirSync(pdfDir, { recursive: true });
  const pdfPathFile = path.join(pdfDir, `${warranty.id}.pdf`);
  const pdfUrl = `/uploads/pdfs/warranties/${warranty.id}.pdf`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(pdfPathFile);
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.pipe(stream);

    setArabicFont(doc);

    const primaryColor = '#1E40AF';
    const darkText = '#1E293B';
    const mediumText = '#475569';
    const lightGray = '#E2E8F0';

    // Top border
    doc.moveTo(50, 60).lineTo(545, 60).strokeColor(primaryColor).lineWidth(4).stroke();
    doc.moveTo(50, 65).lineTo(545, 65).strokeColor(primaryColor).lineWidth(1).stroke();

    // Header
    doc.fontSize(28).fillColor(primaryColor).text(ar('Auto Renew'), 50, 80, {
      align: 'center',
      width: 495,
    });

    doc.fontSize(20).fillColor(darkText).text(ar('شهادة كفالة مركبة'), 50, 115, {
      align: 'center',
      width: 495,
    });

    doc.fontSize(11).fillColor(mediumText).text(ar('Warranty Certificate'), 50, 140, {
      align: 'center',
      width: 495,
    });

    // Dealer info
    doc.fontSize(10).fillColor(mediumText);
    const issueDate = warranty.createdAt
      ? new Date(warranty.createdAt).toLocaleDateString('ar-SY')
      : new Date().toLocaleDateString('ar-SY');

    doc.text(ar(`الوكيل: ${dealer?.companyName || dealer?.name || ''} | تاريخ الإصدار: ${issueDate}`), {
      align: 'center',
    });

    doc.moveDown(1);

    // Warranty ID
    const warrantyId = warranty.id.substring(0, 8).toUpperCase();
    doc.fontSize(10).fillColor(primaryColor).text(ar(`رقم الكفالة: WARRANTY-${warrantyId}`), {
      align: 'center',
    });

    doc.moveDown(1.5);

    // Helper functions
    const drawSection = (title: string, y: number, contentFn: () => void) => {
      const sectionWidth = 495;
      const startX = 50;

      doc.rect(startX, y, sectionWidth, 18).fill('#F1F5F9');

      doc.fontSize(12).fillColor(primaryColor).text(ar(title), startX + 10, y + 3, {
        align: 'right',
        width: sectionWidth - 20,
      });

      contentFn();

      const endY = doc.y;
      doc.moveTo(startX, endY + 5).lineTo(startX + sectionWidth, endY + 5).stroke(lightGray);

      return endY + 10;
    };

    const drawRow = (label: string, value: string) => {
      doc.fontSize(10).fillColor(mediumText).text(ar(`${label}:`), { align: 'right', continued: false });
      doc.fontSize(10).fillColor(darkText).text(ar(value), { align: 'right' });
      doc.moveDown(0.2);
    };

    // Customer Section
    let currentY = doc.y;
    currentY = drawSection('معلومات العميل', currentY, () => {
      doc.moveDown(0.3);
      drawRow('الاسم', warranty.customerName || '');
      drawRow('رقم الهاتف', warranty.customerPhone || '');
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);

    // Vehicle Section
    currentY = doc.y;
    currentY = drawSection('معلومات المركبة', currentY, () => {
      doc.moveDown(0.3);
      drawRow('الشركة المصنعة', warranty.manufacturer || '');
      drawRow('الموديل', warranty.vehicleModel || '');
      drawRow('سنة الصنع', String(warranty.vehicleYear || ''));
      drawRow('رقم الشاصيه', warranty.chassisNumber || '');
      drawRow('رقم اللوحة', warranty.plateNumber || '');
      drawRow('العداد', `${warranty.mileage || 0} كم`);
      drawRow('اللون', warranty.color || '');
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);

    // Warranty Details Section
    currentY = doc.y;
    currentY = drawSection('تفاصيل الكفالة', currentY, () => {
      doc.moveDown(0.3);
      drawRow('مدة الكفالة', `${warranty.durationMonths || 0} شهر`);
      drawRow('تاريخ البدء', warranty.startDate ? new Date(warranty.startDate).toLocaleDateString('ar-SY') : '');
      drawRow('تاريخ الانتهاء', warranty.endDate ? new Date(warranty.endDate).toLocaleDateString('ar-SY') : '');
      drawRow('المبلغ المدفوع', `${warranty.amountPaid || 0} ${warranty.currency === 'USD' ? '$' : 'ل.س'}`);
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);

    // Terms Section
    currentY = doc.y;
    drawSection('الشروط والأحكام', currentY, () => {
      doc.moveDown(0.3);
      doc.fontSize(8).fillColor(mediumText).text(ar(warrantyTermsText), {
        align: 'right',
        lineGap: 2,
      });
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);

    // Footer
    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke(lightGray);

    doc.moveDown(0.5);
    doc.fontSize(9).fillColor(mediumText).text(ar('هذه الشهادة صادرة إلكترونياً من نظام Auto Renew'), {
      align: 'center',
    });
    doc.fontSize(8).fillColor(mediumText).text(ar('www.autorenew.sy | support@autorenew.sy'), {
      align: 'center',
    });

    // Bottom border
    doc.moveTo(50, 780).lineTo(545, 780).strokeColor(primaryColor).lineWidth(4).stroke();
    doc.moveTo(50, 775).lineTo(545, 775).strokeColor(primaryColor).lineWidth(1).stroke();

    doc.end();

    stream.on('finish', () => {
      const buffer = Buffer.concat(chunks);
      const base64 = buffer.toString('base64');
      resolve({ pdfPath: pdfPathFile, pdfUrl, base64 });
    });
    stream.on('error', reject);
  });
}
