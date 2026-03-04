import api from '@/api/axios';

export const ftdhAPI = {
  // Inward FTDH endpoints
  listInward: (params) => api.get('/ftdh/inward/', { params }),
  getInward: (id) => api.get(`/ftdh/inward/${id}/`),

  // Outward FTDH endpoints
  listOutward: (params) => api.get('/ftdh/outward/', { params }),
  getOutward: (id) => api.get(`/ftdh/outward/${id}/`),
};

export default ftdhAPI;
