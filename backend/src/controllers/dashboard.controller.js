import { DashboardService } from '../services/dashboard.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class DashboardController {
  static getSummary = asyncHandler(async (req, res) => {
    const summary = await DashboardService.getSummary();
    return ApiResponse.ok(res, summary, 'Dashboard summary retrieved successfully');
  });

  static getCategoryDistribution = asyncHandler(async (req, res) => {
    const distribution = await DashboardService.getCategoryDistribution();
    return ApiResponse.ok(res, distribution, 'Category stock distribution retrieved successfully');
  });

  static getRecentMovements = asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 10;
    const movements = await DashboardService.getRecentMovements(limit);
    return ApiResponse.ok(res, movements, 'Recent stock movements retrieved successfully');
  });

  static getLowStock = asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 10;
    const lowStock = await DashboardService.getLowStockProducts(limit);
    return ApiResponse.ok(res, lowStock, 'Low stock alert items retrieved successfully');
  });
}

