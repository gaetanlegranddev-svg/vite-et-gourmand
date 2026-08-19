// ============================================
// Vite & Gourmand — Auth Service
// ============================================
import { apiFetch } from './api.js';

// Register new user
export const register = async (userData) => {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  return data;
};

// Login
export const login = async (email, password) => {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
};

// Logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get profile from API
export const getProfile = async () => {
  return await apiFetch('/auth/profile');
};

// Update profile
export const updateProfile = async (userData) => {
  return await apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};