import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const stored = localStorage.getItem('unidel-user');
  if (stored) {
    const user = JSON.parse(stored);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('unidel-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────
export const loginUser = (email: string, password: string) =>
  API.post('/auth/login', { email, password });

export const registerUser = (data: { name: string; email: string; password: string; role: string }) =>
  API.post('/auth/register', data);

// ─── Staff ─────────────────────────────────────
export const getDashboardStats = () => API.get('/staff/dashboard');
export const getStaffStats = () => API.get('/staff/stats');
export const getAllStaff = () => API.get('/staff');
export const getStaffById = (id: string) => API.get(`/staff/${id}`);
export const createStaff = (data: unknown) => API.post('/staff', data);
export const updateStaff = (id: string, data: unknown) => API.put(`/staff/${id}`, data);
export const deleteStaff = (id: string) => API.delete(`/staff/${id}`);
export const searchStaff = (params: Record<string, string>) => API.get('/staff/search', { params });
export const bulkCreateStaff = (staffList: unknown[]) => API.post('/staff/bulk', { staffList });

// ─── Attendance ────────────────────────────────
export const checkIn = (staffId: string) => API.post('/attendance/checkin', { staffId });
export const getActiveStaffNow = () => API.get('/attendance/active');
export const checkOut = (staffId: string) => API.post('/attendance/checkout', { staffId });
export const getTodayAttendance = () => API.get('/attendance/today');
export const getStaffAttendanceHistory = (staffId: string, params?: Record<string, string>) =>
  API.get(`/attendance/history/${staffId}`, { params });

// ─── Leave ─────────────────────────────────────
export const getAllLeaves = () => API.get('/leave');
export const applyForLeave = (data: unknown) => API.post('/leave', data);
export const approveLeave = (id: string, comment?: string) =>
  API.put(`/leave/${id}/approve`, { comment });

// ─── Promotion ─────────────────────────────────
export const getAllPromotions = () => API.get('/promotion');
export const vetPromotion = (data: { staffId: string; proposedDesignation: string; proposedGradeLevel: string }) =>
  API.post('/promotion/vet', data);