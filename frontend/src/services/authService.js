import api from './api';
import { clearAuth, storeAuth } from '../utils/tokenStorage';

export { getStoredToken, getStoredUser, storeAuth } from '../utils/tokenStorage';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logout = () => {
  clearAuth();
};
