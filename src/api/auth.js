import api from '@/api/axios';

export const authAPI = {
  listUsers: () => api.get('/auth/users/'),
};

export default authAPI;
