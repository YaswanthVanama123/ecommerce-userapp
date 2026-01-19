import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Validate coupon
export const validateCoupon = async (code, orderTotal, productIds = [], categoryIds = []) => {
  try {
    const response = await axiosInstance.post('/coupons/validate', {
      code,
      orderTotal,
      productIds,
      categoryIds
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Apply coupon
export const applyCoupon = async (code, orderTotal, productIds = [], categoryIds = []) => {
  try {
    const response = await axiosInstance.post('/coupons/apply', {
      code,
      orderTotal,
      productIds,
      categoryIds
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  validateCoupon,
  applyCoupon
};
