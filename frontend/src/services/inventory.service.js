import { apiClient } from './api';

export const inventoryService = {
  getAll: (params) => apiClient.get('/inventory', { params }),
  getByProductId: (productId) => apiClient.get(`/inventory/${productId}`),
  stockIn: (data) => apiClient.post('/inventory/stock-in', data),
  stockOut: (data) => apiClient.post('/inventory/stock-out', data),
  adjust: (data) => apiClient.post('/inventory/adjust', data),
  getMovements: (params) => apiClient.get('/inventory/movements', { params })
};

