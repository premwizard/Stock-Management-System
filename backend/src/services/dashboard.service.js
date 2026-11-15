import { DashboardRepository } from '../repositories/dashboard.repository.js';

export class DashboardService {
  /**
   * Get KPI metrics summary
   */
  static async getSummary() {
    return DashboardRepository.getSummary();
  }

  /**
   * Get category-wise inventory distribution
   */
  static async getCategoryDistribution() {
    return DashboardRepository.getCategoryDistribution();
  }

  /**
   * Get recent stock movements
   */
  static async getRecentMovements(limit = 10) {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    return DashboardRepository.getRecentMovements(safeLimit);
  }

  /**
   * Get low-stock attention list
   */
  static async getLowStockProducts(limit = 10) {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    return DashboardRepository.getLowStockProducts(safeLimit);
  }
}

