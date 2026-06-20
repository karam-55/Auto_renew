import { Router } from 'express';
import { CurrencyController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const currencyController = new CurrencyController();

// All routes require authentication
router.use(authenticate);

// Currency routes
// Create currency - OWNER, MANAGER only
router.post('/', authorize(['OWNER', 'MANAGER']), currencyController.createCurrency);

// Get all currencies - All authenticated users
router.get('/', currencyController.getCurrencies);

// Get default currency - All authenticated users
router.get('/default', currencyController.getDefaultCurrency);

// Exchange rate routes (MUST be before /:id to avoid being caught as currency ID)
// Create exchange rate - OWNER, MANAGER, ACCOUNTANT only
router.post('/exchange-rates', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), currencyController.createExchangeRate);

// Get all exchange rates - All authenticated users
router.get('/exchange-rates', currencyController.getExchangeRates);

// Get current exchange rate - All authenticated users
router.get('/exchange-rates/current', currencyController.getCurrentExchangeRate);

// Get exchange rate by ID - All authenticated users
router.get('/exchange-rates/:id', tenantGuard('ExchangeRate'), currencyController.getExchangeRateById);

// Update exchange rate - OWNER, MANAGER, ACCOUNTANT only
router.put('/exchange-rates/:id', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('ExchangeRate'), currencyController.updateExchangeRate);

// Delete exchange rate - OWNER, MANAGER only
router.delete('/exchange-rates/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('ExchangeRate'), currencyController.deleteExchangeRate);

// Convert currency - All authenticated users
router.post('/convert', currencyController.convertCurrency);

// Get currency by ID - All authenticated users
router.get('/:id', tenantGuard('Currency'), currencyController.getCurrencyById);

// Update currency - OWNER, MANAGER only
router.put('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Currency'), currencyController.updateCurrency);

// Delete currency - OWNER, MANAGER only
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Currency'), currencyController.deleteCurrency);

export default router;