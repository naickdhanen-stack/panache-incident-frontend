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
  (error) => {
    return Promise.reject(error);
  }
);

// ======================
// RESPONSE INTERCEPTOR
// ======================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401: Unauthorized → logout & redirect
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Avoid redirect loop if already on /login
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    // Enhance error object for frontend consumption
    const enhancedError = {
      ...error,
      message: error.response?.data?.error || error.message || 'An unexpected error occurred',
      statusCode: error.response?.status,
      timestamp: new Date().toISOString()
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

/**
 * Validates an array of File objects
 * @param {File[]} files - Array of files to validate
 * @returns {{ valid: boolean, error?: string, file?: File }}
 */
export const validateFiles = (files) => {
  if (!files || files.length === 0) {
    return { valid: true };
  }

  // Check total count
  if (files.length > FILE_CONFIG.MAX_FILES) {
    return {
      valid: false,
      error: `Maximum ${FILE_CONFIG.MAX_FILES} files allowed`
    };
  }

  for (const file of files) {
    // Check file size
    if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds ${FILE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
        file
      };
    }

    // Check MIME type
    if (!FILE_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
      // Fallback to extension if MIME type is generic (e.g., 'application/octet-stream')
      const ext = file.name.split('.').pop().toLowerCase();
      if (!FILE_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
        return {
          valid: false,
          error: `File "${file.name}" type (${file.type || ext}) is not allowed. Only images and videos supported.`,
          file
        };
      }
    }
  }

  return { valid: true };
};

// ======================
// API SERVICES
// ======================

// 🔐 Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  archive: (id) => api.patch(`/users/${id}/archive`),
  delete: (id) => api.delete(`/users/${id}`)
};

// 📝 Incidents API
export const incidentsAPI = {
  /**
   * Fetch all incidents (with user & response data)
   * @returns {Promise<AxiosResponse<{id: number, subject: string, attachments: string[], ...}[]>>}
   */
  getAll: () => api.get('/incidents'),

  /**
   * Fetch single incident by ID
   * @param {number} id
   * @returns {Promise<AxiosResponse<Incident>>}
   */
  getById: (id) => api.get(`/incidents/${id}`),

  /**
   * Create new incident (with optional attachments)
   * @param {FormData} formData - Must contain incident fields + optional `attachments[]` files
   * @returns {Promise<AxiosResponse<Incident>>}
   * 
   * ✅ IMPORTANT: Do NOT set 'Content-Type' header — let Axios auto-set multipart boundary.
   */
  create: (formData) => {
    // Optional: Validate before sending (frontend-only safety net)
    const attachments = formData.getAll('attachments').filter(f => f instanceof File);
    const validation = validateFiles(attachments);
    if (!validation.valid) {
      return Promise.reject(new Error(validation.error));
    }

    return api.post('/incidents', formData);
  },

  /**
   * Acknowledge an incident (HR response)
   * @param {number} id
   * @param {Object} data - { investigation_findings, root_cause, ... }
   * @returns {Promise<AxiosResponse<Incident>>}
   */
  acknowledge: (id, data) => api.post(`/incidents/${id}/acknowledge`, data),

  /**
   * Update incident status only
   * @param {number} id
   * @param {string} status - 'open' | 'in-progress' | 'closed'
   * @returns {Promise<AxiosResponse<Incident>>}
   */
  updateStatus: (id, status) => api.patch(`/incidents/${id}/status`, { status }),

  /**
   * Delete incident
   * @param {number} id
   * @returns {Promise<AxiosResponse<void>>}
   */
  delete: (id) => api.delete(`/incidents/${id}`),

  // Re-export utility for convenience
  validateFiles
};

// ======================
// EXPORTS
// ======================
export default api;

/**
 * @typedef {Object} Incident
 * @property {number} id
 * @property {string} subject
 * @property {string} date_of_incident
 * @property {string} details_and_findings
 * @property {string} [project_name]
 * @property {string} [sales_work_order_number]
 * @property {string} source_of_incident
 * @property {boolean} preliminary_investigation
 * @property {string} [suggestions]
 * @property {string} status
 * @property {string} created_at
 * @property {string[]} attachments - Array of public URLs
 * @property {User} user
 * @property {IncidentResponse[]} incident_responses
 */

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} role
 * @property {string} department
 * @property {boolean} is_active
 * @property {string} created_at
 */

/**
 * @typedef {Object} IncidentResponse
 * @property {number} id
 * @property {string} investigation_findings
 * @property {string} root_cause
 * @property {string} action_taken
 * @property {string} [further_action_plan]
 * @property {string} acknowledged_at
 * @property {string} [attachments] - Optional HR evidence URLs (future)
 */