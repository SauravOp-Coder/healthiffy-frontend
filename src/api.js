import axios from 'axios';

// 1. Determine the Base URL
// Use your Render Backend URL here. ALWAYS use https://
const API_BASE_URL = "https://healthiffy-backend.onrender.com/api"; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a helper to attach tokens if you use JWT later
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export default api;