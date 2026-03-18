import api from '@/api/axios';

export const authAPI = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  refresh: (refresh) => api.post('/auth/refresh/', { refresh }),
  me: () => api.get('/auth/me/'),
  listUsers: () => api.get('/auth/users/'),
};

export default authAPI;
