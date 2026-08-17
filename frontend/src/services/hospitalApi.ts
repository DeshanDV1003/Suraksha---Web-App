import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const hospitalApi = {
  getDashboard: () => api.get('/hospital/dashboard').then((r) => r.data),
  getReferrals: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/hospital/referrals', { params }).then((r) => r.data),
  updateReferral: (id: string, data: any) => api.patch(`/hospital/referrals/${id}`, data).then((r) => r.data),
  getCapacity: () => api.get('/hospital/capacity').then((r) => r.data),
  updateCapacity: (data: { availableBeds?: number; totalBeds?: number }) =>
    api.patch('/hospital/capacity', data).then((r) => r.data),
  createWard: (data: { name: string; totalBeds: number }) =>
    api.post('/hospital/wards', data).then((r) => r.data),
  updateWard: (wardId: string, data: { availableBeds?: number; totalBeds?: number }) =>
    api.patch(`/hospital/wards/${wardId}`, data).then((r) => r.data),
  // Admin
  listHospitals: () => api.get('/hospitals').then((r) => r.data),
  createHospital: (data: any) => api.post('/hospitals', data).then((r) => r.data),
  getStaff: (hospitalId: string) => api.get(`/hospitals/${hospitalId}/staff`).then((r) => r.data),
  createStaff: (hospitalId: string, data: { name: string; email: string; password: string; phone?: string }) =>
    api.post(`/hospitals/${hospitalId}/staff`, data).then((r) => r.data),
  deleteStaff: (hospitalId: string, userId: string) =>
    api.delete(`/hospitals/${hospitalId}/staff/${userId}`).then((r) => r.data),
};
