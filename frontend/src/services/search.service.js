import { apiClient } from './api';

export const searchService = {
  searchProducts: (params) => apiClient.get('/products/search', { params })
};

