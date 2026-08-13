import api from './api';

export const getOffers = (params) => api.get('/offers', { params });
export const getOffer = (id) => api.get(`/offers/${id}`);
export const createOffer = (offer) => api.post('/offers', offer);
export const updateOffer = (id, offer) => api.put(`/offers/${id}`, offer);
export const deleteOffer = (id) => api.delete(`/offers/${id}`);
export const updateOfferStatus = (id, status) => api.patch(`/offers/${id}/status`, { status });
export const downloadOfferPdf = (id) => api.get(`/offers/${id}/pdf`, { responseType: 'blob' });
