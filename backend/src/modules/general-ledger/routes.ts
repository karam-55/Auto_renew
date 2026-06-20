import { Router } from 'express';
import { GeneralLedgerController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();
const generalLedgerController = new GeneralLedgerController();

// All routes require authentication and OWNER/MANAGER/ACCOUNTANT role
router.use(authenticate);
router.use(authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']));

// GET /api/general-ledger?fromDate=&toDate=&accountId=
router.get('/', generalLedgerController.getGeneralLedger);

export default router;
