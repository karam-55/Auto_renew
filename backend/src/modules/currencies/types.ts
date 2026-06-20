export interface Currency {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  isDefault: boolean;
  isActive: boolean;
  decimalPlaces: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCurrencyDto {
  code: string;
  name: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  isDefault?: boolean;
  isActive?: boolean;
  decimalPlaces?: number;
}

export interface UpdateCurrencyDto {
  name?: string;
  nameAr?: string;
  nameEn?: string;
  symbol?: string;
  isDefault?: boolean;
  isActive?: boolean;
  decimalPlaces?: number;
}

export interface ExchangeRate {
  id: string;
  tenantId: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
  effectiveDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  fromCurrency?: Currency;
  toCurrency?: Currency;
}

export interface CreateExchangeRateDto {
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
  effectiveDate: Date;
  isActive?: boolean;
}

export interface UpdateExchangeRateDto {
  rate?: number;
  effectiveDate?: Date;
  isActive?: boolean;
}

export interface ExchangeRateFilters {
  fromCurrencyId?: string;
  toCurrencyId?: string;
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}