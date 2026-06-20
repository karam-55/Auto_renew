import { Router } from 'express';
import { DocumentController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();
const documentController = new DocumentController();

router.use(authenticate);

router.get('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), documentController.getDocuments);
router.get('/counts', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), documentController.getCategoryCounts);
router.get('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), documentController.getDocumentById);
router.post('/', authorize(['OWNER', 'MANAGER']), documentController.createDocument);
router.put('/:id', authorize(['OWNER', 'MANAGER']), documentController.updateDocument);
router.delete('/:id', authorize(['OWNER', 'MANAGER']), documentController.deleteDocument);

export default router;
