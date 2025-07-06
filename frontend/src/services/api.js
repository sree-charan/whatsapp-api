import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
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

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refresh: () => api.post('/auth/refresh'),
  profile: () => api.get('/auth/profile'),
  changePassword: (data) => api.post('/auth/change-password', data),
  regenerateApiKey: () => api.post('/auth/regenerate-api-key'),
  deleteAccount: () => api.delete('/auth/account'),
};

// Sessions API
export const sessionsAPI = {
  list: () => api.get('/sessions'),
  create: (sessionData) => api.post('/sessions', sessionData),
  get: (sessionId) => api.get(`/sessions/${sessionId}`),
  start: (sessionId) => api.post(`/sessions/${sessionId}/start`),
  stop: (sessionId) => api.post(`/sessions/${sessionId}/stop`),
  restart: (sessionId) => api.post(`/sessions/${sessionId}/restart`),
  clearAuth: (sessionId) => api.post(`/sessions/${sessionId}/clear-auth`),
  delete: (sessionId) => api.delete(`/sessions/${sessionId}`),
  getStatus: (sessionId) => api.get(`/sessions/${sessionId}/status`),
  getQR: (sessionId) => api.get(`/sessions/${sessionId}/qr`),
  updateSettings: (sessionId, settings) => api.put(`/sessions/${sessionId}/settings`, settings),
};

// Messages API
export const messagesAPI = {
  // File upload
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Message sending
  sendText: (data) => api.post('/messages/send/text', data),
  sendImage: (data) => api.post('/messages/send/image', data),
  sendVideo: (data) => api.post('/messages/send/video', data),
  sendAudio: (data) => api.post('/messages/send/audio', data),
  sendDocument: (data) => api.post('/messages/send/document', data),
  sendLocation: (data) => api.post('/messages/send/location', data),
  sendContact: (data) => api.post('/messages/send/contact', data),
  sendBulk: (data) => api.post('/messages/send/bulk', data),
  
  // Message history
  getHistory: (sessionId, params) => api.get(`/messages/history/${sessionId}`, { params }),
};

// Webhooks API
export const webhooksAPI = {
  test: (data) => api.post('/webhook/test', data),
  updateConfig: (sessionId, config) => api.put(`/webhook/config/${sessionId}`, config),
  getConfig: (sessionId) => api.get(`/webhook/config/${sessionId}`),
  getStats: (sessionId) => api.get(`/webhook/stats/${sessionId || ''}`),
  clearQueue: (sessionId) => api.delete(`/webhook/queue/${sessionId}`),
  getQueue: () => api.get('/webhook/queue'),
  sendTest: (sessionId, data) => api.post(`/webhook/send-test/${sessionId}`, data),
  getEventTypes: () => api.get('/webhook/event-types'),
};

// Status API
export const statusAPI = {
  health: () => api.get('/status/health'),
  stats: () => api.get('/status/stats'),
  performance: () => api.get('/status/performance'),
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.response?.data?.error) {
    return error.response.data.error;
  } else if (error.message) {
    return error.message;
  } else {
    return 'An unexpected error occurred';
  }
};

export const formatPhoneNumber = (phone) => {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add @s.whatsapp.net if not already present
  if (!cleaned.includes('@')) {
    return `${cleaned}@s.whatsapp.net`;
  }
  
  return cleaned;
};

export const isValidPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

export default api; 