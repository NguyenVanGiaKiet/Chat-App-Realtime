import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const usersAPI = {
  search: (q) => api.get(`/users/search?q=${q}`),
  getById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
};

export const roomsAPI = {
  getAll: () => api.get('/rooms'),
  create: (data) => api.post('/rooms', data),
  createDirect: (targetUserId) => api.post('/rooms/direct', { targetUserId }),
  getById: (id) => api.get(`/rooms/${id}`),
  getMessages: (id, page = 1) => api.get(`/rooms/${id}/messages?page=${page}`),
  leave: (id) => api.delete(`/rooms/${id}/leave`),
};

export const messagesAPI = {
  uploadImage: (formData) =>
    api.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/messages/${id}`),
  react: (id, emoji) => api.post(`/messages/${id}/react`, { emoji }),
};

export default api;
