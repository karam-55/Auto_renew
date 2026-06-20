import prisma from '../../config/database';
import {
  Currency,
  CreateCurrencyDto,
  UpdateCurrencyDto,
  ExchangeRate,
  CreateExchangeRateDto,
  UpdateExchangeRateDto,
  ExchangeRateFilters,
} from './types';

export class CurrencyService {
  /**
   * Create a new currency
   * Only one default currency allowed per tenant
   */
  async createCurrency(tenantId: string, data: CreateCurrencyDto): Promise<Currency> {
    // Check if currency code already exists in this tenant
    const existingCurrency = await prisma.currency.findFirst({
      where: { tenantId, code: data.code },
    });

    if (existingCurrency) {
      throw new Error('Currency with this code already exists');
    }

    // If setting as default, remove default from other currencies
    if (data.isDefault) {
      await prisma.currency.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const currency = await prisma.currency.create({
      data: {
        tenantId,
        code: data.code,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        symbol: data.symbol,
        isDefault: data.isDefault || false,
        decimalPlaces: data.decimalPlaces || 2,
        isActive: data.isActive ?? true,
      },
    });

    return this.mapToCurrencyResponse(currency);
  }

  /**
   * Get all currencies
   */
  async getCurrencies(tenantId: string, isActiveOnly: boolean = false): Promise<Currency[]> {
    const where: any = { tenantId };

    if (isActiveOnly) {
      where.isActive = true;
    }

    const currencies = await prisma.currency.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    });

    return currencies.map((curr) => this.mapToCurrencyResponse(curr));
  }

  /**
   * Get currency by ID
   */
  async getCurrencyById(tenantId: string, currencyId: string): Promise<Currency | null> {
    const currency = await prisma.currency.findFirst({
      where: { id: currencyId, tenantId },
    });

    if (!currency) {
      return null;
    }

    return this.mapToCurrencyResponse(currency);
  }

  /**
   * Get default currency
   */
  async getDefaultCurrency(tenantId: string): Promise<Currency | null> {
    const currency = await prisma.currency.findFirst({
      where: { tenantId, isDefault: true },
    });

    if (!currency) {
      return null;
    }

    return this.mapToCurrencyResponse(currency);
  }

  /**
   * Update currency
   */
  async updateCurrency(tenantId: string, currencyId: string, data: UpdateCurrencyDto): Promise<Currency> {
    const existingCurrency = await prisma.currency.findFirst({
      where: { id: currencyId, tenantId },
    });

    if (!existingCurrency) {
      throw new Error('Currency not found');
    }

    // If setting as default, remove default from other currencies
    if (data.isDefault) {
      await prisma.currency.updateMany({
        where: { tenantId, id: { not: currencyId }, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedCurrency = await prisma.currency.update({
      where: { id: currencyId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.nameAr && { nameAr: data.nameAr }),
        ...(data.nameEn && { nameEn: data.nameEn }),
        ...(data.symbol && { symbol: data.symbol }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.decimalPlaces !== undefined && { decimalPlaces: data.decimalPlaces }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return this.mapToCurrencyResponse(updatedCurrency);
  }

  /**
   * Delete currency
   * Only allowed if not default and no exchange rates exist
   */
  async deleteCurrency(tenantId: string, currencyId: string): Promise<void> {
    const currency = await prisma.currency.findFirst({
      where: { id: currencyId, tenantId },
    });

    if (!currency) {
      throw new Error('Currency not found');
    }

    // Cannot delete default currency
    if (currency.isDefault) {
      throw new Error('Cannot delete default currency');
    }

    // Check if currency has exchange rates
    const exchangeRatesCount = await prisma.exchangeRate.count({
      where: {
        OR: [{ fromCurrencyId: currencyId }, { toCurrencyId: currencyId }],
      },
    });

    if (exchangeRatesCount > 0) {
      throw new Error('Cannot delete currency with exchange rates');
    }

    await prisma.currency.delete({
      where: { id: currencyId },
    });
  }

  /**
   * Create exchange rate
   */
  async createExchangeRate(tenantId: string, data: CreateExchangeRateDto): Promise<ExchangeRate> {
    // Validate currencies exist and belong to tenant
    const fromCurrency = await prisma.currency.findFirst({
      where: { id: data.fromCurrencyId, tenantId },
    });

    if (!fromCurrency) {
      throw new Error('From currency not found');
    }

    const toCurrency = await prisma.currency.findFirst({
      where: { id: data.toCurrencyId, tenantId },
    });

    if (!toCurrency) {
      throw new Error('To currency not found');
    }

    // Cannot create exchange rate for same currency
    if (data.fromCurrencyId === data.toCurrencyId) {
      throw new Error('Cannot create exchange rate for same currency');
    }

    // If setting as active, deactivate other rates for this pair
    if (data.isActive) {
      await prisma.exchangeRate.updateMany({
        where: {
          fromCurrencyId: data.fromCurrencyId,
          toCurrencyId: data.toCurrencyId,
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    const exchangeRate = await prisma.exchangeRate.create({
      data: {
        tenantId,
        fromCurrencyId: data.fromCurrencyId,
        toCurrencyId: data.toCurrencyId,
        rate: data.rate,
        effectiveDate: data.effectiveDate,
        isActive: data.isActive ?? true,
      },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
    });

    return this.mapToExchangeRateResponse(exchangeRate);
  }

  /**
   * Get exchange rates with optional filters
   */
  async getExchangeRates(tenantId: string, filters: ExchangeRateFilters = {}): Promise<ExchangeRate[]> {
    const where: any = { tenantId };

    if (filters.fromCurrencyId) {
      where.fromCurrencyId = filters.fromCurrencyId;
    }
    if (filters.toCurrencyId) {
      where.toCurrencyId = filters.toCurrencyId;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.effectiveDate = {};
      if (filters.dateFrom) {
        where.effectiveDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.effectiveDate.lte = filters.dateTo;
      }
    }

    const exchangeRates = await prisma.exchangeRate.findMany({
      where,
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
    });

    return exchangeRates.map((rate) => this.mapToExchangeRateResponse(rate));
  }

  /**
   * Get exchange rate by ID
   */
  async getExchangeRateById(tenantId: string, rateId: string): Promise<ExchangeRate | null> {
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: { id: rateId, tenantId },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
    });

    if (!exchangeRate) {
      return null;
    }

    return this.mapToExchangeRateResponse(exchangeRate);
  }

  /**
   * Get current exchange rate between two currencies
   */
  async getCurrentExchangeRate(tenantId: string, fromCurrencyId: string, toCurrencyId: string): Promise<ExchangeRate | null> {
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        tenantId,
        fromCurrencyId,
        toCurrencyId,
        isActive: true,
        effectiveDate: { lte: new Date() },
      },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!exchangeRate) {
      return null;
    }

    return this.mapToExchangeRateResponse(exchangeRate);
  }

  /**
   * Update exchange rate
   */
  async updateExchangeRate(tenantId: string, rateId: string, data: UpdateExchangeRateDto): Promise<ExchangeRate> {
    const existingRate = await prisma.exchangeRate.findFirst({
      where: { id: rateId, tenantId },
    });

    if (!existingRate) {
      throw new Error('Exchange rate not found');
    }

    // If setting as active, deactivate other rates for this pair
    if (data.isActive) {
      await prisma.exchangeRate.updateMany({
        where: {
          id: { not: rateId },
          fromCurrencyId: existingRate.fromCurrencyId,
          toCurrencyId: existingRate.toCurrencyId,
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    const updatedRate = await prisma.exchangeRate.update({
      where: { id: rateId },
      data: {
        ...(data.rate && { rate: data.rate }),
        ...(data.effectiveDate && { effectiveDate: data.effectiveDate }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
    });

    return this.mapToExchangeRateResponse(updatedRate);
  }

  /**
   * Delete exchange rate
   */
  async deleteExchangeRate(tenantId: string, rateId: string): Promise<void> {
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: { id: rateId, tenantId },
    });

    if (!exchangeRate) {
      throw new Error('Exchange rate not found');
    }

    await prisma.exchangeRate.delete({
      where: { id: rateId },
    });
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(tenantId: string, amount: number, fromCurrencyId: string, toCurrencyId: string): Promise<number> {
    // If same currency, return same amount
    if (fromCurrencyId === toCurrencyId) {
      return amount;
    }

    // Get exchange rate
    const exchangeRate = await this.getCurrentExchangeRate(tenantId, fromCurrencyId, toCurrencyId);

    if (!exchangeRate) {
      throw new Error('No active exchange rate found for this currency pair');
    }

    return amount * exchangeRate.rate;
  }

  /**
   * Map Prisma currency to Currency response
   */
  private mapToCurrencyResponse(currency: any): Currency {
    return {
      id: currency.id,
      tenantId: currency.tenantId,
      code: currency.code,
      name: currency.name,
      nameAr: currency.nameAr,
      nameEn: currency.nameEn,
      symbol: currency.symbol,
      isDefault: currency.isDefault,
      isActive: currency.isActive,
      decimalPlaces: currency.decimalPlaces,
      createdAt: currency.createdAt,
      updatedAt: currency.updatedAt,
    };
  }

  /**
   * Map Prisma exchange rate to ExchangeRate response
   */
  private mapToExchangeRateResponse(rate: any): ExchangeRate {
    return {
      id: rate.id,
      tenantId: rate.tenantId,
      fromCurrencyId: rate.fromCurrencyId,
      toCurrencyId: rate.toCurrencyId,
      rate: Number(rate.rate),
      effectiveDate: rate.effectiveDate,
      isActive: rate.isActive,
      createdAt: rate.createdAt,
      updatedAt: rate.updatedAt,
      fromCurrency: rate.fromCurrency ? this.mapToCurrencyResponse(rate.fromCurrency) : undefined,
      toCurrency: rate.toCurrency ? this.mapToCurrencyResponse(rate.toCurrency) : undefined,
    };
  }
}