/**
 * URL Helper utility for constructing full URLs for backend resources
 */

export const getResumeUrl = (resumePath) => {
  if (!resumePath) return null;
  
  // If it's already a full URL, return as is
  if (resumePath.startsWith('http://') || resumePath.startsWith('https://')) {
    return resumePath;
  }
  
  // Get the backend URL from the API configuration
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const backendUrl = apiUrl.replace('/api', '');
  
  // Remove leading slash from resume path if present
  const cleanPath = resumePath.startsWith('/') ? resumePath : `/${resumePath}`;
  
  return `${backendUrl}${cleanPath}`;
};

export const getBackendUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace('/api', '');
};

export default {
  getResumeUrl,
  getBackendUrl,
};
