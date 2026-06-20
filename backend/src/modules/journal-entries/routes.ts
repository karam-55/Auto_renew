import { Router } from 'express';
import { JournalEntryController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const journalEntryController = new JournalEntryController();

// All routes require authentication
router.use(authenticate);

// Create journal entry - OWNER, MANAGER, ACCOUNTANT only
router.post('/', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), journalEntryController.createJournalEntry);

// Get all journal entries - All authenticated users
router.get('/', journalEntryController.getJournalEntries);

// Get journal entry summaries (for list views) - All authenticated users
router.get('/summaries', journalEntryController.getJournalEntrySummaries);

// Get journal entry by ID - All authenticated users
router.get('/:id', tenantGuard('JournalEntry'), journalEntryController.getJournalEntryById);

// Update journal entry - OWNER, MANAGER, ACCOUNTANT only
router.put('/:id', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('JournalEntry'), journalEntryController.updateJournalEntry);

// Delete journal entry - OWNER, MANAGER only
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('JournalEntry'), journalEntryController.deleteJournalEntry);

export default router;