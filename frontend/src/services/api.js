import axios from 'axios';

/**
 * Dynamically resolves API base URL from Vite environment variables:
 * - VITE_API_URL or VITE_BACKEND_URL (e.g. "http://localhost:5000" or "https://api.yourdomain.com")
 * - VITE_API_PREFIX (defaults to "/api/v1")
 * - If VITE_API_URL is omitted or empty, defaults to "/api/v1" for relative proxy/single-origin deployments
 */
const rawBaseUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();
const apiPrefix = (import.meta.env.VITE_API_PREFIX || '/api/v1').trim();

const cleanBase = rawBaseUrl.replace(/\/+$/, '');
const cleanPrefix = apiPrefix.startsWith('/') ? apiPrefix : `/${apiPrefix}`;

export const API_BASE_URL = cleanBase ? `${cleanBase}${cleanPrefix}` : cleanPrefix;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for streamlined payload unwrapping
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors || []
    };
    return Promise.reject(customError);
  }
);

export const checkHealth = async () => {
  return apiClient.get('/health');
};

export default apiClient;
