export { DEFAULT_ACCOUNTS } from '../accounting/chart-of-accounts.defaults';
export type { DefaultAccount } from '../accounting/chart-of-accounts.defaults';

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

export const DEFAULT_ASSET_CATEGORIES = [
  { name: 'المعدات والآلات', usefulLifeYears: 10, depreciationMethod: 'STRAIGHT_LINE', salvageValuePercent: 10 },
  { name: 'المركبات', usefulLifeYears: 5, depreciationMethod: 'STRAIGHT_LINE', salvageValuePercent: 15 },
  { name: 'الأثاث والتجهيزات المكتبية', usefulLifeYears: 7, depreciationMethod: 'STRAIGHT_LINE', salvageValuePercent: 10 },
  { name: 'المباني', usefulLifeYears: 25, depreciationMethod: 'STRAIGHT_LINE', salvageValuePercent: 5 },
  { name: 'أجهزة الكمبيوتر والإلكترونيات', usefulLifeYears: 3, depreciationMethod: 'DECLINING_BALANCE', salvageValuePercent: 5 },
];

export const DEFAULT_COST_CENTERS = [
  { name: 'الصيانة الميكانيكية', nameAr: 'الصيانة الميكانيكية', type: 'WORKSHOP', code: 'D01', costDriver: 'SERVICE_COUNT', driverQuantity: 0, monthlyBudget: 0 },
  { name: 'الحماية والتغليف', nameAr: 'الحماية والتغليف', type: 'WORKSHOP', code: 'D02', costDriver: 'SERVICE_COUNT', driverQuantity: 0, monthlyBudget: 0 },
  { name: 'الغسيل والتلميع', nameAr: 'الغسيل والتلميع', type: 'CAR_WASH', code: 'D03', costDriver: 'SERVICE_COUNT', driverQuantity: 0, monthlyBudget: 0 },
  { name: 'الأدوات والخدمات المرتبطة', nameAr: 'الأدوات والخدمات المرتبطة', type: 'WORKSHOP', code: 'D04', costDriver: 'SERVICE_COUNT', driverQuantity: 0, monthlyBudget: 0 },
  { name: 'الإدارة والخدمات المشتركة', nameAr: 'الإدارة والخدمات المشتركة', type: 'ADMIN', code: 'D05', costDriver: 'FIXED', driverQuantity: 1, monthlyBudget: 0 },
];
