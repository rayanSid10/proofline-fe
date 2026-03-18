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
};

export default ibmbAPI;
