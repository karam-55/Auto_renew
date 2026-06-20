import { ApiClient } from '../api/client'

export interface Step1Data {
  companyName: string
  companyNameEn?: string
  address?: string
  phone?: string
  taxNumber?: string
  logoUrl?: string
  currency: string
  timezone?: string
  dateFormat?: string
  timeFormat?: string
}

export interface Step2Data {
  exchangeRate: number
  taxRate?: number
  overheadPercentage?: number
  monthlyWorkingHours?: number
  serviceOverheadPercent?: number
  invoicePrefix?: string
  autoGenerateInvoiceNumber?: boolean
  fiscalPeriodName?: string
  fiscalStartDate?: string
  fiscalEndDate?: string
}

export interface Step3Data {
  createDefaultAccounts: boolean
  openingBalanceSYP?: number
  openingBalanceUSD?: number
}

export interface Step4Data {
  createDefaultCategories: boolean
}

export interface Step5Data {
  createDefaultCenters: boolean
}

export interface Step6User {
  fullName: string
  username: string
  phone?: string
  password: string
  role: string
}

export interface Step6Data {
  users: Step6User[]
}

export interface SetupWizardStatus {
  setupCompleted: boolean
  setupStep: number
  companyName?: string
}

export class SetupWizardService {
  constructor(private api: ApiClient) {}

  async getStatus(): Promise<SetupWizardStatus> {
    const res = await this.api.get<SetupWizardStatus>('/api/setup-wizard/status')
    if (!res.success || !res.data) throw new Error(res.message || 'Failed')
    return res.data
  }

  async saveStep(step: number, data: any): Promise<any> {
    const res = await this.api.post<any>(`/api/setup-wizard/step/${step}`, data)
    if (!res.success) throw new Error(res.message || 'Failed')
    return res.data
  }

  async complete(): Promise<void> {
    const res = await this.api.post<any>('/api/setup-wizard/complete', {})
    if (!res.success) throw new Error(res.message || 'Failed')
  }
}
