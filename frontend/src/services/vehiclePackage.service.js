import api from './api';

export const vehiclePackageService = {
  /**
   * List vehicle packages with optional search and active status filters
   */
  async getAll(params = {}) {
    const res = await api.get('/vehicle-packages', { params });
    return res.data;
  },

  /**
   * Get single vehicle package details with all components and live stock
   */
  async getById(id) {
    const res = await api.get(`/vehicle-packages/${id}`);
    return res.data;
  },

  /**
   * Expand package into constituent products with vehicle multiplier
   */
  async expand(id, multiplier = 1) {
    const res = await api.get(`/vehicle-packages/${id}/expand`, {
      params: { multiplier }
    });
    return res.data;
  },

  /**
   * Create a new vehicle package
   */
  async create(data) {
    const res = await api.post('/vehicle-packages', data);
    return res.data;
  },

  /**
   * Update an existing vehicle package
   */
  async update(id, data) {
    const res = await api.put(`/vehicle-packages/${id}`, data);
    return res.data;
  },

  /**
   * Delete a vehicle package
   */
  async delete(id) {
    const res = await api.delete(`/vehicle-packages/${id}`);
    return res.data;
  }
};
