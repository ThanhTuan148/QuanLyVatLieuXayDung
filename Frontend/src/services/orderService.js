// src/services/orderService.js
import api from './api';

const orderService = {
  getAllOrders: () => {
    return api.get('/orders');
  },

  getOrderById: (id) => {
    return api.get(`/orders/${id}`);
  },

  getOrdersByCustomer: (customerId) => {
    return api.get(`/orders/customer/${customerId}`);
  },

  getOrdersByStatus: (status) => {
    return api.get(`/orders/status/${status}`);
  },

  createOrder: (order) => {
    return api.post('/orders', order);
  },

  updateOrder: (id, order) => {
    return api.put(`/orders/${id}`, order);
  },

  deleteOrder: (id) => {
    return api.delete(`/orders/${id}`);
  },

  updateOrderStatus: (id, status) => {
    return api.patch(`/orders/${id}/status`, { status });
  },

  getOrderHistory: (id) => {
    return api.get(`/orders/${id}/history`);
  },

  cancelOrder: (id) => {
    return api.post(`/orders/${id}/cancel`);
  },
};

export default orderService;
