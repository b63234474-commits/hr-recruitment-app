import api from './api';

export const getAssessments = (params) => api.get('/assessments', { params });
export const getAssessment = (id) => api.get(`/assessments/${id}`);
export const createAssessment = (assessmentData) => api.post('/assessments', assessmentData);
export const updateAssessment = (id, assessmentData) => api.put(`/assessments/${id}`, assessmentData);
export const deleteAssessment = (id) => api.delete(`/assessments/${id}`);
