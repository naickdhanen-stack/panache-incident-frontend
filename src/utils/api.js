import axios from 'axios';
import { API_URL } from './config';

// ======================
// AXIOS INSTANCE SETUP
// ======================

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30s timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// ======================
// REQUEST INTERCEPTOR
// ======================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ======================
// FIXED RESPONSE INTERCEPTOR ✔
// ======================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // Identify login request
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    // Handle only REAL protected route 401 errors
    if (status === 401 && !isLoginRequest) {
      const hasToken = localStorage.getItem('token');

      if (hasToken) {
        // Clear token + user safely
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Prevent redirect loop
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }

    // Build enhanced error for frontend
    const enhancedError = {
      ...error,
      message: error.response?.data?.error || error.message || 'An unexpected error occurred',
      statusCode: status,
      timestamp: new Date().toISOString(),
    };

    return Promise.reject(enhancedError);
  }
);

// ======================
// FILE VALIDATION UTILITIES
// ======================
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_FILES: 5,
  ALLOWED_MIME_TYPES: [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    // Videos
    'video/mp4',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
    'video/webm'
  ],
  ALLOWED_EXTENSIONS: [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
    'mp4', 'mov', 'avi', 'webm'
  ]
};

export const validateFiles = (files) => {
  if (!files || files.length === 0) {
    return { valid: true };
  }

  if (files.length > FILE_CONFIG.MAX_FILES) {
    return { valid: false, error: `Maximum ${FILE_CONFIG.MAX_FILES} files allowed` };
  }

  for (const file of files) {
    if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds ${FILE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
        file
      };
    }

    if (!FILE_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!FILE_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
        return {
          valid: false,
          error: `File "${file.name}" type (${file.type || ext}) is not allowed.`,
          file
        };
      }
    }
  }

  return { valid: true };
};

// ======================
// API SERVICES - FIXED WITH /api PREFIX
// ======================

// 🔐 Users API
export const usersAPI = {
  getAll: () => api.get('/api/users'),
  getById: (id) => api.get(`/api/users/${id}`),
  create: (userData) => api.post('/api/users', userData),
  update: (id, userData) => api.put(`/api/users/${id}`, userData),
  archive: (id) => api.patch(`/api/users/${id}/archive`),
  delete: (id) => api.delete(`/api/users/${id}`)
};

// 📝 Incidents API
export const incidentsAPI = {
  getAll: () => api.get('/api/incidents'),
  getById: (id) => api.get(`/api/incidents/${id}`),

  create: (formData) => {
    const attachments = formData.getAll('attachments').filter(f => f instanceof File);
    const validation = validateFiles(attachments);
    if (!validation.valid) {
      return Promise.reject(new Error(validation.error));
    }

    return api.post('/api/incidents', formData);
  },

  acknowledge: (id, data) => api.post(`/api/incidents/${id}/acknowledge`, data),
  updateStatus: (id, status) => api.patch(`/api/incidents/${id}/status`, { status }),
  delete: (id) => api.delete(`/api/incidents/${id}`),

  validateFiles
};

// ======================
// EXPORTS
// ======================
export default api;