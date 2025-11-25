import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Companies
export const companiesApi = {
  list: () => api.get("/companies"),
  get: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post("/companies", data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};

// Staff
export const staffApi = {
  list: (companyId) => api.get(`/staff/companies/${companyId}/staff`),
  get: (id) => api.get(`/staff/${id}`),
  create: (companyId, data) =>
    api.post(`/staff/companies/${companyId}/staff`, data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
};

// Meetings
export const meetingsApi = {
  list: (companyId) => api.get(`/meetings/companies/${companyId}/meetings`),
  get: (id) => api.get(`/meetings/${id}`),
  create: (companyId, data) =>
    api.post(`/meetings/companies/${companyId}/meetings`, data),
  delete: (id) => api.delete(`/meetings/${id}`), // <--- Added this line
  getMessages: (id) => api.get(`/meetings/${id}/messages`),
  sendMessage: (meetingId, staffId, data) =>
    api.post(`/meetings/${meetingId}/messages?staff_id=${staffId}`, data),
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
  create: (companyId, data) =>
    api.post(`/knowledge/companies/${companyId}/knowledge`, data),
  delete: (id) => api.delete(`/knowledge/${id}`),
};

// LLM
export const llmApi = {
  getProviders: () => api.get("/llm/providers"),
  getOllamaModels: () => api.get("/llm/ollama/models"),
};

export default api;
