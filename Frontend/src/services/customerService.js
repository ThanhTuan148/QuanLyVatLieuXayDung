import api from './api';

const customerService = {
  getAllCustomers: () => api.get('/customers'),
  getCustomerById: (id) => api.get(`/customers/${id}`),
  createCustomer: (payload) => api.post('/customers', payload),
  updateCustomer: (id, payload) => api.put(`/customers/${id}`, payload),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
  recalculateAllTiers: () => api.post('/customers/recalculate-all-tiers'),
  exportExcel: () => api.get('/customers/export', { responseType: 'blob' }),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/customers/import', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
  },
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
  },
  getTierHistory: (id) => api.get(`/customers/${id}/tier-history`),
};

export default customerService;
