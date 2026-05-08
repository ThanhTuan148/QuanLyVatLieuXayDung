import api from './api';

const promotionService = {
  async getAll() {
    const response = await api.get('/promotions?loai=SanPham');
    return response.data;
  },

  async getActive() {
    const response = await api.get('/promotions/active?loai=SanPham');
    return response.data;
  },


  async getById(id) {
    const response = await api.get(`/promotions/${id}`);
    return response.data;
  },

  async create(promo) {
    const response = await api.post('/promotions', promo);
    return response.data;
  },

  async update(id, promo) {
    const response = await api.put(`/promotions/${id}`, promo);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/promotions/${id}`);
    return response.data;
  },
};

export default promotionService;
