// ============================================
// Vite & Gourmand — Order Service
// ============================================
import { apiFetch } from './api.js';

// Create order
export const createOrder = async (orderData) => {
  return await apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
};

// Get my orders
export const getMyOrders = async () => {
  return await apiFetch('/orders/me');
};

// Get all orders (admin/employee)
export const getAllOrders = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const endpoint = params ? `/orders?${params}` : '/orders';
  return await apiFetch(endpoint);
};

// Get order by ID
export const getOrderById = async (id) => {
  return await apiFetch(`/orders/${id}`);
};

// Update order status (admin/employee)
export const updateOrderStatus = async (id, status, note) => {
  return await apiFetch(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  });
};

// Cancel order
export const cancelOrder = async (id, reason, contactMode) => {
  return await apiFetch(`/orders/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason, contactMode }),
  });
};

// Add review
export const addReview = async (id, rating, comment) => {
  return await apiFetch(`/orders/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment }),
  });
};

// Get order status history
export const getOrderHistory = async (id) => {
  return await apiFetch(`/orders/${id}/history`);
};