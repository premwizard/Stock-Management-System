import { Router } from 'express';
import healthRoutes from './health.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import inventoryRoutes from './inventory.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import stockRequestRoutes from './stockRequest.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/stock-requests', stockRequestRoutes);

export default router;
