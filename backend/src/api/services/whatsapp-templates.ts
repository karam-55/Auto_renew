export interface WhatsAppTemplate {
  name: string;
  ar: string;
  variables: string[];
}

export const WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplate> = {
  booking_created: {
    name: 'booking_created',
    ar: 'تم استلام طلبك رقم {{bookingId}}. سيتم التواصل معك قريباً.',
    variables: ['bookingId'],
  },
  booking_approved: {
    name: 'booking_approved',
    ar: 'تم تأكيد موعدك بتاريخ {{date}} الساعة {{time}}.',
    variables: ['date', 'time'],
  },
  booking_cancelled: {
    name: 'booking_cancelled',
    ar: 'تم إلغاء حجزك رقم {{bookingId}}. للتواصل معنا، يرجى الاتصال على {{phone}}.',
    variables: ['bookingId', 'phone'],
  },
  technician_assigned: {
    name: 'technician_assigned',
    ar: 'تم تعيين الفني {{technicianName}} لخدمتك.',
    variables: ['technicianName'],
  },
  estimated_start_time: {
    name: 'estimated_start_time',
    ar: 'من المتوقع بدء العمل على سيارتك بتاريخ {{date}} الساعة {{time}}.',
    variables: ['date', 'time'],
  },
  estimated_completion_time: {
    name: 'estimated_completion_time',
    ar: 'من المتوقع الانتهاء من العمل بتاريخ {{date}} الساعة {{time}}.',
    variables: ['date', 'time'],
  },
  work_started: {
    name: 'work_started',
    ar: 'بدأ الفني {{technicianName}} العمل على سيارتك.',
    variables: ['technicianName'],
  },
  work_completed: {
    name: 'work_completed',
    ar: 'تم الانتهاء من العمل على سيارتك. يمكنك استلامها الآن.',
    variables: [],
  },
  fault_discovered: {
    name: 'fault_discovered',
    ar: 'تم اكتشاف عطل جديد: {{faultTitle}}. هل ترغب بالموافقة على الإصلاح؟',
    variables: ['faultTitle'],
  },
  fault_approved: {
    name: 'fault_approved',
    ar: 'تمت الموافقة على إصلاح: {{faultTitle}}.',
    variables: ['faultTitle'],
  },
  fault_rejected: {
    name: 'fault_rejected',
    ar: 'تم رفض إصلاح: {{faultTitle}}.',
    variables: ['faultTitle'],
  },
  invoice_ready: {
    name: 'invoice_ready',
    ar: 'فاتورتك جاهزة. المجموع: {{total}}. رابط الفاتورة: {{invoiceUrl}}',
    variables: ['total', 'invoiceUrl'],
  },
  payment_received: {
    name: 'payment_received',
    ar: 'تم استلام دفعتك بمبلغ {{amount}}. شكراً لك.',
    variables: ['amount'],
  },
  next_service_due: {
    name: 'next_service_due',
    ar: 'حان موعد الصيانة الدورية لسيارتك. يرجى حجز موعد.',
    variables: [],
  },
  recommendation_due: {
    name: 'recommendation_due',
    ar: 'نوصي بإجراء {{serviceName}} لسيارتك قريباً.',
    variables: ['serviceName'],
  },
  low_stock_alert: {
    name: 'low_stock_alert',
    ar: 'تنبيه: المخزون من {{partName}} منخفض. الكمية الحالية: {{quantity}}.',
    variables: ['partName', 'quantity'],
  },
  purchase_order_received: {
    name: 'purchase_order_received',
    ar: 'تم استلام طلب الشراء رقم {{orderNumber}} من المورد {{supplierName}}.',
    variables: ['orderNumber', 'supplierName'],
  },
  membership_purchased: {
    name: 'membership_purchased',
    ar: 'تم تفعيل عضويتك {{planName}}. صالحة حتى {{endDate}}.',
    variables: ['planName', 'endDate'],
  },
  membership_expiring: {
    name: 'membership_expiring',
    ar: 'تنبيه: عضويتك {{planName}} ستنتهي بتاريخ {{endDate}}.',
    variables: ['planName', 'endDate'],
  },
  membership_expired: {
    name: 'membership_expired',
    ar: 'انتهت عضويتك {{planName}}. قم بتجديدها للاستمرار في الاستفادة من المزايا.',
    variables: ['planName'],
  },
  points_earned: {
    name: 'points_earned',
    ar: 'ربحت {{points}} نقطة جديدة. رصيدك الحالي: {{currentPoints}} نقطة.',
    variables: ['points', 'currentPoints'],
  },
  points_redeemed: {
    name: 'points_redeemed',
    ar: 'تم استخدام {{points}} نقطة في فاتورتك. رصيدك الحالي: {{currentPoints}} نقطة.',
    variables: ['points', 'currentPoints'],
  },
};

export function renderTemplate(templateName: string, variables: Record<string, string>): string {
  const template = WHATSAPP_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }

  let message = template.ar;
  template.variables.forEach((variable) => {
    const value = variables[variable] || '';
    message = message.replace(new RegExp(`{{${variable}}}`, 'g'), value);
  });

  return message;
}
