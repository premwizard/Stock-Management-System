import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
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

