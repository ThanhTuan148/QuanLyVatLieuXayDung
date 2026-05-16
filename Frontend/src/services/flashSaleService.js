import api from './api';

let flashSalesCache = null;

const flashSaleService = {
  // Lấy danh sách Giá sốc
  async getAllSales() {
    if (flashSalesCache) return flashSalesCache;
    const response = await api.get('/promotions?loai=GiaSoc');
    flashSalesCache = response.data;
    return flashSalesCache;
  },
  
  // Lấy các chương trình đang hoạt động
  async getActiveSales() {
    // We can reuse the same cache and filter or just return the cache
    if (flashSalesCache) return flashSalesCache;
    const response = await api.get('/promotions?loai=GiaSoc');
    flashSalesCache = response.data;
    return flashSalesCache; 
  },
  async getSaleById(id) {
    const response = await api.get(`/promotions/${id}`);
    return response.data;
  },


  async createSale(sale) {
    // Chuyển đổi format sale cũ sang KhuyenMaiDto
    const dto = {
      loaiKM: 'GiaSoc',
      tenKM: sale.tieuDe || sale.TenKM,
      moTa: sale.moTa || sale.MoTa,
      thoiGianBatDau: sale.thoiGianBatDau || sale.ThoiGianBatDau,
      thoiGianKetThuc: sale.thoiGianKetThuc || sale.ThoiGianKetThuc,
      trangThai: sale.trangThai ?? sale.TrangThai,
      doiTuongs: sale.items?.map(it => ({
        maSanPham: it.maSanPham,
        giaKhuyenMai: it.giaKhuyenMai
      })) || sale.DoiTuongs
    };
    const response = await api.post('/promotions', dto);
    return response.data;
  },

  async updateSale(id, sale) {
    const dto = {
      loaiKM: 'GiaSoc',
      tenKM: sale.tieuDe || sale.TenKM,
      moTa: sale.moTa || sale.MoTa,
      thoiGianBatDau: sale.thoiGianBatDau || sale.ThoiGianBatDau,
      thoiGianKetThuc: sale.thoiGianKetThuc || sale.ThoiGianKetThuc,
      trangThai: sale.trangThai ?? sale.TrangThai,
      doiTuongs: sale.items?.map(it => ({
        maSanPham: it.maSanPham,
        giaKhuyenMai: it.giaKhuyenMai
      })) || sale.DoiTuongs
    };
    const response = await api.put(`/promotions/${id}`, dto);
    return response.data;
  },

  async deleteSale(id) {
    await api.delete(`/promotions/${id}`);
  }
};

export default flashSaleService;

