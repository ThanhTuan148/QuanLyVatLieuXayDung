import api from './api';

let categoriesCache = null;

const categoryService = {
  getAllCategories: async () => {
    if (categoriesCache) return categoriesCache;
    const res = await api.get('/categories');
    categoriesCache = res;
    return res;
  },
  getCategoryById: (id) => api.get(`/categories/${id}`),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),

  exportExcel: () => api.get('/categories/export', { responseType: 'blob' }),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/categories/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default categoryService;
