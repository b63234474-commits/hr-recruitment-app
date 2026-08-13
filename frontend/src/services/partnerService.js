import api from './api';

export const getPartners = (params) => api.get('/partners', { params });
export const getPartner = (id) => api.get(`/partners/${id}`);
export const createPartner = (partnerData) => api.post('/partners', partnerData);
export const updatePartner = (id, partnerData) => api.put(`/partners/${id}`, partnerData);
export const deletePartner = (id) => api.delete(`/partners/${id}`);
