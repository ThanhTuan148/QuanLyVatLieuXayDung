import api from './api'

const bannerService = {
  async getAllBanners() {
    const response = await api.get('/banner')
    return response.data
  },

  async getActiveBanners() {
    const response = await api.get('/banner/active')
    return response.data
  },

  async getBannerById(id) {
    const response = await api.get(`/banner/${id}`)
    return response.data
  },

  async createBanner(banner) {
    const response = await api.post('/banner', banner)
    return response.data
  },

  async updateBanner(id, banner) {
    const response = await api.put(`/banner/${id}`, banner)
    return response.data
  },

  async deleteBanner(id) {
    const response = await api.delete(`/banner/${id}`)
    return response.data
  }
}

export default bannerService
