import api from './api';

const supplierService = {
  getAllSuppliers: () => api.get('/suppliers'),
  getSupplierById: (id) => api.get(`/suppliers/${id}`),
  createSupplier: (payload) => api.post('/suppliers', payload),
  updateSupplier: (id, payload) => api.put(`/suppliers/${id}`, payload),
  deleteSupplier: (id) => api.delete(`/suppliers/${id}`),
  exportExcel: () => api.get('/suppliers/export', { responseType: 'blob' }),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/suppliers/import', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
  },
};

export default supplierService;
