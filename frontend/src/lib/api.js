// frontend\src\lib\api.js
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Companies
export const companiesApi = {
  list: (params) => api.get("/companies", { params }),
  get: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post("/companies", data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
  archive: (id) => api.put(`/companies/${id}/archive`),
};

// Departments
export const departmentsApi = {
  list: (companyId) => api.get(`/departments/companies/${companyId}/departments`),
  get: (id) => api.get(`/departments/${id}`),
  getStaff: (id) => api.get(`/departments/${id}/staff`),
  create: (companyId, data) => api.post(`/departments/companies/${companyId}/departments`, data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Staff
export const staffApi = {
  list: (companyId, isActive = true) => api.get(`/staff/companies/${companyId}/staff?is_active=${isActive}`),
  get: (id) => api.get(`/staff/${id}`),
  create: (companyId, data) =>
    api.post(`/staff/companies/${companyId}/staff`, data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id, reason) => api.delete(`/staff/${id}`, { params: { reason } }),
  restore: (id, data) => api.post(`/staff/${id}/restore`, data),
};

// Meetings
export const meetingsApi = {
  list: (companyId) => api.get(`/meetings/companies/${companyId}/meetings`),
  get: (id) => api.get(`/meetings/${id}`),
  create: (companyId, data) =>
    api.post(`/meetings/companies/${companyId}/meetings`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
  getMessages: (id) => api.get(`/meetings/${id}/messages`),
  sendMessage: (meetingId, staffId, data) =>
    api.post(`/meetings/${meetingId}/messages?staff_id=${staffId}`, data),
  updateMessage: (messageId, data) => api.put(`/meetings/messages/${messageId}`, data),
  resendMessage: (messageId, staffId) => api.post(`/meetings/messages/${messageId}/resend?staff_id=${staffId}`),
  askAll: (meetingId, data) => api.post(`/meetings/${meetingId}/ask-all`, data),
  updateStatus: (id, data) => api.put(`/meetings/${id}/status`, data),
  uploadImage: (meetingId, data) =>
    api.post(`/meetings/${meetingId}/upload-image`, data),
  getImages: (meetingId) => api.get(`/meetings/${meetingId}/images`),
  getActionItems: (meetingId) => api.get(`/meetings/${meetingId}/action-items`),
  createActionItem: (meetingId, data) =>
    api.post(`/meetings/${meetingId}/action-items`, data),
  completeActionItem: (itemId) =>
    api.put(`/meetings/action-items/${itemId}/complete`),
};

// Knowledge
export const knowledgeApi = {
  list: (companyId) => api.get(`/knowledge/companies/${companyId}/knowledge`),
  create: (companyId, data) => {
    // Check if data is FormData (file upload) or JSON
    if (data instanceof FormData) {
      return api.post(`/knowledge/companies/${companyId}/knowledge`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    }
    // Fallback for simple JSON (though backend now prefers Form, this keeps older calls safe if any)
    // Actually, backend now strictly requires Form Data for this endpoint.
    // So we should convert object to FormData if it isn't already.
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    return api.post(`/knowledge/companies/${companyId}/knowledge`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },
  delete: (id) => api.delete(`/knowledge/${id}`),
};

// LLM
export const llmApi = {
  getProviders: () => api.get("/llm/providers"),
  getOllamaModels: () => api.get("/llm/ollama/models"),
};

// Settings
export const settingsApi = {
  get: () => api.get('/settings/'),
  update: (data) => api.post('/settings/', data),
};

// Assets
export const assetsApi = {
  list: (companyId) => api.get(`/companies/${companyId}/assets`),
  get: (companyId, assetId) => api.get(`/companies/${companyId}/assets/${assetId}`),
  create: (companyId, formData) => api.post(`/companies/${companyId}/assets/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (companyId, assetId) => api.delete(`/companies/${companyId}/assets/${assetId}`),
};

// Library
export const libraryApi = {
  list: () => api.get("/library"),
  get: (slug) => api.get(`/library/${slug}`),
  create: (data) => api.post("/library", data),
  update: (id, data) => api.put(`/library/${id}`, data),
  delete: (id) => api.delete(`/library/${id}`),
};

export default api;
