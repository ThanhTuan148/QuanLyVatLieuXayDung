import api from './api';

const inventoryService = {
  getAll: () => api.get('/inventory'),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (payload) => api.post('/inventory', payload),
  update: (id, payload) => api.put(`/inventory/${id}`, payload),
  delete: (id) => api.delete(`/inventory/${id}`),

  getWarehouses: () => api.get('/inventory/warehouses'),
  createWarehouse: (payload) => api.post('/inventory/warehouses', payload),
  updateWarehouse: (id, payload) => api.put(`/inventory/warehouses/${id}`, payload),

  getImportHistory: (productId) => api.get(`/inventory/${productId}/import-history`),
  getOutboundHistory: () => api.get('/inventory/outbound'),
  syncOldOutbound: () => api.post('/inventory/sync-old-outbound'),
  exportPdf: (id) => api.get(`/inventory/export/${id}/pdf`, { responseType: 'blob' }),
};

export default inventoryService;
