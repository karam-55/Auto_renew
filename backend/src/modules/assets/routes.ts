import { Router } from 'express';
import { assetController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();

router.use(authenticate);

// Asset Categories
router.get('/categories', assetController.getAllCategories);
router.post('/categories', authorize(['OWNER', 'MANAGER']), assetController.createCategory);
router.put('/categories/:id', authorize(['OWNER', 'MANAGER']), assetController.updateCategory);
router.delete('/categories/:id', authorize(['OWNER']), assetController.deleteCategory);

// Assets
router.get('/', assetController.getAllAssets);
router.post('/', authorize(['OWNER', 'MANAGER']), assetController.createAsset);
router.put('/:id', authorize(['OWNER', 'MANAGER']), assetController.updateAsset);
router.delete('/:id', authorize(['OWNER']), assetController.deleteAsset);

export default router;
