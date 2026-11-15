import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/summary', DashboardController.getSummary);
router.get('/category-distribution', DashboardController.getCategoryDistribution);
router.get('/recent-movements', DashboardController.getRecentMovements);
router.get('/low-stock', DashboardController.getLowStock);

export default router;

