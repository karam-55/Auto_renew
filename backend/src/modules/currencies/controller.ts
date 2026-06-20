import { Request, Response } from 'express';
import { CurrencyService } from './service';
import { AuthRequest, authorize } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';
import { CreateCurrencyDto, UpdateCurrencyDto, CreateExchangeRateDto, UpdateExchangeRateDto } from './types';

export class CurrencyController {
  private currencyService: CurrencyService;

  constructor() {
    this.currencyService = new CurrencyService();
  }

  // Currency endpoints
  createCurrency = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const data: CreateCurrencyDto = req.body;

      const currency = await this.currencyService.createCurrency(tenantId, data);

      res.status(201).json({
        success: true,
        data: currency,
      });
    } catch (error) {
      Logger.error('Create currency error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create currency',
      });
    }
  };

  getCurrencies = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const isActiveOnly = req.query.active === 'true';

      const currencies = await this.currencyService.getCurrencies(tenantId, isActiveOnly);

      res.status(200).json({
        success: true,
        data: currencies,
      });
    } catch (error) {
      Logger.error('Get currencies error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get currencies',
      });
    }
  };

  getCurrencyById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const currency = await this.currencyService.getCurrencyById(tenantId, id);

      if (!currency) {
        res.status(404).json({
          success: false,
          error: 'Currency not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: currency,
      });
    } catch (error) {
      Logger.error('Get currency by ID error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get currency',
      });
    }
  };

  getDefaultCurrency = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      const currency = await this.currencyService.getDefaultCurrency(tenantId);

      if (!currency) {
        res.status(404).json({
          success: false,
          error: 'Default currency not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: currency,
      });
    } catch (error) {
      Logger.error('Get default currency error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get default currency',
      });
    }
  };

  updateCurrency = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const data: UpdateCurrencyDto = req.body;

      const currency = await this.currencyService.updateCurrency(tenantId, id, data);

      res.status(200).json({
        success: true,
        data: currency,
      });
    } catch (error) {
      Logger.error('Update currency error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update currency',
      });
    }
  };

  deleteCurrency = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      await this.currencyService.deleteCurrency(tenantId, id);

      res.status(200).json({
        success: true,
        message: 'Currency deleted successfully',
      });
    } catch (error) {
      Logger.error('Delete currency error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete currency',
      });
    }
  };

  // Exchange rate endpoints
  createExchangeRate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const data: CreateExchangeRateDto = req.body;

      const exchangeRate = await this.currencyService.createExchangeRate(tenantId, data);

      res.status(201).json({
        success: true,
        data: exchangeRate,
      });
    } catch (error) {
      Logger.error('Create exchange rate error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create exchange rate',
      });
    }
  };

  getExchangeRates = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        fromCurrencyId: req.query.fromCurrencyId as string,
        toCurrencyId: req.query.toCurrencyId as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      const exchangeRates = await this.currencyService.getExchangeRates(tenantId, filters);

      res.status(200).json({
        success: true,
        data: exchangeRates,
      });
    } catch (error) {
      Logger.error('Get exchange rates error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get exchange rates',
      });
    }
  };

  getExchangeRateById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const exchangeRate = await this.currencyService.getExchangeRateById(tenantId, id);

      if (!exchangeRate) {
        res.status(404).json({
          success: false,
          error: 'Exchange rate not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: exchangeRate,
      });
    } catch (error) {
      Logger.error('Get exchange rate by ID error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get exchange rate',
      });
    }
  };

  getCurrentExchangeRate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { fromCurrencyId, toCurrencyId } = req.query;

      if (!fromCurrencyId || !toCurrencyId) {
        res.status(400).json({
          success: false,
          error: 'fromCurrencyId and toCurrencyId are required',
        });
        return;
      }

      const exchangeRate = await this.currencyService.getCurrentExchangeRate(
        tenantId,
        fromCurrencyId as string,
        toCurrencyId as string
      );

      if (!exchangeRate) {
        res.status(404).json({
          success: false,
          error: 'No active exchange rate found for this currency pair',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: exchangeRate,
      });
    } catch (error) {
      Logger.error('Get current exchange rate error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current exchange rate',
      });
    }
  };

  updateExchangeRate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const data: UpdateExchangeRateDto = req.body;

      const exchangeRate = await this.currencyService.updateExchangeRate(tenantId, id, data);

      res.status(200).json({
        success: true,
        data: exchangeRate,
      });
    } catch (error) {
      Logger.error('Update exchange rate error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update exchange rate',
      });
    }
  };

  deleteExchangeRate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      await this.currencyService.deleteExchangeRate(tenantId, id);

      res.status(200).json({
        success: true,
        message: 'Exchange rate deleted successfully',
      });
    } catch (error) {
      Logger.error('Delete exchange rate error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete exchange rate',
      });
    }
  };

  convertCurrency = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { amount, fromCurrencyId, toCurrencyId } = req.body;

      if (!amount || !fromCurrencyId || !toCurrencyId) {
        res.status(400).json({
          success: false,
          error: 'amount, fromCurrencyId, and toCurrencyId are required',
        });
        return;
      }

      const convertedAmount = await this.currencyService.convertCurrency(
        tenantId,
        amount,
        fromCurrencyId,
        toCurrencyId
      );

      res.status(200).json({
        success: true,
        data: {
          originalAmount: amount,
          convertedAmount,
          fromCurrencyId,
          toCurrencyId,
        },
      });
    } catch (error) {
      Logger.error('Convert currency error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to convert currency',
      });
    }
  };
}