import api from './api';

export const uploadResume = (formData) => api.post('/candidates/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const getCandidates = (params) => api.get('/candidates', { params });
export const getCandidate = (id) => api.get(`/candidates/${id}`);
export const createCandidate = (candidateData) => api.post('/candidates', candidateData);
export const updateCandidate = (id, candidateData) => api.put(`/candidates/${id}`, candidateData);
export const deleteCandidate = (id) => api.delete(`/candidates/${id}`);
export const matchCandidate = (id) => api.post(`/candidates/${id}/match`);
export const updateCandidateStatus = (id, status) => api.patch(`/candidates/${id}/status`, status);
export const getPipelineStatuses = () => api.get('/candidates/statuses');
