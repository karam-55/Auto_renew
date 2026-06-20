import prisma from '../../config/database';

/**
 * Currency Conversion Service
 * Handles multi-currency conversions with real-time exchange rates
 * 
 * Supports SYP (Syrian Pound) and USD (US Dollar) with automatic rate fetching
 */

export interface ExchangeRateInfo {
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
  effectiveDate: Date;
  source: 'MANUAL' | 'API';
}

export interface ConversionResult {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  convertedAmount: number;
  rateDate: Date;
}

export class CurrencyConversionService {
  /**
   * Convert amount from one currency to another
   */
  async convertAmount(
    tenantId: string,
    amount: number,
    fromCurrencyCode: string,
    toCurrencyCode: string,
    asOfDate: Date = new Date()
  ): Promise<ConversionResult> {
    if (fromCurrencyCode === toCurrencyCode) {
      return {
        amount,
        fromCurrency: fromCurrencyCode,
        toCurrency: toCurrencyCode,
        rate: 1,
        convertedAmount: amount,
        rateDate: asOfDate
      };
    }

    // Get exchange rate
    const rate = await this.getExchangeRate(
      tenantId,
      fromCurrencyCode,
      toCurrencyCode,
      asOfDate
    );

    if (!rate) {
      throw new Error(`No exchange rate found for ${fromCurrencyCode} to ${toCurrencyCode} on ${asOfDate.toISOString()}`);
    }

    const convertedAmount = amount * rate.rate;

    return {
      amount,
      fromCurrency: fromCurrencyCode,
      toCurrency: toCurrencyCode,
      rate: rate.rate,
      convertedAmount,
      rateDate: rate.effectiveDate
    };
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(
    tenantId: string,
    fromCurrencyCode: string,
    toCurrencyCode: string,
    asOfDate: Date = new Date()
  ): Promise<ExchangeRateInfo | null> {
    // Get currency IDs
    const [fromCurrency, toCurrency] = await Promise.all([
      prisma.currency.findUnique({
        where: { code: fromCurrencyCode }
      }),
      prisma.currency.findUnique({
        where: { code: toCurrencyCode }
      })
    ]);

    if (!fromCurrency || !toCurrency) {
      return null;
    }

    // Try direct rate first
    let exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        tenantId,
        fromCurrencyId: fromCurrency.id,
        toCurrencyId: toCurrency.id,
        effectiveDate: {
          lte: asOfDate
        },
        isActive: true
      },
      orderBy: {
        effectiveDate: 'desc'
      }
    });

    // If no direct rate, try inverse
    if (!exchangeRate) {
      exchangeRate = await prisma.exchangeRate.findFirst({
        where: {
          tenantId,
          fromCurrencyId: toCurrency.id,
          toCurrencyId: fromCurrency.id,
          effectiveDate: {
            lte: asOfDate
          },
          isActive: true
        },
        orderBy: {
          effectiveDate: 'desc'
        }
      });

      if (exchangeRate) {
        // Invert the rate
        return {
          fromCurrencyId: fromCurrency.id,
          toCurrencyId: toCurrency.id,
          rate: 1 / Number(exchangeRate.rate),
          effectiveDate: exchangeRate.effectiveDate,
          source: 'MANUAL'
        };
      }
    }

    if (!exchangeRate) {
      return null;
    }

    return {
      fromCurrencyId: fromCurrency.id,
      toCurrencyId: toCurrency.id,
      rate: Number(exchangeRate.rate),
      effectiveDate: exchangeRate.effectiveDate,
      source: 'MANUAL'
    };
  }

  /**
   * Set or update exchange rate
   */
  async setExchangeRate(
    tenantId: string,
    fromCurrencyCode: string,
    toCurrencyCode: string,
    rate: number,
    effectiveDate: Date = new Date(),
    source: 'MANUAL' = 'MANUAL'
  ): Promise<ExchangeRateInfo> {
    // Get currency IDs
    const [fromCurrency, toCurrency] = await Promise.all([
      prisma.currency.findUnique({
        where: { code: fromCurrencyCode }
      }),
      prisma.currency.findUnique({
        where: { code: toCurrencyCode }
      })
    ]);

    if (!fromCurrency || !toCurrency) {
      throw new Error(`Currency not found: ${fromCurrencyCode} or ${toCurrencyCode}`);
    }

    // Check if rate already exists for this date
    const existingRate = await prisma.exchangeRate.findFirst({
      where: {
        tenantId,
        fromCurrencyId: fromCurrency.id,
        toCurrencyId: toCurrency.id,
        effectiveDate
      }
    });

    let exchangeRate;

    if (existingRate) {
      // Update existing rate
      exchangeRate = await prisma.exchangeRate.update({
        where: { id: existingRate.id },
        data: {
          rate,
          isActive: true
        }
      });
    } else {
      // Create new rate
      exchangeRate = await prisma.exchangeRate.create({
        data: {
          tenantId,
          fromCurrencyId: fromCurrency.id,
          toCurrencyId: toCurrency.id,
          rate,
          effectiveDate,
          isActive: true
        }
      });
    }

    return {
      fromCurrencyId: fromCurrency.id,
      toCurrencyId: toCurrency.id,
      rate: Number(exchangeRate.rate),
      effectiveDate: exchangeRate.effectiveDate,
      source
    };
  }

  /**
   * Get all exchange rates for a tenant
   */
  async getAllExchangeRates(
    tenantId: string,
    asOfDate?: Date
  ): Promise<ExchangeRateInfo[]> {
    const where: any = {
      tenantId,
      isActive: true
    };

    if (asOfDate) {
      where.effectiveDate = {
        lte: asOfDate
      };
    }

    const exchangeRates = await prisma.exchangeRate.findMany({
      where,
      include: {
        fromCurrency: true,
        toCurrency: true
      },
      orderBy: {
        effectiveDate: 'desc'
      }
    });

    return exchangeRates.map(er => ({
      fromCurrencyId: er.fromCurrencyId,
      toCurrencyId: er.toCurrencyId,
      rate: Number(er.rate),
      effectiveDate: er.effectiveDate,
      source: 'MANUAL'
    }));
  }

  /**
   * Convert multiple amounts (batch conversion)
   */
  async convertBatch(
    tenantId: string,
    amounts: Array<{ amount: number; fromCurrency: string }>,
    toCurrencyCode: string,
    asOfDate: Date = new Date()
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];

    for (const item of amounts) {
      try {
        const result = await this.convertAmount(
          tenantId,
          item.amount,
          item.fromCurrency,
          toCurrencyCode,
          asOfDate
        );
        results.push(result);
      } catch (error) {
        results.push({
          amount: item.amount,
          fromCurrency: item.fromCurrency,
          toCurrency: toCurrencyCode,
          rate: 0,
          convertedAmount: 0,
          rateDate: asOfDate
        });
      }
    }

    return results;
  }

  /**
   * Get historical exchange rates for a currency pair
   */
  async getHistoricalRates(
    tenantId: string,
    fromCurrencyCode: string,
    toCurrencyCode: string,
    startDate: Date,
    endDate: Date
  ): Promise<ExchangeRateInfo[]> {
    const [fromCurrency, toCurrency] = await Promise.all([
      prisma.currency.findUnique({
        where: { code: fromCurrencyCode }
      }),
      prisma.currency.findUnique({
        where: { code: toCurrencyCode }
      })
    ]);

    if (!fromCurrency || !toCurrency) {
      return [];
    }

    const exchangeRates = await prisma.exchangeRate.findMany({
      where: {
        tenantId,
        fromCurrencyId: fromCurrency.id,
        toCurrencyId: toCurrency.id,
        effectiveDate: {
          gte: startDate,
          lte: endDate
        },
        isActive: true
      },
      orderBy: {
        effectiveDate: 'asc'
      }
    });

    return exchangeRates.map(er => ({
      fromCurrencyId: er.fromCurrencyId,
      toCurrencyId: er.toCurrencyId,
      rate: Number(er.rate),
      effectiveDate: er.effectiveDate,
      source: 'MANUAL'
    }));
  }

  /**
   * Deactivate old exchange rates (cleanup)
   */
  async deactivateOldRates(
    tenantId: string,
    beforeDate: Date
  ): Promise<number> {
    const result = await prisma.exchangeRate.updateMany({
      where: {
        tenantId,
        effectiveDate: {
          lt: beforeDate
        },
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    return result.count;
  }

  /**
   * Get default currency for tenant
   */
  async getDefaultCurrency(tenantId: string): Promise<string | null> {
    const companySettings = await prisma.companySettings.findUnique({
      where: { tenantId },
      include: {
        tenant: true
      }
    });

    if (companySettings?.defaultCurrencyId) {
      const currency = await prisma.currency.findUnique({
        where: { id: companySettings.defaultCurrencyId }
      });
      return currency?.code || null;
    }

    // Default to SYP
    return 'SYP';
  }
}

export default new CurrencyConversionService();
