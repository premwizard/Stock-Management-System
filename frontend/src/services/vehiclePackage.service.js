import { apiClient } from './api';

export const vehiclePackageService = {
  /**
   * List vehicle packages with optional search and active status filters
   */
  getAll: async (params = {}) => {
    return apiClient.get('/vehicle-packages', { params });
  },

  /**
   * Get single vehicle package details with all components and live stock
   */
  getById: async (id) => {
    return apiClient.get(`/vehicle-packages/${id}`);
  },

  /**
   * Expand package into constituent products with vehicle multiplier
   */
  expand: async (id, multiplier = 1) => {
    return apiClient.get(`/vehicle-packages/${id}/expand`, {
      params: { multiplier }
    });
  },

  /**
   * Create a new vehicle package
   */
  create: async (data) => {
    return apiClient.post('/vehicle-packages', data);
  },

  /**
   * Update an existing vehicle package
   */
  update: async (id, data) => {
    return apiClient.put(`/vehicle-packages/${id}`, data);
  },

  /**
   * Delete a vehicle package
   */
  delete: async (id) => {
    return apiClient.delete(`/vehicle-packages/${id}`);
  }
};

export default vehiclePackageService;
