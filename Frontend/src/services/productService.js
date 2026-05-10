// src/services/productService.js
import api from './api';

const productService = {
  getAllProducts: (hang, includeGifts = true) => {
    return api.get('/products', { params: { hang, includeGifts } });
  },

  getProductById: (id) => {
    return api.get(`/products/${id}`);
  },

  createProduct: (product) => {
    return api.post('/products', product);
  },

  updateProduct: (id, product) => {
    return api.put(`/products/${id}`, product);
  },

  deleteProduct: (id) => {
    return api.delete(`/products/${id}`);
  },

  searchProducts: (keyword) => {
    return api.get(`/products/search/${keyword}`);
  },

  exportExcel: () => {
    return api.get('/products/export', { responseType: 'blob' });
  },

  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export default productService;
