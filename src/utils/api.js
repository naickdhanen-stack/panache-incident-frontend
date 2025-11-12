import axios from 'axios';
import { API_URL } from './config';

// Set base URL
axios.defaults.baseURL = API_URL;

// Add token to all requests
axios.interceptors.request.use(
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

// Handle unauthorized responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Users API
export const usersAPI = {
  getAll: () => axios.get('/users'),
  getById: (id) => axios.get(`/users/${id}`),
  create: (userData) => axios.post('/users', userData),
  update: (id, userData) => axios.put(`/users/${id}`, userData),
  archive: (id) => axios.patch(`/users/${id}/archive`),
  delete: (id) => axios.delete(`/users/${id}`)
};

// Incidents API
export const incidentsAPI = {
  getAll: () => axios.get('/incidents'),
  getById: (id) => axios.get(`/incidents/${id}`),
  create: (formData) => axios.post('/incidents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  acknowledge: (id, data) => axios.post(`/incidents/${id}/acknowledge`, data),
  updateStatus: (id, status) => axios.patch(`/incidents/${id}/status`, { status }),
  delete: (id) => axios.delete(`/incidents/${id}`),
  validateFiles: (files) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/', 'video/'];
    
    if (!files || files.length === 0) {
      return { valid: true };
    }
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File "${file.name}" exceeds 10MB limit`
        };
      }
      
      const isAllowedType = ALLOWED_TYPES.some(type => file.type.startsWith(type));
      if (!isAllowedType) {
        return {
          valid: false,
          error: `File "${file.name}" is not an image or video`
        };
      }
    }
    
    return { valid: true };
  }
};

export default axios;