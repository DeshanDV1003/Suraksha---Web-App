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

export const volunteerService = {
  upsertProfile: (data: any) => api.post('/volunteers/profile', data),
  getProfile: () => api.get('/volunteers/profile'),
  listVolunteers: () => api.get('/volunteers/list'),
  createTask: (data: any) => api.post('/volunteers/tasks', data),
  getMyTasks: () => api.get('/volunteers/tasks/my'),
  updateTaskStatus: (id: string, status: string) => api.patch(`/volunteers/tasks/${id}/status`, { status }),
};

export const helpRequestService = {
  createRequest: (data: any) => api.post('/help-requests', data),
  getRequests: () => api.get('/help-requests'),
  registerVerifier: (data: any) => api.post('/help-requests/verifier/register', data),
  verifyAction: (data: any) => api.post('/help-requests/verifier/verify', data),
};

export const reliefTokenService = {
  issueToken: (data: any) => api.post('/relief-tokens/issue', data),
  claimToken: (data: any) => api.post('/relief-tokens/claim', data),
  recordDistribution: (data: any) => api.post('/relief-tokens/distribution', data),
};

export const assessmentService = {
  reportDamage: (data: any) => api.post('/assessments/damage', data),
  getAssessments: () => api.get('/assessments/damage'),
  reportMissing: (data: any) => api.post('/assessments/missing', data),
  getMissing: () => api.get('/assessments/missing'),
  updateMissingStatus: (id: string, status: string) => api.patch(`/assessments/missing/${id}/status`, { status }),
};

export const supportService = {
  createRequest: (data: any) => api.post('/support', data),
  getRequests: () => api.get('/support'),
  updateStatus: (id: string, data: any) => api.patch(`/support/${id}/status`, data),
};

export default api;
