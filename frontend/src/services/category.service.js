import { apiClient } from './api';

export const categoryService = {
  getAll: (withStats = true) => apiClient.get('/categories', { params: { withStats } }),
  getById: (id) => apiClient.get(`/categories/${id}`),
  create: (data) => apiClient.post('/categories', data),
  update: (id, data) => apiClient.put(`/categories/${id}`, data),
  delete: (id) => apiClient.delete(`/categories/${id}`)
};

