const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const apiRequest = async (
  path,
  { method = 'GET', token, body, responseType = 'json' } = {},
) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      'Cannot reach the MindHaven API. Start the backend and try again.',
      0,
    );
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    if (response.status === 401 && unauthorizedHandler) unauthorizedHandler();
    throw new ApiError(
      errorBody.message ||
        (response.status >= 500
          ? 'The MindHaven API is unavailable. Start the backend and try again.'
          : 'Something went wrong. Please try again.'),
      response.status,
    );
  }

  if (responseType === 'blob') return response.blob();
  if (response.status === 204) return null;
  return response.json();
};

export const userApi = {
  register: (body) => apiRequest('/users/register', { method: 'POST', body }),
  login: (body) => apiRequest('/users/login', { method: 'POST', body }),
  updateProfile: (token, body) =>
    apiRequest('/users/profile', { method: 'PUT', token, body }),
  getPreferences: (token) => apiRequest('/users/preferences', { token }),
  updatePreferences: (token, body) =>
    apiRequest('/users/preferences', { method: 'PUT', token, body }),
  changePassword: (token, body) =>
    apiRequest('/users/change-password', { method: 'PUT', token, body }),
  exportData: (token) => apiRequest('/users/export', { token, responseType: 'blob' }),
  deleteAccount: (token, password) =>
    apiRequest('/users/account', { method: 'DELETE', token, body: { password } }),
};

export const careApi = {
  getThoughtRecords: (token) => apiRequest('/thought-records', { token }),
  createThoughtRecord: (token, body) => apiRequest('/thought-records', { method: 'POST', token, body }),
  updateThoughtRecord: (token, id, body) => apiRequest(`/thought-records/${id}`, { method: 'PATCH', token, body }),
  deleteThoughtRecord: (token, id) => apiRequest(`/thought-records/${id}`, { method: 'DELETE', token }),
};

export const trackerApi = {
  getMoods: (token) => apiRequest('/mood', { token }),
  createMood: (token, body) => apiRequest('/mood', { method: 'POST', token, body }),
  updateMood: (token, id, body) => apiRequest(`/mood/${id}`, { method: 'PATCH', token, body }),
  deleteMood: (token, id) => apiRequest(`/mood/${id}`, { method: 'DELETE', token }),
  getSymptoms: (token) => apiRequest('/symptoms', { token }),
  createSymptoms: (token, body) =>
    apiRequest('/symptoms', { method: 'POST', token, body }),
  updateSymptoms: (token, id, body) => apiRequest(`/symptoms/${id}`, { method: 'PATCH', token, body }),
  deleteSymptoms: (token, id) => apiRequest(`/symptoms/${id}`, { method: 'DELETE', token }),
  getSleep: (token) => apiRequest('/sleep', { token }),
  createSleep: (token, body) => apiRequest('/sleep', { method: 'POST', token, body }),
  updateSleep: (token, id, body) => apiRequest(`/sleep/${id}`, { method: 'PATCH', token, body }),
  deleteSleep: (token, id) => apiRequest(`/sleep/${id}`, { method: 'DELETE', token }),
  getMedications: (token) => apiRequest('/medications', { token }),
  getMedicationDoses: (token, query = {}) =>
    apiRequest(`/medications/doses?${new URLSearchParams(query)}`, { token }),
  createMedication: (token, body) =>
    apiRequest('/medications', { method: 'POST', token, body }),
  updateMedication: (token, id, body) =>
    apiRequest(`/medications/${id}`, { method: 'PATCH', token, body }),
  deleteMedication: (token, id) => apiRequest(`/medications/${id}`, { method: 'DELETE', token }),
  setMedicationDose: (token, id, date, status) =>
    apiRequest(`/medications/${id}/doses/${date}`, { method: 'PUT', token, body: { status } }),
  clearMedicationDose: (token, id, date) =>
    apiRequest(`/medications/${id}/doses/${date}`, { method: 'DELETE', token }),
  createCheckIn: (token, body) => apiRequest('/check-ins', { method: 'POST', token, body }),
  getTags: (token, moodEntryId) => apiRequest(`/tags/mood/${moodEntryId}`, { token }),
  createTag: (token, body) => apiRequest('/tags', { method: 'POST', token, body }),
};

export const reportApi = {
  getMoodTrends: (token, query) =>
    apiRequest(`/reports/mood-trends?${new URLSearchParams(typeof query === 'string' ? { range: query } : query)}`, { token }),
  getInsights: (token, days = 90) => apiRequest(`/reports/insights?days=${days}`, { token }),
  download: (token, query) =>
    apiRequest(`/reports/export?${new URLSearchParams(typeof query === 'string' ? { range: query } : query)}`, {
      token,
      responseType: 'blob',
    }),
  createShare: (token, body) => apiRequest('/report-shares', { method: 'POST', token, body }),
  getShares: (token) => apiRequest('/report-shares', { token }),
  revokeShare: (token, id) => apiRequest(`/report-shares/${id}`, { method: 'DELETE', token }),
  getPublicShare: (shareToken) => apiRequest(`/report-shares/public/${encodeURIComponent(shareToken)}`),
  downloadPublicShare: (shareToken) => apiRequest(`/report-shares/public/${encodeURIComponent(shareToken)}/pdf`, { responseType: 'blob' }),
};
