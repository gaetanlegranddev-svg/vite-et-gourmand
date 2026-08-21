// ============================================
// Vite & Gourmand — Menu Service
// ============================================
import { apiFetch } from './api.js';

// Get all menus with optional filters
export const getMenus = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const endpoint = params ? `/menus?${params}` : '/menus';
  return await apiFetch(endpoint);
};

// Get single menu by ID
export const getMenuById = async (id) => {
  return await apiFetch(`/menus/${id}`);
};

// Get all dishes
export const getDishes = async () => {
  return await apiFetch('/menus/meta/dishes');
};

// Get all allergens
export const getAllergens = async () => {
  return await apiFetch('/menus/meta/allergens');
};

// Create menu (admin only)
export const createMenu = async (menuData) => {
  return await apiFetch('/menus', {
    method: 'POST',
    body: JSON.stringify(menuData),
  });
};

// Update menu (admin only)
export const updateMenu = async (id, menuData) => {
  return await apiFetch(`/menus/${id}`, {
    method: 'PUT',
    body: JSON.stringify(menuData),
  });
};

// Delete menu (admin only)
export const deleteMenu = async (id) => {
  return await apiFetch(`/menus/${id}`, {
    method: 'DELETE',
  });
};