export const WIZARD_STEPS = [
  { id: 1, label: 'معلومات الشركة', icon: 'business' },
  { id: 2, label: 'الإعدادات المالية', icon: 'account_balance' },
  { id: 3, label: 'شجرة الحسابات', icon: 'account_tree' },
  { id: 4, label: 'الأصول الثابتة', icon: 'construction' },
  { id: 5, label: 'مراكز التكلفة', icon: 'pie_chart' },
  { id: 6, label: 'المستخدمون', icon: 'group' },
  { id: 7, label: 'المراجعة', icon: 'check_circle' },
]

function navButtons(isFirst: boolean, isLast: boolean): string {
  const nextLabel = isLast ? 'إكمال الإعداد' : 'التالي'
  const nextClass = isLast
    ? 'h-[48px] px-6 bg-tertiary text-on-tertiary font-body-lg rounded-lg shadow-sm hover:shadow-lg transition-all'
    : 'h-[48px] px-6 bg-primary text-on-primary font-body-lg rounded-lg shadow-sm hover:shadow-lg transition-all'
  return `
    <div class="flex justify-between pt-4 border-t border-border">
      ${!isFirst ? `<button id="btn-prev" class="h-[48px] px-6 bg-surface-subtle text-on-surface font-body-lg rounded-lg border border-border hover:bg-surface-container-low transition-colors">السابق</button>` : '<div></div>'}
      <button id="btn-next" class="${nextClass}">${nextLabel}</button>
    </div>
  `
}

export const step1Template = `
  <div class="space-y-6 page-enter">
    <div>
      <h1 class="font-beVietnamPro text-headline-md text-on-surface">معلومات الشركة</h1>
      <p class="text-body-md text-text-secondary mt-1">أدخل المعلومات الأساسية للمرآب أو الشركة</p>
    </div>
    <div class="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">اسم الشركة / المرآب <span class="text-error">*</span></label>
          <input id="step1-name" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="مثال: مرآب السرعة" />
        </div>
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">الاسم بالإنجليزية</label>
          <input id="step1-name-en" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="Speed Garage" dir="ltr" />
        </div>
      </div>
      <div>
        <label class="block font-label-sm text-text-tertiary mb-2">العنوان</label>
        <input id="step1-address" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="عنوان المرآب" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">رقم الهاتف</label>
          <input id="step1-phone" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="09xxxxxxxx" dir="ltr" />
        </div>
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">الرقم الضريبي</label>
          <input id="step1-tax" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="رقم التسجيل الضريبي" dir="ltr" />
        </div>
      </div>
    </div>
    <div class="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-4">
      <h3 class="font-headline-sm text-on-surface">إعدادات عامة</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">العملة الأساسية <span class="text-error">*</span></label>
          <select id="step1-currency" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none appearance-none">
            <option value="SYP">ليرة سورية (SYP)</option>
            <option value="USD" selected>دولار أمريكي (USD)</option>
            <option value="EUR">يورو (EUR)</option>
            <option value="AED">درهم إماراتي (AED)</option>
            <option value="SAR">ريال سعودي (SAR)</option>
          </select>
        </div>
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">المنطقة الزمنية</label>
          <select id="step1-timezone" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none appearance-none">
            <option value="Asia/Damascus" selected>دمشق</option>
            <option value="Asia/Dubai">دبي</option>
            <option value="Asia/Riyadh">الرياض</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">تنسيق التاريخ</label>
          <select id="step1-dateformat" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none appearance-none">
            <option value="DD/MM/YYYY" selected>DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
    ${navButtons(true, false)}
  </div>
`

export const step2Template = `
  <div class="space-y-6 page-enter">
    <div>
      <h1 class="font-beVietnamPro text-headline-md text-on-surface">الإعدادات المالية</h1>
      <p class="text-body-md text-text-secondary mt-1">إعدادات المحاسبة والعملة والفترات المالية</p>
    </div>
    <div class="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-4">
      <h3 class="font-headline-sm text-on-surface">أسعار الصرف والضرائب</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">سعر صرف العملة الأساسية <span class="text-error">*</span></label>
          <input id="step2-rate" type="number" step="0.01" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="15000" value="15000" dir="ltr" />
        </div>
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">نسبة الضريبة (%)</label>
          <input id="step2-tax" type="number" step="0.01" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="0" value="0" dir="ltr" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">نسبة Overhead العامة (%)</label>
          <input id="step2-overhead" type="number" step="0.1" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="10" value="10" dir="ltr" />
        </div>
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">ساعات العمل الشهرية</label>
          <input id="step2-hours" type="number" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="600" value="600" dir="ltr" />
        </div>
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">نسبة Overhead الخدمات (%)</label>
          <input id="step2-svc-overhead" type="number" step="0.1" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="0" value="0" dir="ltr" />
        </div>
      </div>
    </div>
    <div class="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-4">
      <h3 class="font-headline-sm text-on-surface">الفترة المالية الحالية</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">اسم الفترة</label>
          <input id="step2-fiscal-name" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="السنة المالية 2026" value="السنة المالية 2026" />
        </div>
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">تاريخ البداية</label>
          <input id="step2-fiscal-start" type="date" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" value="2026-01-01" dir="ltr" />
        </div>
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">تاريخ النهاية</label>
          <input id="step2-fiscal-end" type="date" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" value="2026-12-31" dir="ltr" />
        </div>
      </div>
    </div>
    <div class="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-4">
      <h3 class="font-headline-sm text-on-surface">إعدادات الفواتير</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">بادئة رقم الفاتورة</label>
          <input id="step2-prefix" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="INV" value="INV" dir="ltr" />
        </div>
        <div class="flex items-center gap-2 pt-8">
          <input id="step2-auto-num" type="checkbox" checked class="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
          <label for="step2-auto-num" class="font-body-md text-on-surface">توليد أرقام الفواتير تلقائياً</label>
        </div>
      </div>
    </div>
    ${navButtons(false, false)}
  </div>
`

export const step3Template = `
  <div class="space-y-6 page-enter">
    <div>
      <h1 class="font-beVietnamPro text-headline-md text-on-surface">شجرة الحسابات</h1>
      <p class="text-body-md text-text-secondary mt-1">سيتم إنشاء شجرة الحسابات الافتراضية تلقائياً</p>
    </div>
    <div class="bg-tertiary/5 border border-tertiary/20 rounded-xl p-6">
      <div class="flex items-start gap-3">
        <span class="material-symbols-outlined text-tertiary mt-0.5">info</span>
        <div>
          <p class="font-body-md text-on-surface">سيتم إنشاء شجرة الحسابات الكاملة تلقائياً بما فيها:</p>
          <ul class="mt-2 space-y-1 text-body-sm text-text-secondary list-disc pr-5">
            <li>الأصول المتداولة والثابتة (1xxx)</li>
            <li>الخصوم والالتزامات (2xxx)</li>
            <li>حقوق الملكية ورأس المال (3xxx)</li>
            <li>الإيرادات (4xxx)</li>
            <li>تكاليف البضاعة المباعة (5xxx)</li>
            <li>المصروفات التشغيلية والمالية (6xxx-7xxx)</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-4">
      <h3 class="font-headline-sm text-on-surface">الأرصدة الافتتاحية (اختياري)</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">رصيد النقدية الافتتاحي (SYP)</label>
          <input id="step3-syp" type="number" step="0.01" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="0" value="0" dir="ltr" />
        </div>
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">رصيد البنوك الافتتاحي (USD)</label>
          <input id="step3-usd" type="number" step="0.01" class="w-full h-[48px] bg-surface-subtle border border-border rounded-lg px-4 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="0" value="0" dir="ltr" />
        </div>
      </div>
    </div>
    <div class="flex items-center gap-3 bg-surface rounded-xl border border-border p-4">
      <input id="step3-confirm" type="checkbox" checked class="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
      <label for="step3-confirm" class="font-body-md text-on-surface cursor-pointer">إنشاء شجرة الحسابات الافتراضية</label>
    </div>
    ${navButtons(false, false)}
  </div>
`

export const step4Template = `
  <div class="space-y-6 page-enter">
    <div>
      <h1 class="font-beVietnamPro text-headline-md text-on-surface">فئات الأصول الثابتة</h1>
      <p class="text-body-md text-text-secondary mt-1">سيتم إنشاء فئات الأصول الافتراضية مع طرق الاستهلاك</p>
    </div>
    <div class="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
      <table class="w-full text-right">
        <thead class="bg-surface-subtle border-b border-border"><tr>
          <th class="px-4 py-3 font-label-sm text-text-tertiary">الفئة</th>
          <th class="px-4 py-3 font-label-sm text-text-tertiary">العمر الانتفاعي</th>
          <th class="px-4 py-3 font-label-sm text-text-tertiary">طريقة الاستهلاك</th>
          <th class="px-4 py-3 font-label-sm text-text-tertiary">نسبة الخردة</th>
        </tr></thead>
        <tbody class="divide-y divide-border">
          <tr><td class="px-4 py-3 font-body-md text-on-surface">المعدات والآلات</td><td class="px-4 py-3 text-text-secondary">10 سنوات</td><td class="px-4 py-3 text-text-secondary">القسط الثابت</td><td class="px-4 py-3 text-text-secondary">10%</td></tr>
          <tr><td class="px-4 py-3 font-body-md text-on-surface">المركبات</td><td class="px-4 py-3 text-text-secondary">5 سنوات</td><td class="px-4 py-3 text-text-secondary">القسط الثابت</td><td class="px-4 py-3 text-text-secondary">15%</td></tr>
          <tr><td class="px-4 py-3 font-body-md text-on-surface">الأثاث والتجهيزات</td><td class="px-4 py-3 text-text-secondary">7 سنوات</td><td class="px-4 py-3 text-text-secondary">القسط الثابت</td><td class="px-4 py-3 text-text-secondary">10%</td></tr>
          <tr><td class="px-4 py-3 font-body-md text-on-surface">المباني</td><td class="px-4 py-3 text-text-secondary">25 سنة</td><td class="px-4 py-3 text-text-secondary">القسط الثابت</td><td class="px-4 py-3 text-text-secondary">5%</td></tr>
          <tr><td class="px-4 py-3 font-body-md text-on-surface">أجهزة الكمبيوتر</td><td class="px-4 py-3 text-text-secondary">3 سنوات</td><td class="px-4 py-3 text-text-secondary">القسط المتناقص</td><td class="px-4 py-3 text-text-secondary">5%</td></tr>
        </tbody>
      </table>
    </div>
    <div class="flex items-center gap-3 bg-surface rounded-xl border border-border p-4">
      <input id="step4-confirm" type="checkbox" checked class="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
      <label for="step4-confirm" class="font-body-md text-on-surface cursor-pointer">إنشاء فئات الأصول الافتراضية</label>
    </div>
    ${navButtons(false, false)}
  </div>
`

export const step5Template = `
  <div class="space-y-6 page-enter">
    <div>
      <h1 class="font-beVietnamPro text-headline-md text-on-surface">مراكز التكلفة</h1>
      <p class="text-body-md text-text-secondary mt-1">سيتم إنشاء مراكز التكلفة الافتراضية للتوزيع</p>
    </div>
    <div class="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
      <table class="w-full text-right">
        <thead class="bg-surface-subtle border-b border-border"><tr>
          <th class="px-4 py-3 font-label-sm text-text-tertiary">المركز</th>
          <th class="px-4 py-3 font-label-sm text-text-tertiary">النوع</th>
          <th class="px-4 py-3 font-label-sm text-text-tertiary">الكود</th>
        </tr></thead>
        <tbody class="divide-y divide-border">
          <tr><td class="px-4 py-3 font-body-md text-on-surface">مركز المرآب الرئيسي</td><td class="px-4 py-3 text-text-secondary">تشغيلي</td><td class="px-4 py-3 text-text-secondary">CC-001</td></tr>
          <tr><td class="px-4 py-3 font-body-md text-on-surface">مركز الاستقبال</td><td class="px-4 py-3 text-text-secondary">إداري</td><td class="px-4 py-3 text-text-secondary">CC-002</td></tr>
          <tr><td class="px-4 py-3 font-body-md text-on-surface">مركز الإدارة</td><td class="px-4 py-3 text-text-secondary">إداري</td><td class="px-4 py-3 text-text-secondary">CC-003</td></tr>
          <tr><td class="px-4 py-3 font-body-md text-on-surface">مركز المخزن</td><td class="px-4 py-3 text-text-secondary">تشغيلي</td><td class="px-4 py-3 text-text-secondary">CC-004</td></tr>
          <tr><td class="px-4 py-3 font-body-md text-on-surface">مركز المحاسبة</td><td class="px-4 py-3 text-text-secondary">إداري</td><td class="px-4 py-3 text-text-secondary">CC-005</td></tr>
        </tbody>
      </table>
    </div>
    <div class="flex items-center gap-3 bg-surface rounded-xl border border-border p-4">
      <input id="step5-confirm" type="checkbox" checked class="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
      <label for="step5-confirm" class="font-body-md text-on-surface cursor-pointer">إنشاء مراكز التكلفة الافتراضية</label>
    </div>
    ${navButtons(false, false)}
  </div>
`

export const step6Template = `
  <div class="space-y-6 page-enter">
    <div>
      <h1 class="font-beVietnamPro text-headline-md text-on-surface">المستخدمون</h1>
      <p class="text-body-md text-text-secondary mt-1">أضف مستخدمي النظام الأساسيين</p>
    </div>
    <div class="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">الاسم الكامل <span class="text-error">*</span></label>
          <input id="user-fullName" class="w-full h-[44px] bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="اسم المستخدم" />
        </div>
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">رقم الموبايل <span class="text-error">*</span></label>
          <input id="user-phone" class="w-full h-[44px] bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="09xxxxxxxx" dir="ltr" />
        </div>
        <div>
          <label class="block font-label-sm text-text-tertiary mb-2">الدور</label>
          <select id="user-role" class="w-full h-[44px] bg-surface-subtle border border-border rounded-lg px-3 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none appearance-none">
            <option value="ADMIN">مدير</option>
            <option value="MANAGER">مسؤول</option>
            <option value="RECEPTIONIST" selected>استقبال</option>
            <option value="MECHANIC">ميكانيكي</option>
          </select>
        </div>
        <div class="flex items-end">
          <button id="add-user-btn" class="w-full h-[44px] bg-primary text-on-primary font-body-md rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[18px]">add</span> إضافة
          </button>
        </div>
      </div>
      <div id="users-list" class="space-y-2 hidden">
        <p class="font-label-sm text-text-tertiary">المستخدمون المضافون:</p>
        <div id="users-list-content" class="space-y-2"></div>
      </div>
    </div>
    ${navButtons(false, false)}
  </div>
`

export const step7Template = `
  <div class="space-y-6 page-enter">
    <div>
      <h1 class="font-beVietnamPro text-headline-md text-on-surface">المراجعة والإكمال</h1>
      <p class="text-body-md text-text-secondary mt-1">راجع الإعدادات قبل إكمال التفعيل</p>
    </div>
    <div class="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-3" id="review-content">
      <!-- filled dynamically -->
    </div>
    <div class="bg-tertiary/5 border border-tertiary/20 rounded-xl p-6">
      <div class="flex items-start gap-3">
        <span class="material-symbols-outlined text-tertiary mt-0.5">verified</span>
        <div>
          <p class="font-body-md text-on-surface font-bold">عند الضغط على "إكمال الإعداد" سيتم:</p>
          <ul class="mt-2 space-y-1 text-body-sm text-text-secondary list-disc pr-5">
            <li>حفظ جميع الإعدادات بشكل نهائي</li>
            <li>تفعيل النظام للاستخدام الكامل</li>
            <li>إنشاء الحسابات والأصول ومراكز التكلفة (إذا اخترت ذلك)</li>
            <li>إنشاء المستخدمين المضافين</li>
          </ul>
        </div>
      </div>
    </div>
    ${navButtons(false, true)}
  </div>
`
