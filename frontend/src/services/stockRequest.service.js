import { apiClient } from './api';

export const stockRequestService = {
  /**
   * Create a new draft stock request
   * @param {{ items: Array<{ productId: string, requestedQuantity: number }>, notes?: string }} data
   */
  create: async (data) => {
    return apiClient.post('/stock-requests', data);
  },

  /**
   * List paginated stock requests
   * @param {{ page?: number, limit?: number, status?: string, search?: string }} params
   */
  getAll: async (params = {}) => {
    return apiClient.get('/stock-requests', { params });
  },

  /**
   * Get single stock request by ID
   * @param {string} id
   */
  getById: async (id) => {
    return apiClient.get(`/stock-requests/${id}`);
  },

  /**
   * Update items/notes on an unconfirmed DRAFT stock request
   * @param {string} id
   * @param {{ items: Array<{ productId: string, requestedQuantity: number }>, notes?: string }} data
   */
  update: async (id, data) => {
    return apiClient.put(`/stock-requests/${id}`, data);
  },

  /**
   * Confirm a stock request and trigger automatic inventory deduction
   * @param {string} id
   */
  confirm: async (id) => {
    return apiClient.post(`/stock-requests/${id}/confirm`);
  },

  /**
   * Cancel an unconfirmed draft stock request
   * @param {string} id
   */
  cancel: async (id) => {
    return apiClient.post(`/stock-requests/${id}/cancel`);
  }
};

