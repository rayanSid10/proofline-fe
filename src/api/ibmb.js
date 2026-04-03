import api from '@/api/axios';

export const ibmbAPI = {
  // ─── Customers ────────────────────────────────────────────────────
  searchCustomers: (q) => api.get('/ibmb/customers/search/', { params: { q } }),
  getCustomer: (id) => api.get(`/ibmb/customers/${id}/`),

  // ─── Account Transactions ─────────────────────────────────────────
  getAccountTransactions: (accountId, params = {}) =>
    api.get(`/ibmb/accounts/${accountId}/transactions/`, { params }),

  // ─── Investigators ────────────────────────────────────────────────
  listInvestigators: () => api.get('/ibmb/investigators/'),

  // ─── Cases CRUD ───────────────────────────────────────────────────
  listCases: (params) => api.get('/ibmb/cases/', { params }),
  importCasesWorkbook: (formData) =>
    api.post('/ibmb/cases/import-workbook/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getCase: (id) => api.get(`/ibmb/cases/${id}/`),
  createCase: (data) => api.post('/ibmb/cases/', data),
  updateCase: (id, data) => api.put(`/ibmb/cases/${id}/`, data),
  patchCase: (id, data) => api.patch(`/ibmb/cases/${id}/`, data),
  deleteCase: (id) => api.delete(`/ibmb/cases/${id}/`),

  // ─── Investigation ────────────────────────────────────────────────
  getInvestigation: (caseId) =>
    api.get(`/ibmb/cases/${caseId}/investigation/`),

  saveInvestigation: (caseId, data) =>
    api.patch(`/ibmb/cases/${caseId}/investigation/`, data),

  submitInvestigation: (caseId) =>
    api.post(`/ibmb/cases/${caseId}/investigation/submit/`),

  reviewInvestigation: (caseId, data, options = {}) => {
    if (options.isMultipart) {
      return api.post(`/ibmb/cases/${caseId}/investigation/review/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post(`/ibmb/cases/${caseId}/investigation/review/`, data);
  },

  // ─── Investigation Files ──────────────────────────────────────────
  listInvestigationFiles: (caseId) =>
    api.get(`/ibmb/cases/${caseId}/investigation/files/`),

  uploadInvestigationFile: (caseId, formData) =>
    api.post(`/ibmb/cases/${caseId}/investigation/files/`, formData),

  deleteInvestigationFile: (caseId, fileId) =>
    api.delete(`/ibmb/cases/${caseId}/investigation/files/${fileId}/`),

  // ─── Activity Log Parsing (Gemini) ─────────────────────────────────
  /**
   * Parse activity log file using Gemini 1.5 Flash API.
   *
   * @param {File} file - The activity log file to parse
   * @returns {Promise} - Response with extracted fields
   */
  parseActivityLog: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/ibmb/activity-log/parse/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Parse activity log content (raw text) using Gemini 1.5 Flash API.
   *
   * @param {string} content - Raw text content of the activity log
   * @returns {Promise} - Response with extracted fields
   */
  parseActivityLogContent: (content) =>
    api.post('/ibmb/activity-log/parse/', { content }),
};

export default ibmbAPI;
