/**
 * Dashboard API calls
 */
import api from './axios';

/**
 * Get comprehensive dashboard statistics
 * @returns {Promise} Dashboard stats with IBMB and FTDH metrics
 */
export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats/');
  return response.data;
};

export default {
  getDashboardStats,
};
