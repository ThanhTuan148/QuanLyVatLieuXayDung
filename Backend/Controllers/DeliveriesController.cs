using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using BuildingMaterialAPI.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeliveriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAIService _ai;
        private readonly Services.INotificationService _notificationService;

        public DeliveriesController(ApplicationDbContext context, IAIService ai, Services.INotificationService notificationService)
        {
            _context = context;
            _ai = ai;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDeliveries([FromQuery] int? maNhanVien = null)
        {
            var query = _context.PhieuGiaoHangs
                .Include(p => p.HoaDon)
                .Include(p => p.NhanVien)
                .AsQueryable();

            if (maNhanVien.HasValue && maNhanVien.Value > 0)
            {
                query = query.Where(p => p.MaNhanVien == maNhanVien.Value);
            }

            var pghList = await query
                .OrderByDescending(p => p.NgayTao)
                .Select(p => new
                {
                    maPhieuGH = p.MaPhieuGH,
                    maGH = p.MaGH,
                    nguoiGiao = p.NguoiGiao,
                    ngayGiao = p.NgayGiao,
                    ngayGiaoDuKien = p.NgayGiaoDuKien,
                    ngayGiaoThucTe = p.NgayGiaoThucTe,
                    diaChi = p.DiaChi,
                    trangThai = p.TrangThai,
                    ghiChu = p.GhiChu,
                    maHoaDon = p.MaHoaDon,
                    maHD = p.HoaDon != null ? p.HoaDon.MaHD : "N/A",
                    tongTienOrder = p.HoaDon != null ? p.HoaDon.TongTien : 0,
                    daThanhToanOrder = p.HoaDon != null ? (p.HoaDon.ThanhToan ?? 0) : 0,
                    maNhanVien = p.MaNhanVien,
                    tenNhanVien = p.NhanVien != null ? p.NhanVien.TenNV : "N/A"
                })
                .ToListAsync();

            return Ok(pghList);
        }

        [HttpPost]
        public async Task<ActionResult> CreateDelivery([FromBody] CreateDeliveryDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var pgh = new PhieuGiaoHang
                {
                    NguoiGiao = dto.NguoiGiao,
                    NgayGiao = dto.NgayGiao ?? DateTime.UtcNow,
                    NgayGiaoDuKien = dto.NgayGiaoDuKien,
                    DiaChi = dto.DiaChi,
                    TrangThai = dto.TrangThai ?? "Chờ giao",
                    GhiChu = dto.GhiChu,
                    MaHoaDon = dto.MaHoaDon,
                    MaNhanVien = dto.MaNhanVien,
                    NgayTao = DateTime.UtcNow,
                    NgayCapNhat = DateTime.UtcNow
                };

                _context.PhieuGiaoHangs.Add(pgh);
                await _context.SaveChangesAsync();

                // Gửi thông báo cho tài xế (người được giao)
                var driver = await _context.NhanViens.Include(nv => nv.TaiKhoan).FirstOrDefaultAsync(nv => nv.MaNhanVien == pgh.MaNhanVien);
                if (driver?.TaiKhoan != null)
                {
                    await _notificationService.SendNotificationAsync(
                        "Chuyến hàng mới",
                        $"Bạn đã được phân công giao chuyến hàng {pgh.MaGH} đến địa chỉ {pgh.DiaChi}.",
                        "GiaoHang",
                        driver.TaiKhoan.MaTaiKhoan.ToString(),
                        link: "/deliveries"
                    );
                }

                // 1. Kiểm tra và cập nhật/tạo Phiếu Xuất Kho
                var pxk = await _context.PhieuXuatKhos.FirstOrDefaultAsync(p => p.MaHoaDon == pgh.MaHoaDon && p.TrangThai != "Đã xuất");
                
                // Lấy thông tin người lập thực tế (Người đang đăng nhập/thao tác)
                int creatorId = dto.MaNguoiLap > 0 ? dto.MaNguoiLap : (dto.MaNhanVien); // Fallback nếu không có người lập
                var creator = await _context.NhanViens.FindAsync(creatorId);

                if (pxk == null)
                {
                    pxk = new PhieuXuatKho
                    {
                        MaPhieuGH = pgh.MaPhieuGH,
                        MaHoaDon = pgh.MaHoaDon,
                        MaNhanVien = creatorId, // Người lập phiếu
                        NgayXuat = DateTime.UtcNow,
                        NgayTao = DateTime.UtcNow,
                        NguoiXuat = creator?.TenNV ?? "Hệ thống",
                        GhiChu = $"Xuất kho cho phiếu giao {pgh.MaGH}",
                        ChuKyNguoiLap = creator?.ChuKy,
                        TrangThai = "Chờ duyệt"
                    };
                    _context.PhieuXuatKhos.Add(pxk);
                    await _context.SaveChangesAsync(); // Save to get MaPhieuXK

                    _context.LichSuPhieuXuatKhos.Add(new LichSuPhieuXuatKho
                    {
                        MaPhieuXK = pxk.MaPhieuXK,
                        TrangThaiMoi = "Chờ duyệt",
                        NoiDungThayDoi = $"Khởi tạo phiếu xuất kho cho đơn hàng {pgh.MaHoaDon}. Người lập: {creator?.TenNV ?? "Hệ thống"}",
                        MaNguoiThucHien = creatorId,
                        NgayTao = DateTime.UtcNow
                    });
                }
                else
                {
                    string oldStatus = pxk.TrangThai;
                    // Cập nhật phiếu xuất kho hiện có
                    pxk.MaPhieuGH = pgh.MaPhieuGH;
                    pxk.MaNhanVien = creatorId;
                    pxk.NguoiXuat = creator?.TenNV ?? pxk.NguoiXuat;
                    pxk.ChuKyNguoiLap = creator?.ChuKy ?? pxk.ChuKyNguoiLap;
                    pxk.GhiChu = $"Xuất kho cho phiếu giao {pgh.MaGH} (Cập nhật từ đơn hàng)";
                    
                    _context.LichSuPhieuXuatKhos.Add(new LichSuPhieuXuatKho
                    {
                        MaPhieuXK = pxk.MaPhieuXK,
                        TrangThaiCu = oldStatus,
                        TrangThaiMoi = pxk.TrangThai,
                        NoiDungThayDoi = $"Cập nhật liên kết Phiếu giao hàng {pgh.MaGH}. Người cập nhật: {creator?.TenNV ?? "Hệ thống"}",
                        MaNguoiThucHien = creatorId,
                        NgayTao = DateTime.UtcNow
                    });
                }
                await _context.SaveChangesAsync();

                // Xóa các chi tiết Phiếu Xuất Kho cũ nếu đã tồn tại để tránh nhân đôi
                var oldPxkItems = await _context.CTPhieuXuatKhos.Where(c => c.MaPhieuXK == pxk.MaPhieuXK).ToListAsync();
                if (oldPxkItems.Any())
                {
                    _context.CTPhieuXuatKhos.RemoveRange(oldPxkItems);
                    await _context.SaveChangesAsync();
                }

                if (dto.Items != null && dto.Items.Any())
                {
                    foreach (var item in dto.Items)
                    {
                        // 2. Tạo chi tiết Phiếu giao
                        _context.CTPhieuGiaoHangs.Add(new CTPhieuGiaoHang
                        {
                            MaPhieuGH = pgh.MaPhieuGH,
                            MaSanPham = item.MaSanPham,
                            MaCTHD = item.MaCTHD,
                            SoLuongGiao = item.SoLuongGiao,
                            GhiChu = item.GhiChu,
                            TrangThai = item.TrangThai ?? "Chờ giao",
                            NgayTao = DateTime.UtcNow
                        });

                        // 3. Trừ kho và tạo chi tiết Xuất kho
                        var khoHang = await _context.CTKhoHangs
                            .Include(k => k.SanPham)
                            .Where(k => k.MaSanPham == item.MaSanPham && k.SoLuong >= item.SoLuongGiao)
                            .OrderByDescending(k => k.SoLuong)
                            .FirstOrDefaultAsync();

                        if (khoHang == null)
                        {
                            throw new Exception($"Sản phẩm mã {item.MaSanPham} không đủ tồn kho để xuất!");
                        }

                        khoHang.SoLuong -= item.SoLuongGiao;
                        khoHang.NgayCapNhat = DateTime.UtcNow;

                        _context.CTPhieuXuatKhos.Add(new CTPhieuXuatKho
                        {
                            MaPhieuXK = pxk.MaPhieuXK,
                            MaSanPham = item.MaSanPham,
                            SoLuong = item.SoLuongGiao,
                            MaKho = khoHang.MaKhoHang,
                            DonGiaVon = khoHang.SanPham?.GiaNhap ?? 0
                        });
                    }
                    await _context.SaveChangesAsync();
                }

                // Update HoaDon status based on delivery status
                var hd = await _context.HoaDons.FindAsync(dto.MaHoaDon);
                if (hd != null && (hd.TrangThai == "Chờ xử lý" || hd.TrangThai == "Đã xác nhận" || hd.TrangThai == "Đang giao"))
                {
                    // Nếu phiếu giao là "Chờ giao" thì hóa đơn cũng để "Chờ giao"
                    // Nếu phiếu giao là "Đang giao" thì hóa đơn mới để "Đang giao"
                    if (pgh.TrangThai == "Chờ giao")
                    {
                        hd.TrangThai = "Chờ giao";
                    }
                    else if (pgh.TrangThai == "Đang giao")
                    {
                        hd.TrangThai = "Đang giao";
                    }
                    
                    hd.NgayCapNhat = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();
                return CreatedAtAction(nameof(GetDeliveries), new { id = pgh.MaPhieuGH }, new { maPhieuGH = pgh.MaPhieuGH });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDelivery(int id, [FromBody] UpdateDeliveryDto dto)
        {
            var existing = await _context.PhieuGiaoHangs.Include(p => p.HoaDon).FirstOrDefaultAsync(p => p.MaPhieuGH == id);
            if (existing == null) return NotFound();

            string oldTripStatus = existing.TrangThai;

            var pxk = await _context.PhieuXuatKhos.Include(x => x.ChiTiet).FirstOrDefaultAsync(x => x.MaPhieuGH == id);

            // Chặn cập nhật trạng thái giao nếu tài xế chưa xác nhận nhận hàng từ kho
            string[] deliveryStatuses = { "Đã giao", "Đã giao một phần", "Đang giao một phần" };
            if (deliveryStatuses.Contains(dto.TrangThai))
            {
                string[] confirmedPxkStatuses = { "Đã xuất", "Đã nhận một phần", "Đã nhận đủ" };
                if (pxk == null || !confirmedPxkStatuses.Contains(pxk.TrangThai))
                {
                    return BadRequest(new { message = "⚠️ Bạn chưa xác nhận nhận hàng từ kho cho chuyến này. Vui lòng qua mục 'Kho hàng → Lịch sử xuất kho' để xác nhận nhận hàng trước khi cập nhật trạng thái giao!" });
                }
            }

            // Chặn "Đã giao" nếu tài xế chưa nhận đủ hàng thực tế từ kho
            if (dto.TrangThai == "Đã giao")
            {
                var totalOrdered = await _context.CTHDs
                    .Where(ct => ct.MaHoaDon == existing.MaHoaDon)
                    .SumAsync(ct => ct.SoLuong);

                // Dùng SoLuongThucNhan thực tế từ tất cả phiếu xuất kho (không phải số kế hoạch SoLuongGiao)
                var totalThucNhan = await _context.CTPhieuXuatKhos
                    .Where(ct => ct.PhieuXuatKho.MaHoaDon == existing.MaHoaDon)
                    .SumAsync(ct => (int?)(ct.SoLuongThucNhan ?? 0)) ?? 0;

                if (totalThucNhan < totalOrdered)
                {
                    // Tài xế chưa nhận đủ hàng thực tế → ép về "Đã giao một phần"
                    dto.TrangThai = "Đã giao một phần";
                }
            }

            // Kiểm tra trình tự trạng thái
            string[] finalStatuses = { "Đã giao", "Đã giao một phần", "Hỏng/Lỗi", "Khách từ chối" };
            if (finalStatuses.Contains(dto.TrangThai) && existing.TrangThai != "Đang giao" && existing.TrangThai != "Chờ giao" && !existing.TrangThai.Contains("Thiếu") && !existing.TrangThai.Contains("một phần"))
            {
                // Allow transitions from warehouse-confirmed states
            }

            existing.GhiChu = dto.GhiChu;
            existing.ViTriHienTai = dto.ViTriHienTai ?? existing.ViTriHienTai;
            existing.Lat = dto.Lat ?? existing.Lat;
            existing.Lng = dto.Lng ?? existing.Lng;
            
            if (dto.NgayGiaoThucTe.HasValue)
            {
                existing.NgayGiaoThucTe = dto.NgayGiaoThucTe.Value;
            }
            else if (dto.TrangThai == "Đã giao" || dto.TrangThai == "Đã giao một phần")
            {
                existing.NgayGiaoThucTe = DateTime.UtcNow;
            }
            
            existing.NgayCapNhat = DateTime.UtcNow;
            
            // Update individual items status if provided
            bool hasPartialPickupDiscrepancy = false;
            if (dto.Items != null && dto.Items.Any())
            {
                var itemIds = dto.Items.Select(x => x.MaCTGH).ToList();
                var itemsToUpdate = await _context.CTPhieuGiaoHangs
                    .Where(x => x.MaPhieuGH == id && itemIds.Contains(x.MaCTGH))
                    .ToListAsync();
                
                foreach (var itemUpdate in dto.Items)
                {
                    var item = itemsToUpdate.FirstOrDefault(x => x.MaCTGH == itemUpdate.MaCTGH);
                    if (item != null)
                    {
                        item.TrangThai = itemUpdate.TrangThai;
                        item.GhiChu = itemUpdate.GhiChu;

                        // Tự động nâng cấp "Đang giao một phần" lên "Đã giao một phần" nếu tài xế chốt chuyến đi
                        if ((dto.TrangThai == "Đã giao" || dto.TrangThai == "Đã giao một phần") && itemUpdate.TrangThai == "Đang giao một phần")
                        {
                            itemUpdate.TrangThai = "Đã giao một phần";
                            item.TrangThai = "Đã giao một phần";
                        }

                        // Nếu tài xế xác nhận "Đã giao" cho khách, nhưng thực tế lúc xuất kho nhận thiếu
                        // thì ta cập nhật lại số lượng giao thực tế của phiếu này để phần còn thiếu quay về trạng thái "Chờ giao" của Đơn hàng
                        if ((itemUpdate.TrangThai == "Đã giao" || itemUpdate.TrangThai == "Đã giao một phần") && pxk != null && (pxk.TrangThai == "Đã xuất" || pxk.TrangThai == "Đã nhận một phần"))
                        {
                            var ctxk = pxk.ChiTiet.FirstOrDefault(x => x.MaSanPham == item.MaSanPham);
                            if (ctxk != null)
                            {
                                int thucNhan = ctxk.SoLuongThucNhan ?? 0;
                                if (thucNhan < item.SoLuongGiao)
                                {
                                    item.SoLuongGiao = thucNhan;
                                    hasPartialPickupDiscrepancy = true;
                                    if (thucNhan == 0) item.TrangThai = "Hỏng/Lỗi"; // Nếu không nhận được gì thì coi như lỗi/hủy item này
                                }
                            }
                        }
                    }
                }
            }

            // Lưu thay đổi trạng thái và số lượng từng món TRƯỚC khi tính toán hoàn thành
            await _context.SaveChangesAsync();

            // Update Order Status based on overall fulfillment
            if (existing.HoaDon != null)
            {
                var details = await _context.CTPhieuGiaoHangs
                    .Include(c => c.SanPham)
                    .Where(c => c.MaPhieuGH == id)
                    .ToListAsync();

                string deliveryInfo = string.Join(", ", details.Select(d => $"{d.SoLuongGiao} {d.SanPham?.TenSP}"));
                
                string logMessage = $"Phiếu giao {existing.MaGH} cập nhật sang '{dto.TrangThai}'.";
                if (dto.SoTienThu > 0)
                {
                    logMessage += $" Đã thu {dto.SoTienThu.Value:N0} VNĐ.";
                }
                logMessage += $" Địa chỉ: {existing.DiaChi}. Sản phẩm: {deliveryInfo}";

                string oldHdStatus = existing.HoaDon.TrangThai;

                // Payment Collection Logic (Internal update)
                if (dto.SoTienThu > 0)
                {
                    existing.SoTienThu = (existing.SoTienThu ?? 0) + dto.SoTienThu.Value;
                    if (existing.HoaDon != null)
                    {
                        existing.HoaDon.ThanhToan = (existing.HoaDon.ThanhToan ?? 0) + dto.SoTienThu.Value;

                        // Sync with CongNo
                        var congNo = await _context.CongNos.FirstOrDefaultAsync(cn => cn.MaHoaDon == existing.MaHoaDon);
                        if (congNo != null)
                        {
                            congNo.SoTienDaTra += dto.SoTienThu.Value;
                            congNo.SoTienConLai = congNo.SoTienNo - congNo.SoTienDaTra;
                            if (congNo.SoTienConLai <= 0)
                            {
                                congNo.TrangThai = "Đã thanh toán";
                            }
                            congNo.NgayCapNhat = DateTime.UtcNow;

                            // Create ChiTietTraNo for History in Debt System
                            var ctTraNo = new ChiTietTraNo
                            {
                                MaCongNo = congNo.MaCongNo,
                                MaHoaDon = existing.MaHoaDon,
                                NgayTT = DateTime.UtcNow,
                                SoTien = dto.SoTienThu.Value,
                                PTTT = "Tiền mặt (Thu khi giao hàng)",
                                GhiChu = $"Thu từ phiếu giao {existing.MaGH}",
                                TrangThai = "Thành công",
                                NgayTao = DateTime.UtcNow,
                                MaNhanVien = existing.MaNhanVien // Associated driver/staff
                            };
                            _context.ChiTietTraNos.Add(ctTraNo);
                        }
                    }
                }

                bool isReturnExchangeTrip = oldTripStatus.Contains("đổi") || oldTripStatus.Contains("thu hồi") || oldTripStatus.Contains("Đổi");

                if (isReturnExchangeTrip)
                {
                    if (dto.TrangThai == "Đang giao")
                    {
                        existing.HoaDon.TrangThai = "Đang giao hàng đổi/trả";
                    }
                    else if (dto.TrangThai == "Đã giao")
                    {
                        existing.HoaDon.TrangThai = "Đã đổi trả";
                        
                        var pdt = await _context.PhieuDoiTras
                            .Where(x => x.MaHoaDon == existing.MaHoaDon && (x.TrangThai.Contains("Duyệt") || x.TrangThai.Contains("xử lý")))
                            .OrderByDescending(x => x.NgayTao)
                            .FirstOrDefaultAsync();

                        if (pdt != null)
                        {
                            pdt.TrangThai = "Hoàn Tất";
                            pdt.TrangThaiNhapKho = "Đã nhập kho";
                            pdt.NgayCapNhat = DateTime.UtcNow;

                            var cts = await _context.CTPhieuDoiTras.Where(x => x.MaPhieuDT == pdt.MaPhieuDT).ToListAsync();
                            foreach(var ct in cts) {
                                if (ct.TrangThai == "Đã Duyệt") ct.TrangThai = "Hoàn Tất";
                            }
                        }
                    }
                }
                else
                {
                    // Số lượng đặt trong toàn đơn hàng
                    var cthdList = await _context.CTHDs
                        .Where(ct => ct.MaHoaDon == existing.MaHoaDon)
                        .ToListAsync();
                    var totalOrdered = cthdList.Sum(ct => ct.SoLuong);

                    // Tính tổng thực nhận từ tất cả phiếu xuất kho liên quan đến đơn hàng (trừ chuyến hiện tại)
                    // Đây là cách chính xác nhất để biết bao nhiêu hàng đã được giao thực tế
                    var previousTripsDelivered = await _context.CTPhieuGiaoHangs
                        .Where(c => c.PhieuGiaoHang.MaHoaDon == existing.MaHoaDon && c.MaPhieuGH != id && c.TrangThai.Contains("Đã giao"))
                        .SumAsync(c => (int?)c.SoLuongGiao) ?? 0;

                    int currentTripDelivered = 0;
                    if (dto.TrangThai == "Đã giao" || dto.TrangThai == "Đã giao một phần") 
                    {
                        // Ưu tiên dùng SoLuongThucNhan (thực nhận từ kho) thay vì SoLuongGiao (kế hoạch)
                        // để đảm bảo chính xác khi tài xế nhận nhiều hơn hoặc ít hơn kế hoạch
                        foreach (var detail in details.Where(c => c.TrangThai != null && c.TrangThai.Contains("Đã giao")))
                        {
                            if (pxk != null)
                            {
                                var ctxk = pxk.ChiTiet?.FirstOrDefault(x => x.MaSanPham == detail.MaSanPham);
                                if (ctxk != null && ctxk.SoLuongThucNhan.HasValue)
                                {
                                    // Dùng thực nhận từ kho (có thể nhiều hơn kế hoạch trong chuyến bù)
                                    currentTripDelivered += ctxk.SoLuongThucNhan.Value;
                                }
                                else
                                {
                                    currentTripDelivered += detail.SoLuongGiao;
                                }
                            }
                            else
                            {
                                currentTripDelivered += detail.SoLuongGiao;
                            }
                        }
                    }

                    var totalDelivered = previousTripsDelivered + currentTripDelivered;

                    // ĐỒNG BỘ: Cập nhật số lượng đã giao thực tế vào Chi tiết hóa đơn (CTHD)
                    // để trang chi tiết đơn hàng của khách hiển thị đúng (ví dụ 4/4 đã nhận)
                    if (dto.TrangThai == "Đã giao" || dto.TrangThai == "Đã giao một phần")
                    {
                        foreach (var detail in details.Where(c => c.TrangThai != null && c.TrangThai.Contains("Đã giao")))
                        {
                            var cthd = cthdList.FirstOrDefault(x => x.MaSanPham == detail.MaSanPham);
                            if (cthd != null)
                            {
                                int thucGiaoChuyenNay = detail.SoLuongGiao;
                                if (pxk != null)
                                {
                                    var ctxk = pxk.ChiTiet?.FirstOrDefault(x => x.MaSanPham == detail.MaSanPham);
                                    if (ctxk != null && ctxk.SoLuongThucNhan.HasValue)
                                    {
                                        thucGiaoChuyenNay = ctxk.SoLuongThucNhan.Value;
                                    }
                                }
                                
                                // Reset và tính lại tổng đã giao từ TẤT CẢ các chuyến đã thành công của SP này
                                var allSuccessfulDeliveriesForThisSp = await _context.CTPhieuGiaoHangs
                                    .Where(c => c.PhieuGiaoHang.MaHoaDon == existing.MaHoaDon && 
                                                c.MaSanPham == detail.MaSanPham && 
                                                (c.TrangThai.Contains("Đã giao") || c.MaCTGH == detail.MaCTGH))
                                    .ToListAsync();

                                // Lưu ý: chuyến hiện tại (detail) có thể chưa lưu DB nên ta dùng giá trị mới nhất
                                int sumDelivered = 0;
                                foreach(var d in allSuccessfulDeliveriesForThisSp)
                                {
                                    if (d.MaCTGH == detail.MaCTGH) sumDelivered += thucGiaoChuyenNay;
                                    else sumDelivered += d.SoLuongGiao;
                                }

                                cthd.SoLuongDaGiao = sumDelivered;
                            }
                        }
                    }

                    if (totalDelivered >= totalOrdered)
                    {
                        existing.HoaDon.TrangThai = "Hoàn thành";
                        existing.HoaDon.NgayGiao = DateTime.UtcNow;
                    }
                    else if (dto.TrangThai == "Đã giao" || dto.TrangThai == "Đã giao một phần")
                    {
                        if (existing.HoaDon.TrangThai != "Hoàn thành" && existing.HoaDon.TrangThai != "Yêu cầu đổi/trả hàng" && existing.HoaDon.TrangThai != "Đang đổi trả")
                        {
                            existing.HoaDon.TrangThai = "Đã giao một phần";
                        }
                    }
                    else if (dto.TrangThai == "Đang giao")
                    {
                        if (existing.HoaDon.TrangThai != "Hoàn thành" && existing.HoaDon.TrangThai != "Yêu cầu đổi/trả hàng" && existing.HoaDon.TrangThai != "Đang đổi trả")
                        {
                            existing.HoaDon.TrangThai = "Đang giao";
                        }
                    }
                }
                existing.HoaDon.NgayCapNhat = DateTime.UtcNow;

                // FINAL LOG: Record the order status change in the timeline
                _context.LichSuHoaDons.Add(new LichSuHoaDon
                {
                    MaHoaDon = existing.MaHoaDon ?? 0,
                    TrangThaiCu = oldHdStatus,
                    TrangThaiMoi = existing.HoaDon.TrangThai,
                    NoiDungThayDoi = logMessage,
                    MaNguoiThucHien = dto.MaNguoiThucHien,
                    NgayTao = DateTime.UtcNow
                });
            }

            // Update the trip status
            if (dto.TrangThai == "Đã giao" && hasPartialPickupDiscrepancy)
            {
                existing.TrangThai = "Đã giao một phần";
            }
            else
            {
                existing.TrangThai = dto.TrangThai;
            }

            // Ghi nhận lịch sử giao hàng
            _context.LichSuGiaoHangs.Add(new LichSuGiaoHang
            {
                MaPhieuGH = id,
                TrangThaiCu = oldTripStatus,
                TrangThaiMoi = dto.TrangThai,
                NoiDungThayDoi = $"Cập nhật trạng thái chuyến hàng sang '{dto.TrangThai}'.",
                HinhAnhXacNhan = dto.HinhAnhXacNhan,
                MaNguoiThucHien = dto.MaNguoiThucHien,
                ViTriCapNhat = dto.ViTriHienTai,
                NgayTao = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // Gửi thông báo cho khách hàng nếu có tài khoản
            if (existing.HoaDon != null && existing.HoaDon.MaKhachHang.HasValue)
            {
                var customer = await _context.KhachHangs.FindAsync(existing.HoaDon.MaKhachHang.Value);
                if (customer?.MaTaiKhoan.HasValue == true)
                {
                    string title = "";
                    string content = "";
                    if (dto.TrangThai == "Đang giao")
                    {
                        title = "Đơn hàng đang được giao";
                        content = $"Đơn hàng {existing.HoaDon.MaHD} đã được xuất kho và đang trên đường đến với bạn.";
                    }
                    else if (dto.TrangThai == "Đã giao")
                    {
                        title = "Giao hàng thành công";
                        content = $"Đơn hàng {existing.HoaDon.MaHD} đã được giao thành công. Cảm ơn bạn đã mua hàng!";
                    }

                    if (!string.IsNullOrEmpty(title))
                    {
                        await _notificationService.SendNotificationAsync(
                            title,
                            content,
                            "DonHang",
                            customer.MaTaiKhoan.Value.ToString(),
                            link: $"/order-detail/{existing.HoaDon.MaHoaDon}"
                        );
                    }
                }
            }

            return NoContent();
        }

        [HttpPut("{id}/location")]
        public async Task<IActionResult> UpdateLocation(int id, [FromBody] UpdateLocationDto dto)
        {
            var p = await _context.PhieuGiaoHangs.FindAsync(id);
            if (p == null) return NotFound();

            p.ViTriHienTai = dto.ViTriHienTai;
            p.Lat = dto.Lat;
            p.Lng = dto.Lng;
            p.NgayCapNhat = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật vị trí thành công." });
        }

        public class UpdateLocationDto
        {
            public string? ViTriHienTai { get; set; }
            public decimal? Lat { get; set; }
            public decimal? Lng { get; set; }
        }

        public class UpdateDeliveryDto
        {
            public string TrangThai { get; set; }
            public string? GhiChu { get; set; }
            public DateTime? NgayGiaoThucTe { get; set; }
            public decimal? SoTienThu { get; set; }
            public string? ViTriHienTai { get; set; }
            public decimal? Lat { get; set; }
            public decimal? Lng { get; set; }
            public string? HinhAnhXacNhan { get; set; }
            public int? MaNguoiThucHien { get; set; }
            public List<UpdateItemStatusDto>? Items { get; set; }
        }

    public class UpdateItemStatusDto
    {
        public int MaCTGH { get; set; }
        public string TrangThai { get; set; }
        public string? GhiChu { get; set; }
    }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDelivery(int id)
        {
            var pgh = await _context.PhieuGiaoHangs.Include(p => p.NhanVien).ThenInclude(nv => nv.TaiKhoan).FirstOrDefaultAsync(p => p.MaPhieuGH == id);
            if (pgh == null) return NotFound();

            // Thông báo cho tài xế nếu có
            if (pgh.NhanVien?.TaiKhoan != null)
            {
                await _notificationService.SendNotificationAsync(
                    "Hủy chuyến hàng",
                    $"Chuyến hàng {pgh.MaGH} đã bị hủy hoặc thay đổi. Vui lòng kiểm tra lại lịch trình.",
                    "GiaoHang",
                    pgh.NhanVien.TaiKhoan.MaTaiKhoan.ToString(),
                    link: "/deliveries"
                );
            }

            // Restore HoaDon status if it was in delivery states
            var hd = await _context.HoaDons.FindAsync(pgh.MaHoaDon);
            if (hd != null && (hd.TrangThai == "Chờ giao" || hd.TrangThai == "Đang giao"))
            {
                hd.TrangThai = "Đã xác nhận";
                hd.NgayCapNhat = DateTime.UtcNow;
            }

            _context.PhieuGiaoHangs.Remove(pgh);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetDeliveryHistory(int id)
        {
            var history = await _context.LichSuGiaoHangs
                .Where(h => h.MaPhieuGH == id)
                .OrderByDescending(h => h.NgayTao)
                .Select(h => new {
                    h.MaLichSu,
                    h.TrangThaiCu,
                    h.TrangThaiMoi,
                    h.NoiDungThayDoi,
                    h.HinhAnhXacNhan,
                    h.NgayTao,
                    h.ViTriCapNhat,
                    maNguoiThucHien = h.MaNguoiThucHien
                })
                .ToListAsync();

            return Ok(history);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDeliveryById(int id)
        {
            var p = await _context.PhieuGiaoHangs
                .AsNoTracking()
                .Include(p => p.NhanVien)
                .Include(p => p.HoaDon).ThenInclude(h => h.KhachHang)
                .Include(p => p.HoaDon).ThenInclude(h => h.CTHDs)
                .Include(p => p.CTPhieuGiaoHangs).ThenInclude(ct => ct.SanPham)
                .FirstOrDefaultAsync(p => p.MaPhieuGH == id);

            if (p == null) return NotFound();

            var totalOrdered = p.HoaDon?.CTHDs?.Sum(ct => ct.SoLuong) ?? 0;
            var totalAssigned = await _context.CTPhieuGiaoHangs
                .Where(c => c.PhieuGiaoHang.MaHoaDon == p.MaHoaDon)
                .SumAsync(c => c.SoLuongGiao);
            
            bool canContinue = (totalAssigned < totalOrdered) && (p.HoaDon?.TrangThai != "Đã hủy");

            var pxk = await _context.PhieuXuatKhos
                .Include(x => x.ChiTiet)
                .FirstOrDefaultAsync(x => x.MaPhieuGH == id);

            return Ok(new
            {
                maPhieuGH = p.MaPhieuGH,
                maGH = p.MaGH,
                nguoiGiao = p.NguoiGiao ?? "N/A",
                ngayGiao = p.NgayGiao,
                ngayGiaoDuKien = p.NgayGiaoDuKien,
                ngayGiaoThucTe = p.NgayGiaoThucTe,
                diaChi = p.DiaChi ?? "N/A",
                trangThai = p.TrangThai ?? "Chờ giao",
                ghiChu = p.GhiChu ?? "",
                maHD = p.HoaDon?.MaHD ?? "N/A",
                trangThaiHoaDon = p.HoaDon?.TrangThai ?? "N/A",
                maHoaDon = p.MaHoaDon,
                maNhanVien = p.MaNhanVien,
                tenNhanVien = p.NhanVien?.TenNV ?? "N/A",
                tenKhachHang = p.HoaDon?.KhachHang?.TenKH ?? "Khách vãng lai",
                sdtKhachHang = p.HoaDon?.KhachHang?.Sdt ?? p.HoaDon?.SdtNguoiNhan ?? "N/A",
                pttt = p.HoaDon?.PTTT ?? "N/A",
                tongTienOrder = p.HoaDon?.TongTien ?? 0,
                daThanhToanOrder = p.HoaDon?.ThanhToan ?? 0,
                soTienPhaiThu = p.HoaDon?.SoTienPhaiThu ?? 0,
                coTheGiaoTiep = canContinue,
                trangThaiXuatKho = pxk?.TrangThai ?? "Chưa có",
                chiTiet = p.CTPhieuGiaoHangs?.Select(ct => {
                    // Lấy số lượng đặt từ CTHD liên quan
                    var cthd = p.HoaDon?.CTHDs?.FirstOrDefault(x => x.MaCTHD == ct.MaCTHD || (x.MaSanPham == ct.MaSanPham && ct.MaCTHD == null));
                    var ctxk = pxk?.ChiTiet?.FirstOrDefault(x => x.MaSanPham == ct.MaSanPham);

                    return new
                    {
                        maCTGH = ct.MaCTGH,
                        maSanPham = ct.MaSanPham,
                        tenSanPham = ct.SanPham?.TenSP ?? "N/A",
                        soLuongGiao = ct.SoLuongGiao,
                        soLuongOrder = cthd?.SoLuong ?? 0,
                        soLuongNhanKho = ctxk?.SoLuongThucNhan ?? 0,
                        donGia = cthd?.DonGia ?? ct.SanPham?.GiaBan ?? 0,
                        thanhTien = cthd?.ThanhTien ?? 0,
                        trangThai = (ct.TrangThai == "Chờ giao" && (ctxk?.SoLuongThucNhan ?? 0) > 0) 
                                    ? "Đang giao" 
                                    : (ct.TrangThai ?? "Chờ giao"),
                        ghiChu = ct.GhiChu
                    };
                }).ToList()
            });
        }

        [HttpGet("BatchSuggestions")]
        public async Task<IActionResult> GetBatchSuggestions()
        {
            // 1. Fetch pending orders (Chờ xử lý, Đã xác nhận)
            var pendingOrders = await _context.HoaDons
                .Include(h => h.KhachHang)
                .Where(h => h.TrangThai == "Chờ xử lý" || h.TrangThai == "Đã xác nhận")
                .ToListAsync();

            if (!pendingOrders.Any())
                return Ok(new List<object>());

            // 2. Prepare data for AI
            var ordersForAI = pendingOrders.Select(o => new PendingOrderDto
            {
                maHoaDon = o.MaHoaDon,
                maHD = o.MaHD,
                diaChi = o.DiaChiGiaoHang ?? "",
                tenKhachHang = o.KhachHang?.TenKH ?? "Khách lẻ"
            }).ToList();

            // 3. Get suggestions from Gemini AI
            var aiBatches = await _ai.GetPoolingSuggestionsAI(ordersForAI);

            if (aiBatches == null || aiBatches.Count == 0)
            {
                // Fallback to simple logic if AI fails
                return Ok(new List<object> { new { batchId = 1, routeName = "Chưa phân loại", ordersCount = pendingOrders.Count, orders = ordersForAI } });
            }

            // 4. Map AI result back to full order data
            var result = aiBatches.Select((batch, index) => new
            {
                batchId = index + 1,
                routeName = batch.routeName,
                ordersCount = batch.orders.Count,
                orders = pendingOrders.Where(o => batch.orders.Contains(o.MaHoaDon)).Select(o => new {
                    maHoaDon = o.MaHoaDon,
                    maHD = o.MaHD,
                    tenKhachHang = o.KhachHang?.TenKH ?? "Khách lẻ",
                    diaChi = o.DiaChiGiaoHang,
                    ngayLap = o.NgayLap
                }).ToList()
            }).ToList();

            return Ok(result);
        }
    }

    public class CreateDeliveryDto
    {
        public string? NguoiGiao { get; set; }
        public DateTime? NgayGiao { get; set; }
        public DateTime? NgayGiaoDuKien { get; set; }
        public string? DiaChi { get; set; }
        public string? TrangThai { get; set; }
        public string? GhiChu { get; set; }
        public int MaHoaDon { get; set; }
        public int MaNhanVien { get; set; } // Đây là ID Tài xế
        public int MaNguoiLap { get; set; } // Đây là ID Người tạo phiếu (Quản lý/NVBH)
        public List<CTPhieuGiaoHangDto> Items { get; set; }
    }

    public class CTPhieuGiaoHangDto
    {
        public int MaSanPham { get; set; }
        public int? MaCTHD { get; set; }
        public int SoLuongGiao { get; set; }
        public string? TrangThai { get; set; }
        public string? GhiChu { get; set; }
    }
}
