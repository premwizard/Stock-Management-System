import { apiClient } from './api';

export const dashboardService = {
  getSummary: () => apiClient.get('/dashboard/summary'),
  getCategoryDistribution: () => apiClient.get('/dashboard/category-distribution'),
  getRecentMovements: (limit = 10) => apiClient.get('/dashboard/recent-movements', { params: { limit } }),
  getLowStock: (limit = 10) => apiClient.get('/dashboard/low-stock', { params: { limit } })
};

