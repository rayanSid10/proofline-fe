import api from '@/api/axios';

export const ftdhAPI = {
  // Inward FTDH endpoints
  listInward: (params) => api.get('/ftdh/inward/', { params }),
  getInward: (id) => api.get(`/ftdh/inward/${id}/`),
  patchInward: (id, payload) => api.patch(`/ftdh/inward/${id}/`, payload),
  setStatus: (id, status) => api.post(`/ftdh/inward/${id}/set_status/`, { status }),
  assign: (id, userId) => api.post(`/ftdh/inward/${id}/assign/`, { user_id: userId }),
  acknowledge: (id) => api.post(`/ftdh/inward/${id}/acknowledge/`),
  sendIntimation: (id) => api.post(`/ftdh/inward/${id}/send_intimation/`),
  sendReminder: (id, reminderNumber) => api.post(`/ftdh/inward/${id}/send_reminder/`, { reminder_number: reminderNumber }),
  getReminderEligibility: (id, reminderNumber) => api.get(`/ftdh/inward/${id}/reminder_eligibility/`, { params: { reminder_number: reminderNumber } }),
  submitBranchResponse: (id, payload) => api.post(`/ftdh/inward/${id}/submit_branch_response/`, payload),
  reviewBranchResponse: (id, payload) => api.post(`/ftdh/inward/${id}/review_branch_response/`, payload),
  submitBusinessConsideration: (id, payload) => api.post(`/ftdh/inward/${id}/submit_business_consideration/`, payload),
  respondMemberBankMock: (id, payload) => api.post(`/ftdh/inward/${id}/respond_member_bank_mock/`, payload),

  // Outward FTDH endpoints
  listOutward: (params) => api.get('/ftdh/outward/', { params }),
  getOutward: (id) => api.get(`/ftdh/outward/${id}/`),
  createOutward: (data) => api.post('/ftdh/outward/', data),
  startOutwardComm: (id) => api.post(`/ftdh/outward/${id}/start_communication/`),
  mockOutwardResponse: (id, data) => api.post(`/ftdh/outward/${id}/mock_response/`, data),
  getOutwardReport: (id) => api.get(`/ftdh/outward/${id}/report/`),

  // Google Sheet import
  importFromSheet: () => api.post('/ftdh/inward/import/'),

  // Update Snapshot (draft-save for Update Modal)
  getUpdateSnapshot: (id) => api.get(`/ftdh/inward/${id}/update_snapshot/`),
  patchUpdateSnapshot: (id, payload) => api.patch(`/ftdh/inward/${id}/update_snapshot/`, payload),
  uploadSnapshotFiles: (id, files, stageKey = 'stage3') => {
    const formData = new FormData();
    formData.append('stage_key', stageKey);
    for (const f of files) formData.append('files', f);
    return api.post(`/ftdh/inward/${id}/update_snapshot/upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteSnapshotAttachment: (id, attachmentId) =>
    api.delete(`/ftdh/inward/${id}/update_snapshot/attachment/${attachmentId}/`),

  // Branch portal
  listBranchAssigned: (params) => api.get('/ftdh/branch/assigned/', { params }),
};

export default ftdhAPI;
