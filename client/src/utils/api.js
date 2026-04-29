import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const experimentAPI = {
  createSession: (sessionData) => api.post('/experiments/sessions', sessionData),
  getSession: (sessionId) => api.get(`/experiments/sessions/${sessionId}`),
  updateSession: (sessionId, data) => api.put(`/experiments/sessions/${sessionId}`, data),
  getSessionsByParticipant: (participantId) => 
    api.get(`/experiments/sessions/participant/${participantId}`),
  getAllSessions: (params) => api.get('/experiments/sessions', { params }),
};

export const dataAPI = {
  saveTrialData: (trialData) => api.post('/data/trial', trialData),
  getTrialData: (id) => api.get(`/data/trial/${id}`),
  getTrialsBySession: (sessionId) => api.get(`/data/trials/session/${sessionId}`),
  saveBulkTrialData: (trials) => api.post('/data/trials/bulk', { trials }),
  getExperimentResults: (params) => api.get('/data/results', { params }),
};

export const formAPI = {
  submitResponse: (responseData) => api.post('/forms/submit', responseData),
  getFormResponsesBySession: (sessionId) => api.get(`/forms/session/${sessionId}`),
  getFormResponsesByParticipant: (participantId) => 
    api.get(`/forms/participant/${participantId}`),
};

export const calibrationAPI = {
  saveCalibration: (calibrationData) => api.post('/calibration/save', calibrationData),
  getCalibrationBySession: (sessionId) => api.get(`/calibration/session/${sessionId}`),
  getCalibrationByParticipant: (participantId) => 
    api.get(`/calibration/participant/${participantId}`),
};

export default api;