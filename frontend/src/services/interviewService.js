import api from './api';

export const getInterviews = (params) => api.get('/interviews', { params });
export const getInterview = (id) => api.get(`/interviews/${id}`);
export const createInterview = (interviewData) => api.post('/interviews', interviewData);
export const updateInterview = (id, interviewData) => api.put(`/interviews/${id}`, interviewData);
export const deleteInterview = (id) => api.delete(`/interviews/${id}`);
export const addInterviewFeedback = (id, feedbackData) => api.post(`/interviews/${id}/feedback`, feedbackData);
export const getInterviewFeedback = (id) => api.get(`/interviews/${id}/feedback`);
