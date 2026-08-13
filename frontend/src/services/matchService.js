import api from './api';

export const getMatchingCandidates = (jobId, params) => api.get(`/jobs/${jobId}/match-candidates`, {
  params,
});
export const getCandidateMatch = (jobId, candidateId) => api.get(`/jobs/${jobId}/candidates/${candidateId}/match`);
export const saveCandidateMatch = (jobId, candidateId) => api.post(`/jobs/${jobId}/candidates/${candidateId}/match`);
export const updateCandidateStatus = (candidateId, statusPayload) => api.patch(`/candidates/${candidateId}/status`, statusPayload);
