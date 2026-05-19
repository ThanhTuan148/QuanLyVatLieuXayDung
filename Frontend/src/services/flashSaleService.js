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
  
  // Lấy các chương trình đang hoạt động (Đã được gộp thông minh và tính toán chồng lấn)
  async getActiveSales() {
    const response = await api.get('/promotions?loai=GiaSoc');
    const sales = response.data || [];
    
    const now = new Date();
    // Lọc các chương trình đang hoạt động tại thời điểm hiện tại
    const activePrograms = sales.filter(s => 
      s.trangThai && 
      new Date(s.thoiGianBatDau) <= now && 
      new Date(s.thoiGianKetThuc) >= now
    );
    
    if (activePrograms.length === 0) {
      return [];
    }

    // Thu thập tất cả các sản phẩm mục tiêu kèm theo thông tin chương trình cha của chúng
    const allActiveTargets = [];
    activePrograms.forEach(prog => {
      if (prog.targets) {
        prog.targets.forEach(t => {
          allActiveTargets.push({
            ...t,
            parentThoiGianKetThuc: prog.thoiGianKetThuc,
            parentTenKM: prog.tenKM
          });
        });
      }
    });

    // Nhóm sản phẩm theo maSanPham:
    // Nếu sản phẩm bị trùng giữa nhiều Flash Sale khác nhau, ưu tiên lấy mức giá khuyến mãi rẻ nhất (giảm sâu nhất)
    const mergedTargetsMap = new Map();
    allActiveTargets.forEach(t => {
      const isStillActive = new Date(t.parentThoiGianKetThuc) > now;
      if (!isStillActive) return;

      const existing = mergedTargetsMap.get(t.maSanPham);
      if (!existing) {
        mergedTargetsMap.set(t.maSanPham, t);
      } else {
        // Ưu tiên giá rẻ nhất (mức giảm cao nhất) cho khách hàng
        if (t.giaKhuyenMai < existing.giaKhuyenMai) {
          mergedTargetsMap.set(t.maSanPham, t);
        }
      }
    });

    const consolidatedTargets = Array.from(mergedTargetsMap.values());

    // Thời gian kết thúc của Flash Sale tổng hợp này sẽ hiển thị thời gian kết thúc gần nhất trong số các chương trình đang chạy
    const nearestEndTime = new Date(Math.min(...activePrograms.map(p => new Date(p.thoiGianKetThuc).getTime())));

    // Tạo một Flash Sale ảo gom toàn bộ các chương trình đang hoạt động
    const consolidatedSale = {
      maKhuyenMai: activePrograms[0].maKhuyenMai,
      maKM: 'FS_MERGED',
      loaiKM: 'GiaSoc',
      tenKM: activePrograms.length > 1 ? 'DEALS TỔNG HỢP' : activePrograms[0].tenKM,
      tieuDe: activePrograms.length > 1 ? 'DEALS TỔNG HỢP' : activePrograms[0].tenKM,
      moTa: 'Tất cả các chương trình deals sốc cực ưu đãi gộp lại tốt nhất cho bạn.',
      thoiGianBatDau: new Date(Math.min(...activePrograms.map(p => new Date(p.thoiGianBatDau).getTime()))).toISOString(),
      thoiGianKetThuc: nearestEndTime.toISOString(),
      trangThai: true,
      targets: consolidatedTargets
    };

    return [consolidatedSale];
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
    flashSalesCache = null; // Invalidate cache
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
    flashSalesCache = null; // Invalidate cache
    return response.data;
  },

  async deleteSale(id) {
    await api.delete(`/promotions/${id}`);
    flashSalesCache = null; // Invalidate cache
  }
};

export default flashSaleService;

