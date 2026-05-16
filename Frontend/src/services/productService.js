// src/services/productService.js
import api from './api';

let productsCache = null;

const productService = {
  getAllProducts: async (hang, includeGifts = true) => {
    // Only cache the full list (no category filter)
    if (!hang && includeGifts && productsCache) {
      return productsCache;
    }
    const res = await api.get('/products', { params: { hang, includeGifts } });
    if (!hang && includeGifts) {
      productsCache = res;
    }
    return res;
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
