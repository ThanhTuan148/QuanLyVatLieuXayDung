import api from './api';

let inventoryCache = null;
let warehousesCache = null;

const inventoryService = {
  getAll: async () => {
    if (inventoryCache) return inventoryCache;
    const res = await api.get('/inventory');
    inventoryCache = res;
    return res;
  },
  getById: (id) => api.get(`/inventory/${id}`),
  create: (payload) => api.post('/inventory', payload),
  update: (id, payload) => api.put(`/inventory/${id}`, payload),
  delete: (id) => api.delete(`/inventory/${id}`),

  getWarehouses: async () => {
    if (warehousesCache) return warehousesCache;
    const res = await api.get('/inventory/warehouses');
    warehousesCache = res;
    return res;
  },
  createWarehouse: (payload) => api.post('/inventory/warehouses', payload),
  updateWarehouse: (id, payload) => api.put(`/inventory/warehouses/${id}`, payload),
  deleteWarehouse: (id) => api.delete(`/inventory/warehouses/${id}`),

  getImportHistory: (productId, warehouseId) => api.get(`/inventory/${productId}/import-history${warehouseId ? `?warehouseId=${warehouseId}` : ''}`),
  getOutboundHistory: () => api.get('/inventory/outbound'),
  syncOldOutbound: () => api.post('/inventory/sync-old-outbound'),
  syncOldInbound: () => api.post('/inventory/sync-old-inbound'),
  exportPdf: (id) => api.get(`/inventory/export/${id}/pdf`, { responseType: 'blob' }),
};

export default inventoryService;
