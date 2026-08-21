// ============================================
// Vite & Gourmand — API Base Configuration
// ============================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Base fetch function with auth header
export const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API error');
  }

  return data;
};