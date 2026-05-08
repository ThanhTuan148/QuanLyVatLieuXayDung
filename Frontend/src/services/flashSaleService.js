import api from './api';

const flashSaleService = {
  // Lấy danh sách Giá sốc
  async getAllSales() {
    const response = await api.get('/promotions?loai=GiaSoc');
    return response.data;
  },
  
  // Lấy các chương trình đang hoạt động
  async getActiveSales() {
    const response = await api.get('/promotions?loai=GiaSoc');
    // Logic filter active có thể để backend làm hoặc frontend làm
    return response.data; 
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

