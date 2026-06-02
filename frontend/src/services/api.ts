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
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (token: string) => api.post('/auth/2fa/verify', { token }),
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
  getCampById: (id: string) => api.get(`/camps/${id}`),
  createCamp: (data: any) => api.post('/camps', data),
  updateOccupancy: (id: string, occupancy: number) => api.patch(`/camps/${id}/occupancy`, { currentOccupancy: occupancy }),
  // Residents
  getResidents: (id: string) => api.get(`/camps/${id}/residents`),
  addResident: (id: string, data: any) => api.post(`/camps/${id}/residents`, data),
  checkoutResident: (residentId: string) => api.patch(`/camps/residents/${residentId}/checkout`),
  // Inventory
  updateInventory: (id: string, data: any) => api.patch(`/camps/${id}/inventory`, data),
  // Schedule
  addSchedule: (id: string, data: any) => api.post(`/camps/${id}/schedule`, data),
  deleteSchedule: (scheduleId: string) => api.delete(`/camps/schedule/${scheduleId}`),
  // Referrals
  addReferral: (id: string, data: any) => api.post(`/camps/${id}/referrals`, data),
  updateReferral: (referralId: string, status: string) => api.patch(`/camps/referrals/${referralId}`, { status }),
  // Transfers
  createTransfer: (id: string, toCampId: string, peopleCount: number) => api.post(`/camps/${id}/transfers`, { toCampId, peopleCount }),
  updateTransfer: (transferId: string, status: string) => api.patch(`/camps/transfers/${transferId}`, { status }),
};

export const userService = {
  getUsers: () => api.get('/users'),
  getMe: () => api.get('/users/me'),
  updateProfile: (data: any) => api.patch('/users/profile', data),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  getRBACMatrix: () => api.get('/users/rbac'),
  updateRBACMatrix: (data: any) => api.post('/users/rbac', data),
  bulkImport: (data: any[]) => api.post('/users/bulk-import', data),
  getAuditLogs: () => api.get('/users/audit'),
  toggleFieldResponderApp: (id: string, hasApp: boolean) => api.post(`/users/${id}/field-status`, { hasApp }),
  sendAppLink: (id: string) => api.post(`/users/${id}/send-app-link`),
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
  getProfile: () => api.get('/volunteers/profile'),
  addSkill: (data: any) => api.post('/volunteers/skills', data),
  addTraining: (data: any) => api.post('/volunteers/trainings', data),
  checkIn: (data: any) => api.post('/volunteers/checkin', data),
  checkOut: (checkInId: string) => api.post(`/volunteers/checkin/${checkInId}/checkout`),
  submitWellbeing: (data: any) => api.post('/volunteers/wellbeing', data),
  getRecommendedIncidents: () => api.get('/volunteers/recommended-incidents'),
  listVolunteers: () => api.get('/volunteers'),
  createTask: (data: any) => api.post('/volunteers/tasks', data),
  getMyTasks: () => api.get('/volunteers/tasks/my'),
  updateTaskStatus: (id: string, status: string) => api.patch(`/volunteers/tasks/${id}/status`, { status }),
};

export const helpRequestService = {
  createPublicRequest: (data: any) => api.post('/help-requests/public', data),
  mockSmsWebhook: (data: any) => api.post('/help-requests/webhook/sms', data),
  createRequest: (data: any) => api.post('/help-requests', data),
  getRequests: () => api.get('/help-requests'),
  assignResponder: (id: string, volunteerId: string) => api.patch(`/help-requests/${id}/assign`, { volunteerId }),
  updateStatus: (id: string, status: string) => api.patch(`/help-requests/${id}/status`, { status }),
  getClusters: () => api.get('/help-requests/clusters'),
  checkEscalations: () => api.post('/help-requests/escalations/check'),
  registerVerifier: (data: any) => api.post('/help-requests/verifier/register', data),
  verifyAction: (data: any) => api.post('/help-requests/verifier/verify', data),
};

export const reliefTokenService = {
  getTokens: () => api.get('/relief-tokens'),
  getTokenByCode: (code: string) => api.get(`/relief-tokens/${code}`),
  issueToken: (data: any) => api.post('/relief-tokens/issue', data),
  claimToken: (data: any) => api.post('/relief-tokens/claim', data),
  createDonorCampaign: (data: any) => api.post('/relief-tokens/donors', data),
  getDonorCampaigns: () => api.get('/relief-tokens/donors/all'),
  getFraudAnalytics: () => api.get('/relief-tokens/analytics/fraud'),
};

export const damageAssessmentService = {
  reportDamage: (data: any) => api.post('/assessments/damage', data),
  getAssessments: () => api.get('/assessments/damage'),
  aiClassifyImage: (imageUrl: string) => api.post('/assessments/damage/ai-classify', { imageUrl }),
  updateWorkflowStatus: (id: string, status: string, reviewerNotes?: string) => api.patch(`/assessments/damage/${id}/workflow`, { status, reviewerNotes }),
  getDistrictSummaryReport: () => api.get('/assessments/damage/district-report'),
};

export const missingPersonService = {
  reportMissing: (data: any) => api.post('/missing-persons', data),
  getMissing: () => api.get('/missing-persons'),
  updateStatus: (id: string, status: string) => api.patch(`/missing-persons/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/missing-persons/${id}`),
  searchFace: (imageUrl: string) => api.post('/missing-persons/search-face', { imageUrl }),
  triggerReunification: (id: string, status: string, notes: string) => api.patch(`/missing-persons/${id}/reunify`, { status, notes }),
  runCrossReference: () => api.get('/missing-persons/cross-reference'),
  
  // Public endpoints
  publicGetMissing: () => api.get('/missing-persons/public'),
  publicReportMissing: (data: any) => api.post('/missing-persons/public', data),
};

export const supportService = {
  createRequest: (data: any) => api.post('/support', data),
  getRequests: () => api.get('/support'),
  updateStatus: (id: string, data: any) => api.patch(`/support/${id}/status`, data),
};

export const psychSupportService = {
  getTrends: () => api.get('/psych-support/trends'),
  getCheckIns: () => api.get('/psych-support/checkins'),
  updateCheckIn: (id: string, status: string, nextDate: string | null) => api.patch(`/psych-support/checkins/${id}`, { status, nextDate }),
  getGuides: () => api.get('/psych-support/guides'),
  getGroups: () => api.get('/psych-support/groups'),
  createGroup: (data: any) => api.post('/psych-support/groups', data),
  joinGroup: (id: string) => api.post(`/psych-support/groups/${id}/join`),
  getChats: () => api.get('/psych-support/chat'),
  acceptChat: (id: string) => api.patch(`/psych-support/chat/${id}/accept`),
  endChat: (id: string, moodAfter: string) => api.patch(`/psych-support/chat/${id}/end`, { moodAfter }),
  sendMessage: (id: string, content: string) => api.post(`/psych-support/chat/${id}/message`, { content })
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

export const analyticsService = {
  getOperationalIntelligence: () => api.get('/analytics/operational-intelligence'),
  generateAAR: (incidentId: string) => api.post(`/analytics/aar/${incidentId}`),
  getKPIBenchmarks: (month: string) => api.get(`/analytics/kpis?month=${month}`),
  getVulnerabilityIndex: () => api.get('/analytics/vulnerability'),
  getDisasterBudgets: () => api.get('/analytics/budgets'),
};

export const auditService = {
  getLogs: () => api.get('/audit'),
};

export const notificationService = {
  getNotifications: () => api.get('/notifications/my'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

export const locationService = {
  logLocation: (data: any) => api.post('/location/log', data),
  getUserLocation: (userId: string) => api.get(`/location/user/${userId}`),
};

export const mapService = {
  createEvacuationRoute: (data: any) => api.post('/map/routes', data),
  getEvacuationRoutes: () => api.get('/map/routes'),
  createVolunteerLocation: (data: any) => api.post('/map/volunteers', data),
  getVolunteerLocations: () => api.get('/map/volunteers'),
  createThreatProjection: (data: any) => api.post('/map/projections', data),
  getThreatProjections: () => api.get('/map/projections'),
};

export default api;
