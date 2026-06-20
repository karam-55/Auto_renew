import { AccountType } from '@prisma/client';

export interface SetupStep1Company {
  companyName: string;
  companyNameAr?: string;
  companyNameEn?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  taxNumber?: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

export interface SetupStep2Financial {
  exchangeRate: number;
  taxRate: number;
  overheadPercentage: number;
  monthlyWorkingHours: number;
  serviceOverheadPercent: number;
  invoicePrefix: string;
  autoGenerateInvoiceNumber: boolean;
  fiscalPeriodName: string;
  fiscalStartDate: string; // ISO date
  fiscalEndDate: string;   // ISO date
}

export interface SetupStep3ChartOfAccounts {
  createDefaultAccounts: boolean;
  openingBalanceSYP?: number;
  openingBalanceUSD?: number;
}

export interface SetupStep4AssetCategories {
  createDefaultCategories: boolean;
}

export interface SetupStep5CostCenters {
  createDefaultCenters: boolean;
}

export interface SetupStep6Users {
  users: {
    fullName: string;
    username: string;
    password: string;
    phone: string;
    role: string;
  }[];
}

export interface SetupWizardStatus {
  setupCompleted: boolean;
  setupStep: number;
  companyName?: string;
}

export interface SetupWizardCompletePayload {
  step1?: SetupStep1Company;
  step2?: SetupStep2Financial;
  step3?: SetupStep3ChartOfAccounts;
  step4?: SetupStep4AssetCategories;
  step5?: SetupStep5CostCenters;
  step6?: SetupStep6Users;
}

export interface DefaultAccount {
  code: string;
  nameAr: string;
  nameEn: string;
  accountType: AccountType;
  parentCode?: string;
  category?: string;
}

export const DEFAULT_ACCOUNTS: DefaultAccount[] = [
  // ===== الأصول (Assets) 1xxx =====
  { code: '1000', nameAr: 'الأصول', nameEn: 'Assets', accountType: 'ASSET' },
  { code: '1100', nameAr: 'الأصول المتداولة', nameEn: 'Current Assets', accountType: 'ASSET', parentCode: '1000' },
  { code: '1110', nameAr: 'النقدية بالصندوق', nameEn: 'Cash on Hand', accountType: 'ASSET', parentCode: '1100' },
  { code: '1120', nameAr: 'النقدية بالبنوك', nameEn: 'Cash in Banks', accountType: 'ASSET', parentCode: '1100' },
  { code: '1130', nameAr: 'العملاء (الذمم المدينة)', nameEn: 'Accounts Receivable', accountType: 'ASSET', parentCode: '1100' },
  { code: '1140', nameAr: 'المخزون', nameEn: 'Inventory', accountType: 'ASSET', parentCode: '1100' },
  { code: '1150', nameAr: 'مصروفات مدفوعة مقدماً', nameEn: 'Prepaid Expenses', accountType: 'ASSET', parentCode: '1100' },
  { code: '1200', nameAr: 'الأصول الثابتة', nameEn: 'Fixed Assets', accountType: 'ASSET', parentCode: '1000' },
  { code: '1210', nameAr: 'الأراضي', nameEn: 'Land', accountType: 'ASSET', parentCode: '1200' },
  { code: '1220', nameAr: 'المباني', nameEn: 'Buildings', accountType: 'ASSET', parentCode: '1200' },
  { code: '1230', nameAr: 'المعدات والآلات', nameEn: 'Equipment & Machinery', accountType: 'ASSET', parentCode: '1200' },
  { code: '1240', nameAr: 'المركبات', nameEn: 'Vehicles', accountType: 'ASSET', parentCode: '1200' },
  { code: '1250', nameAr: 'الأثاث والتجهيزات المكتبية', nameEn: 'Furniture & Office Equipment', accountType: 'ASSET', parentCode: '1200' },
  { code: '1260', nameAr: 'مجمع الاستهلاك', nameEn: 'Accumulated Depreciation', accountType: 'ASSET', parentCode: '1200', category: 'CONTRA_ASSET' },
  { code: '1270', nameAr: 'أصول غير ملموسة', nameEn: 'Intangible Assets', accountType: 'ASSET', parentCode: '1200' },
  { code: '1280', nameAr: 'أصول قيد الإنشاء', nameEn: 'Assets Under Construction', accountType: 'ASSET', parentCode: '1200' },

  // ===== الخصوم (Liabilities) 2xxx =====
  { code: '2000', nameAr: 'الخصوم', nameEn: 'Liabilities', accountType: 'LIABILITY' },
  { code: '2100', nameAr: 'الخصوم المتداولة', nameEn: 'Current Liabilities', accountType: 'LIABILITY', parentCode: '2000' },
  { code: '2110', nameAr: 'الموردون (الذمم الدائنة)', nameEn: 'Accounts Payable', accountType: 'LIABILITY', parentCode: '2100' },
  { code: '2120', nameAr: 'قروض قصيرة الأجل', nameEn: 'Short-term Loans', accountType: 'LIABILITY', parentCode: '2100' },
  { code: '2130', nameAr: 'ضريبة القيمة المضافة مستحقة', nameEn: 'VAT Payable', accountType: 'LIABILITY', parentCode: '2100' },
  { code: '2140', nameAr: 'رواتب مستحقة', nameEn: 'Salaries Payable', accountType: 'LIABILITY', parentCode: '2100' },
  { code: '2150', nameAr: 'مصاريف مستحقة', nameEn: 'Accrued Expenses', accountType: 'LIABILITY', parentCode: '2100' },
  { code: '2160', nameAr: 'أقساط مستحقة', nameEn: 'Installments Payable', accountType: 'LIABILITY', parentCode: '2100' },
  { code: '2200', nameAr: 'الخصوم طويلة الأجل', nameEn: 'Long-term Liabilities', accountType: 'LIABILITY', parentCode: '2000' },
  { code: '2210', nameAr: 'قروض طويلة الأجل', nameEn: 'Long-term Loans', accountType: 'LIABILITY', parentCode: '2200' },

  // ===== حقوق الملكية (Equity) 3xxx =====
  { code: '3000', nameAr: 'حقوق الملكية', nameEn: 'Equity', accountType: 'EQUITY' },
  { code: '3100', nameAr: 'رأس المال', nameEn: 'Capital', accountType: 'EQUITY', parentCode: '3000' },
  { code: '3110', nameAr: 'رأس المال المدفوع', nameEn: 'Paid-in Capital', accountType: 'EQUITY', parentCode: '3100' },
  { code: '3200', nameAr: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', accountType: 'EQUITY', parentCode: '3000' },
  { code: '3210', nameAr: 'أرباح العام الحالي', nameEn: 'Current Year Earnings', accountType: 'EQUITY', parentCode: '3200' },
  { code: '3300', nameAr: 'الاحتياطيات', nameEn: 'Reserves', accountType: 'EQUITY', parentCode: '3000' },
  { code: '3400', nameAr: 'خسائر العام الحالي', nameEn: 'Current Year Loss', accountType: 'EQUITY', parentCode: '3000' },

  // ===== الإيرادات (Revenue) 4xxx =====
  { code: '4000', nameAr: 'الإيرادات', nameEn: 'Revenue', accountType: 'REVENUE' },
  { code: '4100', nameAr: 'إيرادات الخدمات', nameEn: 'Service Revenue', accountType: 'REVENUE', parentCode: '4000' },
  { code: '4110', nameAr: 'إيرادات صيانة المركبات', nameEn: 'Vehicle Maintenance Revenue', accountType: 'REVENUE', parentCode: '4100' },
  { code: '4120', nameAr: 'إيرادات قطع الغيار', nameEn: 'Spare Parts Revenue', accountType: 'REVENUE', parentCode: '4100' },
  { code: '4130', nameAr: 'إيرادات الغسيل والتلميع', nameEn: 'Wash & Polish Revenue', accountType: 'REVENUE', parentCode: '4100' },
  { code: '4140', nameAr: 'إيرادات الفحص الدوري', nameEn: 'Periodic Inspection Revenue', accountType: 'REVENUE', parentCode: '4100' },
  { code: '4200', nameAr: 'إيرادات أخرى', nameEn: 'Other Revenue', accountType: 'REVENUE', parentCode: '4000' },
  { code: '4210', nameAr: 'إيرادات إيجارية', nameEn: 'Rental Revenue', accountType: 'REVENUE', parentCode: '4200' },
  { code: '4220', nameAr: 'إيرادات متنوعة', nameEn: 'Miscellaneous Revenue', accountType: 'REVENUE', parentCode: '4200' },

  // ===== تكاليف البضاعة المباعة (COGS) 5xxx =====
  { code: '5000', nameAr: 'تكاليف البضاعة المباعة', nameEn: 'Cost of Goods Sold', accountType: 'EXPENSE' },
  { code: '5100', nameAr: 'تكلفة قطع الغيار المباعة', nameEn: 'Spare Parts Cost', accountType: 'EXPENSE', parentCode: '5000' },
  { code: '5200', nameAr: 'تكلفة المواد المستهلكة', nameEn: 'Consumables Cost', accountType: 'EXPENSE', parentCode: '5000' },
  { code: '5300', nameAr: 'تكلفة العمالة المباشرة', nameEn: 'Direct Labor Cost', accountType: 'EXPENSE', parentCode: '5000' },

  // ===== المصروفات (Expenses) 6xxx =====
  { code: '6000', nameAr: 'المصروفات التشغيلية', nameEn: 'Operating Expenses', accountType: 'EXPENSE' },
  { code: '6100', nameAr: 'مصروفات الرواتب والأجور', nameEn: 'Salaries & Wages', accountType: 'EXPENSE', parentCode: '6000' },
  { code: '6110', nameAr: 'الرواتب الأساسية', nameEn: 'Basic Salaries', accountType: 'EXPENSE', parentCode: '6100' },
  { code: '6120', nameAr: 'المكافآت والحوافز', nameEn: 'Bonuses & Incentives', accountType: 'EXPENSE', parentCode: '6100' },
  { code: '6130', nameAr: 'التأمينات الاجتماعية', nameEn: 'Social Insurance', accountType: 'EXPENSE', parentCode: '6100' },
  { code: '6200', nameAr: 'مصروفات الإيجار', nameEn: 'Rent Expenses', accountType: 'EXPENSE', parentCode: '6000' },
  { code: '6300', nameAr: 'مصروفات الكهرباء والماء', nameEn: 'Utilities Expenses', accountType: 'EXPENSE', parentCode: '6000' },
  { code: '6400', nameAr: 'مصروفات الإهلاك', nameEn: 'Depreciation Expense', accountType: 'EXPENSE', parentCode: '6000' },
  { code: '6500', nameAr: 'مصروفات الصيانة', nameEn: 'Maintenance Expenses', accountType: 'EXPENSE', parentCode: '6000' },
  { code: '6600', nameAr: 'مصروفات الوقود والنقل', nameEn: 'Fuel & Transportation', accountType: 'EXPENSE', parentCode: '6000' },
  { code: '6700', nameAr: 'مصروفات التسويق والإعلان', nameEn: 'Marketing & Advertising', accountType: 'EXPENSE', parentCode: '6000' },
  { code: '6800', nameAr: 'مصروفات الإدارة والمكتب', nameEn: 'Administrative Expenses', accountType: 'EXPENSE', parentCode: '6000' },
  { code: '6900', nameAr: 'مصروفات متنوعة', nameEn: 'Miscellaneous Expenses', accountType: 'EXPENSE', parentCode: '6000' },

  // ===== المصروفات المالية (Financial Expenses) 7xxx =====
  { code: '7000', nameAr: 'المصروفات المالية', nameEn: 'Financial Expenses', accountType: 'EXPENSE' },
  { code: '7100', nameAr: 'فوائد بنكية مدفوعة', nameEn: 'Bank Interest Paid', accountType: 'EXPENSE', parentCode: '7000' },
  { code: '7200', nameAr: 'عمولات بنكية', nameEn: 'Bank Commissions', accountType: 'EXPENSE', parentCode: '7000' },
  { code: '7300', nameAr: 'خسائر صرف العملة', nameEn: 'Foreign Exchange Loss', accountType: 'EXPENSE', parentCode: '7000' },
];

export const DEFAULT_ASSET_CATEGORIES = [
  { name: 'المعدات والآلات', usefulLifeYears: 10, depreciationMethod: 'STRAIGHT_LINE', salvageValuePercent: 10 },
  { name: 'المركبات', usefulLifeYears: 5, depreciationMethod: 'STRAIGHT_LINE', salvageValuePercent: 15 },
  { name: 'الأثاث والتجهيزات المكتبية', usefulLifeYears: 7, depreciationMethod: 'STRAIGHT_LINE', salvageValuePercent: 10 },
  { name: 'المباني', usefulLifeYears: 25, depreciationMethod: 'STRAIGHT_LINE', salvageValuePercent: 5 },
  { name: 'أجهزة الكمبيوتر والإلكترونيات', usefulLifeYears: 3, depreciationMethod: 'DECLINING_BALANCE', salvageValuePercent: 5 },
];

export const DEFAULT_COST_CENTERS = [
  { name: 'مركز المرآب الرئيسي', type: 'OPERATING', code: 'CC-001' },
  { name: 'مركز الاستقبال', type: 'ADMIN', code: 'CC-002' },
  { name: 'مركز الإدارة', type: 'ADMIN', code: 'CC-003' },
  { name: 'مركز المخزن', type: 'OPERATING', code: 'CC-004' },
  { name: 'مركز المحاسبة', type: 'ADMIN', code: 'CC-005' },
];
