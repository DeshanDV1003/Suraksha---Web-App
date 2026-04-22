import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  changePassword: (data: any) => api.post('/auth/change-password', data),
};

export const incidentService = {
  getIncidents: () => api.get('/incidents'),
  getIncidentById: (id: string) => api.get(`/incidents/${id}`),
  createIncident: (data: any) => api.post('/incidents', data),
  updateStatus: (id: string, status: string) => api.patch(`/incidents/${id}/status`, { status }),
  deleteIncident: (id: string) => api.delete(`/incidents/${id}`),
};

export const alertService = {
  createAlert: (data: any) => api.post('/alerts', data),
  getAlerts: () => api.get('/alerts'),
  deactivateAlert: (id: string) => api.patch(`/alerts/${id}/deactivate`),
  deleteAlert: (id: string) => api.delete(`/alerts/${id}`),
};

export const campService = {
  getCamps: () => api.get('/camps'),
  createCamp: (data: any) => api.post('/camps', data),
};

export const userService = {
  getUsers: () => api.get('/users'),
  updateProfile: (data: any) => api.patch('/users/profile', data),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

export const resourceService = {
  getResources: () => api.get('/resources'),
  createResource: (data: any) => api.post('/resources', data),
  updateStatus: (id: string, status: string) => api.patch(`/resources/${id}/status`, { status }),
};

export const tokenService = {
  getTokens: () => api.get('/tokens'),
  createToken: (data: any) => api.post('/tokens', data),
  useToken: (code: string) => api.post('/tokens/use', { code }),
};

export default api;
