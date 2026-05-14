using System;
using System.Linq;
using System.Collections.Generic;
using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/orders")]
    public class SalesOrderController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly Services.INotificationService _notificationService;

        public SalesOrderController(ApplicationDbContext ctx, Services.INotificationService notificationService) 
        { 
            _ctx = ctx; 
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var orders = await _ctx.HoaDons
                .Include(h => h.KhachHang)
                .Include(h => h.NhanVien)
                .Include(h => h.CTHDs)
                .OrderByDescending(h => h.NgayLap)
                .ToListAsync();

            // Self-healing check for all orders in list
            bool changed = false;
            foreach (var h in orders)
            {
                bool isReturnState = h.TrangThai != null && (h.TrangThai.Contains("đổi") || h.TrangThai.Contains("trả"));
                if (h.TrangThai != "Hoàn thành" && h.TrangThai != "Đã hủy" && !isReturnState && h.CTHDs != null && h.CTHDs.Any())
                {
                    var totalOrdered = h.CTHDs.Sum(ct => ct.SoLuong);
                    var totalDelivered = await _ctx.CTPhieuGiaoHangs
                        .Where(c => c.PhieuGiaoHang.MaHoaDon == h.MaHoaDon && c.PhieuGiaoHang.TrangThai == "Đã giao")
                        .SumAsync(c => (int?)c.SoLuongGiao) ?? 0;

                    if (totalDelivered >= totalOrdered && totalOrdered > 0)
                    {
                        h.TrangThai = "Hoàn thành";
                        h.NgayGiao = DateTime.UtcNow;
                        h.NgayCapNhat = DateTime.UtcNow;
                        changed = true;
                    }
                }
            }
            if (changed) await _ctx.SaveChangesAsync();

            return Ok(orders.Select(h => new
            {
                maHoaDon = h.MaHoaDon, maHD = h.MaHD,
                ngayLap = h.NgayLap, ngayGiao = h.NgayGiao,
                tongTien = h.TongTien, giamGia = h.GiamGia, thanhToan = h.ThanhToan,
                pttt = h.PTTT, trangThai = h.TrangThai, ghiChu = h.GhiChu,
                maNhanVien = h.MaNhanVien, maKhachHang = h.MaKhachHang, maKhuyenMai = h.MaKhuyenMai,
                tenKhachHang = h.KhachHang != null ? h.KhachHang.TenKH : "",
                tenNhanVien = h.NhanVien != null ? h.NhanVien.TenNV : "",
                coYeuCauDoiTra = h.TrangThai != null && (h.TrangThai.Contains("đổi") || h.TrangThai.Contains("trả"))
            }));
        }


        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetByCustomer(int customerId)
        {
            var orders = await _ctx.HoaDons
                .Where(h => h.MaKhachHang == customerId)
                .Include(h => h.KhachHang)
                .Include(h => h.NhanVien)
                .Include(h => h.CTHDs)
                .OrderByDescending(h => h.NgayLap)
                .ToListAsync();

            bool changed = false;
            foreach (var h in orders)
            {
                bool isReturnState = h.TrangThai != null && (h.TrangThai.Contains("đổi") || h.TrangThai.Contains("trả"));
                if (h.TrangThai != "Hoàn thành" && h.TrangThai != "Đã hủy" && !isReturnState && h.CTHDs != null && h.CTHDs.Any())
                {
                    var totalOrdered = h.CTHDs.Sum(ct => ct.SoLuong);
                    var totalDelivered = await _ctx.CTPhieuGiaoHangs
                        .Where(c => c.PhieuGiaoHang.MaHoaDon == h.MaHoaDon && c.PhieuGiaoHang.TrangThai == "Đã giao")
                        .SumAsync(c => (int?)c.SoLuongGiao) ?? 0;

                    if (totalDelivered >= totalOrdered && totalOrdered > 0)
                    {
                        h.TrangThai = "Hoàn thành";
                        h.NgayGiao = DateTime.UtcNow;
                        h.NgayCapNhat = DateTime.UtcNow;
                        changed = true;
                    }
                }
            }
            if (changed) await _ctx.SaveChangesAsync();

            return Ok(orders.Select(h => new
            {
                maHoaDon = h.MaHoaDon, maHD = h.MaHD,
                ngayLap = h.NgayLap, ngayGiao = h.NgayGiao,
                tongTien = h.TongTien, giamGia = h.GiamGia, thanhToan = h.ThanhToan,
                pttt = h.PTTT, trangThai = h.TrangThai, ghiChu = h.GhiChu,
                maNhanVien = h.MaNhanVien, maKhachHang = h.MaKhachHang, maKhuyenMai = h.MaKhuyenMai,
                tenKhachHang = h.KhachHang != null ? h.KhachHang.TenKH : "",
                tenNhanVien = h.NhanVien != null ? h.NhanVien.TenNV : "",
                coYeuCauDoiTra = h.TrangThai != null && (h.TrangThai.Contains("đổi") || h.TrangThai.Contains("trả"))
            }));
        }


        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var h = await _ctx.HoaDons
                .AsNoTracking()
                .Include(h => h.KhachHang)
                .Include(h => h.NhanVien)
                .Include(h => h.CTHDs).ThenInclude(ct => ct.SanPham)
                .FirstOrDefaultAsync(h => h.MaHoaDon == id);

            if (h == null) return NotFound();

            var deliveredQtys = await _ctx.CTPhieuGiaoHangs
                .Where(c => c.PhieuGiaoHang.MaHoaDon == id && c.MaCTHD != null && c.PhieuGiaoHang.TrangThai == "Đã giao")
                .GroupBy(c => c.MaCTHD)
                .Select(g => new { MaCTHD = g.Key.Value, Qty = g.Sum(x => x.SoLuongGiao) })
                .ToDictionaryAsync(x => x.MaCTHD, x => x.Qty);

            var shippingQtys = await _ctx.CTPhieuGiaoHangs
                .Where(c => c.PhieuGiaoHang.MaHoaDon == id && c.MaCTHD != null && c.PhieuGiaoHang.TrangThai == "Đang giao")
                .GroupBy(c => c.MaCTHD)
                .Select(g => new { MaCTHD = g.Key.Value, Qty = g.Sum(x => x.SoLuongGiao) })
                .ToDictionaryAsync(x => x.MaCTHD, x => x.Qty);

            var pendingQtys = await _ctx.CTPhieuGiaoHangs
                .Where(c => c.PhieuGiaoHang.MaHoaDon == id && c.MaCTHD != null && c.PhieuGiaoHang.TrangThai == "Chờ giao")
                .GroupBy(c => c.MaCTHD)
                .Select(g => new { MaCTHD = g.Key.Value, Qty = g.Sum(x => x.SoLuongGiao) })
                .ToDictionaryAsync(x => x.MaCTHD, x => x.Qty);

            // Self-healing: if everything is delivered, ensure status is "Hoàn thành"
            bool isReturnState = h.TrangThai != null && (h.TrangThai.Contains("đổi") || h.TrangThai.Contains("trả"));
            if (h.TrangThai != "Hoàn thành" && h.TrangThai != "Đã hủy" && !isReturnState)
            {
                var totalOrdered = h.CTHDs.Sum(ct => ct.SoLuong);
                var totalDelivered = deliveredQtys.Values.Sum();
                if (totalDelivered >= totalOrdered && totalOrdered > 0)
                {
                    h.TrangThai = "Hoàn thành";
                    h.NgayGiao = DateTime.UtcNow;
                    h.NgayCapNhat = DateTime.UtcNow;
                    await _ctx.SaveChangesAsync();
                }
            }


            var returnItems = await _ctx.CTPhieuDoiTras
                .Where(ct => ct.PhieuDoiTra.MaHoaDon == id)
                .Select(ct => new {
                    ct.MaSanPham,
                    ct.SoLuong,
                    ct.Loai,
                    ct.TrangThai,
                    MaDT = ct.PhieuDoiTra.MaDT
                })
                .ToListAsync();

            object? latestDelivery = null;
            try {
                latestDelivery = await _ctx.PhieuGiaoHangs
                    .Where(p => p.MaHoaDon == id)
                    .OrderByDescending(p => p.NgayTao)
                    .Select(p => new {
                        p.MaGH,
                        p.TrangThai,
                        p.ViTriHienTai,
                        p.Lat,
                        p.Lng,
                        p.NgayGiaoDuKien,
                        p.NguoiGiao,
                        p.NgayCapNhat
                    })
                    .FirstOrDefaultAsync();
            } catch (Exception ex) {
                Console.WriteLine($"[Tracking Error] Failed to fetch latest delivery info: {ex.Message}");
            }

            return Ok(new
            {
                maHoaDon = h.MaHoaDon,
                maHD = h.MaHD,
                ngayLap = h.NgayLap,
                ngayGiao = h.NgayGiao,
                coYeuCauDoiTra = h.TrangThai != null && (h.TrangThai.Contains("đổi") || h.TrangThai.Contains("trả")),
                latestDelivery = latestDelivery,
                tongTien = h.TongTien ?? 0,
                giamGia = h.GiamGia,
                thanhToan = h.ThanhToan ?? 0,
                pttt = h.PTTT ?? "Tiền mặt",
                trangThai = h.TrangThai ?? "Chờ xử lý",
                ghiChu = h.GhiChu ?? "",
                tenKhachHang = !string.IsNullOrEmpty(h.KhachHang?.TenKH) ? h.KhachHang.TenKH : "Khách vãng lai",
                tenNhanVien = !string.IsNullOrEmpty(h.NhanVien?.TenNV) ? h.NhanVien.TenNV : "Chưa bộ phận",
                
                maKhachHang = h.MaKhachHang,
                maNhanVien = h.MaNhanVien,
                maKhuyenMai = h.MaKhuyenMai,
                sdtKhachHang = h.KhachHang?.Sdt,
                emailKhachHang = h.KhachHang?.Email,
                
                // New Fields
                tenNguoiNhan = h.TenNguoiNhan,
                sdtNguoiNhan = h.SdtNguoiNhan,
                emailNguoiNhan = h.EmailNguoiNhan,
                diaChiGiaoHang = h.DiaChiGiaoHang,
                phiVanChuyen = h.PhiVanChuyen,
                yeuCauVat = h.YeuCauVat,
                vatType = h.VatType,
                vatBuyerName = h.VatBuyerName,
                vatEmail = h.VatEmail,
                vatAddress = h.VatAddress,
                vatIdCard = h.VatIdCard,
                vatPassport = h.VatPassport,
                vatCompanyName = h.VatCompanyName,
                vatCompanyAddress = h.VatCompanyAddress,
                vatTaxId = h.VatTaxId,
                vatBudgetCode = h.VatBudgetCode,
                anhBangChung = h.AnhBangChung,
                soTienPhaiThu = h.SoTienPhaiThu,

                chiTiet = (h.CTHDs ?? new List<CTHD>()).Select(ct => new
                {
                    maCTHD = ct.MaCTHD,
                    maSanPham = ct.MaSanPham,
                    tenSanPham = ct.SanPham?.TenSP ?? "Sản phẩm đã xóa (ID: " + ct.MaSanPham + ")",
                    soLuong = ct.SoLuong,
                    soLuongDaGiao = deliveredQtys.GetValueOrDefault(ct.MaCTHD, 0),
                    soLuongDangGiao = shippingQtys.GetValueOrDefault(ct.MaCTHD, 0),
                    soLuongChoGiao = pendingQtys.GetValueOrDefault(ct.MaCTHD, 0),
                    donGia = ct.DonGia,
                    thanhTien = ct.ThanhTien ?? (ct.SoLuong * ct.DonGia - ct.GiamGia),
                    diaChiGiaoHang = ct.DiaChiGiaoHang,
                    trongLuong = ct.SanPham != null ? ct.SanPham.TrongLuong : 0,
                    donViTrongLuong = ct.SanPham != null ? ct.SanPham.DonViTrongLuong : "kg",
                    doiTra = returnItems.Where(r => r.MaSanPham == ct.MaSanPham).Select(r => new {
                        r.SoLuong,
                        r.Loai,
                        r.TrangThai,
                        r.MaDT
                    }).ToList()
                }).ToList()
            });
        }

        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetHistory(int id)
        {
            var history = await _ctx.LichSuHoaDons
                .Where(h => h.MaHoaDon == id)
                .Include(h => h.NhanVien)
                .OrderByDescending(h => h.NgayTao)
                .Select(h => new
                {
                    maLichSu = h.MaLichSu,
                    trangThaiCu = h.TrangThaiCu,
                    trangThaiMoi = h.TrangThaiMoi,
                    noiDungThayDoi = h.NoiDungThayDoi,
                    ngayTao = h.NgayTao,
                    tenNhanVien = h.NhanVien != null ? h.NhanVien.TenNV : "Khách hàng / Hệ thống"
                })
                .ToListAsync();
            return Ok(history);
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _ctx.HoaDons.FindAsync(id);
            if (order == null) return NotFound();

            var currentStatus = order.TrangThai?.Trim();
            if (currentStatus != "Chờ xử lý" && currentStatus != "Chờ xác nhận" && currentStatus != "Chờ thanh toán")
            {
                return BadRequest(new { message = "Chỉ có thể hủy đơn hàng đang ở trạng thái Chờ xử lý hoặc Chờ xác nhận." });
            }

            string oldStatus = order.TrangThai;
            order.TrangThai = "Đã hủy";
            order.NgayCapNhat = DateTime.UtcNow;

            var history = new LichSuHoaDon
            {
                MaHoaDon = id,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = "Đã hủy",
                NoiDungThayDoi = "Khách hàng yêu cầu hủy đơn hàng qua ứng dụng.",
                NgayTao = DateTime.UtcNow
            };
            _ctx.LichSuHoaDons.Add(history);

            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Đã hủy đơn hàng thành công." });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] HoaDonDto dto)
        {
            if (dto == null) return BadRequest();
            using var transaction = await _ctx.Database.BeginTransactionAsync();
            try {
                // Ràng buộc thời gian giao hàng (tối đa 3 ngày)
                if (dto.NgayGiao.HasValue)
                {
                    var maxDate = DateTime.UtcNow.Date.AddDays(3);
                    if (dto.NgayGiao.Value.Date > maxDate)
                    {
                        return BadRequest(new { message = "Thời gian giao hàng dự kiến không được quá 3 ngày kể từ ngày đặt hàng." });
                    }
                }

                // Check debt limit based on membership rank
                if (dto.MaKhachHang.HasValue && (dto.PTTT.Contains("nợ") || dto.PTTT.Contains("sau") || dto.PTTT.Contains("khi nhận hàng")))
                {
                    var kh = await _ctx.KhachHangs.FindAsync(dto.MaKhachHang.Value);
                    if (kh != null)
                    {
                        decimal limit = kh.HangThanhVien switch
                        {
                            "Bạc" => 50000000,
                            "Vàng" => 70000000,
                            "Kim cương" => 100000000,
                            _ => 20000000 // Default for Bronze/Others
                        };

                        var currentDebt = await _ctx.CongNos
                            .Where(c => c.MaKhachHang == dto.MaKhachHang.Value && c.LoaiCongNo == "Phải thu")
                            .SumAsync(c => c.SoTienConLai ?? 0);

                        // Amount that will be added to debt (Total - initial payment)
                        var newDebtAmount = dto.TongTien - (dto.PTTT.Contains("ATM") ? (dto.ThanhToan ?? 0) : 0);

                        if (currentDebt + newDebtAmount > limit)
                        {
                            return BadRequest(new { 
                                message = $"Bạn đã vượt quá hạn mức nợ cho phép của hạng {kh.HangThanhVien} ({limit:N0}đ). " +
                                          $"Dư nợ hiện tại: {currentDebt:N0}đ. Vui lòng thanh toán bớt nợ cũ trước khi đặt đơn hàng mới." 
                            });
                        }
                    }
                }

                var hd = new HoaDon
                {
                    NgayLap = dto.NgayLap ?? DateTime.UtcNow,
                    NgayGiao = dto.NgayGiao, TongTien = dto.TongTien,
                    GiamGia = dto.GiamGia, 
                    ThanhToan = dto.PTTT.Contains("ATM") ? (dto.ThanhToan ?? 0) : 0,
                    SoTienPhaiThu = dto.PTTT.Contains("ATM") ? 0 : (dto.ThanhToan ?? 0),
                    PTTT = dto.PTTT, TrangThai = dto.TrangThai ?? "Chờ xử lý",
                    GhiChu = dto.GhiChu, MaNhanVien = dto.MaNhanVien, MaKhachHang = dto.MaKhachHang, MaKhuyenMai = dto.MaKhuyenMai,
                    NgayTao = DateTime.UtcNow,

                    
                    // New fields
                    TenNguoiNhan = dto.TenNguoiNhan,
                    SdtNguoiNhan = dto.SdtNguoiNhan,
                    EmailNguoiNhan = dto.EmailNguoiNhan,
                    DiaChiGiaoHang = dto.DiaChiGiaoHang,
                    YeuCauVat = dto.YeuCauVat,
                    VatType = dto.VatType,
                    VatBuyerName = dto.VatBuyerName,
                    VatEmail = dto.VatEmail,
                    VatAddress = dto.VatAddress,
                    VatIdCard = dto.VatIdCard,
                    VatPassport = dto.VatPassport,
                    VatCompanyName = dto.VatCompanyName,
                    VatCompanyAddress = dto.VatCompanyAddress,
                    VatTaxId = dto.VatTaxId,
                    VatBudgetCode = dto.VatBudgetCode,
                    PhiVanChuyen = dto.PhiVanChuyen ?? 0,
                    AnhBangChung = dto.AnhBangChung
                };
                _ctx.HoaDons.Add(hd);
                await _ctx.SaveChangesAsync();

                // Log history: Create
                _ctx.LichSuHoaDons.Add(new LichSuHoaDon
                {
                    MaHoaDon = hd.MaHoaDon,
                    TrangThaiMoi = hd.TrangThai,
                    NoiDungThayDoi = "Đơn hàng đã được khởi tạo.",
                    MaNguoiThucHien = dto.MaNhanVien
                });
                await _ctx.SaveChangesAsync();

                PhieuXuatKho? pxk = null;
                // Đơn POS bán tại quầy: tạo phiếu xuất kho ngay (vì hàng xuất ngay)
                if (hd.TrangThai == "Hoàn thành")
                {
                    var creator = await _ctx.NhanViens.FindAsync(hd.MaNhanVien);
                    pxk = new PhieuXuatKho
                    {
                        MaHoaDon = hd.MaHoaDon,
                        MaNhanVien = hd.MaNhanVien,
                        NgayXuat = DateTime.UtcNow,
                        NgayTao = DateTime.UtcNow,
                        NguoiXuat = creator?.TenNV ?? "Hệ thống",
                        GhiChu = $"Xuất kho trực tiếp tại quầy - Đơn hàng {hd.MaHD}",
                        ChuKyNguoiLap = creator?.ChuKy,
                        TrangThai = "Chờ xuất" // Thủ kho xác nhận trước khi Quản lý duyệt
                    };
                    _ctx.PhieuXuatKhos.Add(pxk);
                    await _ctx.SaveChangesAsync();
                }

            if (dto.Items != null && dto.Items.Any())
            {
                foreach (var item in dto.Items)
                {
                    var kho = await _ctx.CTKhoHangs.Include(k => k.SanPham).FirstOrDefaultAsync(k => k.MaSanPham == item.MaSanPham);
                    
                    // Kiểm tra tồn kho khả dụng
                    if (kho == null || kho.SoLuongTon < item.SoLuong)
                    {
                        var tenSP = kho?.SanPham?.TenSP ?? $"Sản phẩm ID {item.MaSanPham}";
                        var tonHienTai = kho?.SoLuongTon ?? 0;
                        throw new Exception($"Sản phẩm '{tenSP}' không đủ tồn kho (Yêu cầu: {item.SoLuong}, Hiện có: {tonHienTai}). Vui lòng kiểm tra lại!");
                    }

                    _ctx.CTHDs.Add(new CTHD
                    {
                        MaHoaDon = hd.MaHoaDon,
                        MaSanPham = item.MaSanPham,
                        SoLuong = item.SoLuong,
                        DonGia = item.DonGia,
                        GiamGia = item.GiamGia,
                        ThanhTien = (item.SoLuong * item.DonGia) - item.GiamGia,
                        NgayTao = DateTime.UtcNow,
                        DiaChiGiaoHang = item.DiaChiGiaoHang,
                        TenNguoiNhan = item.TenNguoiNhan,
                        SdtNguoiNhan = item.SdtNguoiNhan
                    });

                    // Cập nhật tồn kho
                    if (hd.TrangThai == "Hoàn thành")
                    {
                        kho.SoLuong -= item.SoLuong; // Trừ thực tế nếu đã hoàn thành
                        
                        // Thêm vào chi tiết xuất kho
                        if (pxk != null)
                        {
                            _ctx.CTPhieuXuatKhos.Add(new CTPhieuXuatKho
                            {
                                MaPhieuXK = pxk.MaPhieuXK,
                                MaSanPham = item.MaSanPham,
                                SoLuong = item.SoLuong,
                                MaKho = kho.MaKhoHang,
                                DonGiaVon = kho.SanPham?.GiaNhap ?? 0
                            });
                        }
                    }
                    kho.SoLuongTon -= item.SoLuong; // Luôn trừ khả dụng
                    kho.NgayCapNhat = DateTime.UtcNow;

                    // Kiểm tra tồn kho thấp
                    if (kho.SoLuongTon <= (kho.SanPham?.MucTonToiThieu ?? 5))
                    {
                        await _notificationService.SendToPermissionAsync(
                            "inventory",
                            "Cảnh báo tồn kho thấp",
                            $"Sản phẩm {kho.SanPham?.TenSP} sắp hết hàng (Còn {kho.SoLuongTon} {kho.SanPham?.DonViTinh}).",
                            "HeThong",
                            link: "/inventory"
                        );
                    }
                }
            }

                await _ctx.SaveChangesAsync(); 
                await SyncCongNoFromHoaDon(hd.MaHoaDon);
                if (hd.TrangThai == "Hoàn thành" && hd.MaKhachHang.HasValue) 
                    await RecalculateCustomerTier(hd.MaKhachHang.Value);

                // Gửi thông báo cho hệ thống/Admin về đơn hàng mới
                await _notificationService.SendToPermissionAsync(
                    "orders",
                    "Đơn hàng mới",
                    $"Có đơn hàng mới {hd.MaHD} từ {(string.IsNullOrEmpty(hd.TenNguoiNhan) ? "Khách hàng" : hd.TenNguoiNhan)}. Tổng tiền: {hd.TongTien:N0}đ",
                    "DonHang",
                    link: $"/orders"
                );

                // Gửi thông báo cho khách hàng
                if (hd.MaKhachHang.HasValue)
                {
                    var kh = await _ctx.KhachHangs.FindAsync(hd.MaKhachHang.Value);
                    if (kh?.MaTaiKhoan.HasValue == true)
                    {
                        await _notificationService.SendNotificationAsync(
                            "Đặt hàng thành công",
                            $"Đơn hàng {hd.MaHD} của bạn đã được đặt thành công. Chúng tôi sẽ sớm xử lý.",
                            "DonHang",
                            kh.MaTaiKhoan.Value.ToString(),
                            link: $"/order-detail/{hd.MaHoaDon}"
                        );
                    }
                }

                await transaction.CommitAsync();
                return Ok(new { maHoaDon = hd.MaHoaDon });
            }
            catch (DbUpdateException dbEx) 
            {
                await transaction.RollbackAsync();
                var innerMsg = dbEx.InnerException?.Message ?? dbEx.Message;
                Console.WriteLine($"[DB Error] {innerMsg}");
                return StatusCode(500, new { message = "Lỗi cơ sở dữ liệu: " + innerMsg });
            }
            catch (Exception ex) 
            { 
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message }); 
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] HoaDonDto dto)
        {
            try
            {
                var hd = await _ctx.HoaDons.FindAsync(id);
                if (hd == null) return NotFound();

            if (dto.NgayLap.HasValue) hd.NgayLap = dto.NgayLap.Value;
            hd.NgayGiao = dto.NgayGiao; hd.TongTien = dto.TongTien;
            hd.GiamGia = dto.GiamGia; hd.ThanhToan = dto.ThanhToan;
            hd.PTTT = dto.PTTT; 

            string? oldStatus = hd.TrangThai;
            hd.TrangThai = dto.TrangThai ?? hd.TrangThai;
            hd.GhiChu = dto.GhiChu; hd.MaNhanVien = dto.MaNhanVien;
            hd.MaKhachHang = dto.MaKhachHang; hd.MaKhuyenMai = dto.MaKhuyenMai;

            if (oldStatus != hd.TrangThai)
            {
                _ctx.LichSuHoaDons.Add(new LichSuHoaDon
                {
                    MaHoaDon = id,
                    TrangThaiCu = oldStatus,
                    TrangThaiMoi = hd.TrangThai,
                    NoiDungThayDoi = $"Cập nhật trạng thái từ '{oldStatus}' sang '{hd.TrangThai}'.",
                    MaNguoiThucHien = dto.MaNhanVien
                });
            }

            PhieuXuatKho? pxk = null;
            // Đơn online: Tạo phiếu xuất kho khi Quản lý XÁC NHẬN đơn hàng
            // (không phải lúc Hoàn thành - vì cần thủ kho soạn hàng trước khi giao)
            if (hd.TrangThai == "Đã xác nhận" && oldStatus != "Đã xác nhận")
            {
                // Chỉ tạo nếu chưa có phiếu xuất kho nào liên kết với đơn hàng này
                bool pxkExists = await _ctx.PhieuXuatKhos.AnyAsync(p => p.MaHoaDon == id);
                if (!pxkExists)
                {
                    int? staffId = dto.MaNhanVien ?? hd.MaNhanVien;
                    var confirmedBy = staffId.HasValue ? await _ctx.NhanViens.FindAsync(staffId.Value) : null;
                    pxk = new PhieuXuatKho
                    {
                        MaHoaDon = id,
                        MaNhanVien = dto.MaNhanVien ?? hd.MaNhanVien,
                        NgayXuat = DateTime.UtcNow,
                        NgayTao = DateTime.UtcNow,
                        NguoiXuat = confirmedBy?.TenNV ?? "Hệ thống",
                        GhiChu = $"Xuất kho cho đơn hàng online {hd.MaHD} - Quản lý đã xác nhận",
                        ChuKyNguoiLap = confirmedBy?.ChuKy,
                        TrangThai = "Chờ duyệt" // Bước 1: Quản lý duyệt phiếu xuất
                    };
                    _ctx.PhieuXuatKhos.Add(pxk);
                    await _ctx.SaveChangesAsync();

                    _ctx.LichSuPhieuXuatKhos.Add(new LichSuPhieuXuatKho
                    {
                        MaPhieuXK = pxk.MaPhieuXK,
                        TrangThaiMoi = "Chờ duyệt",
                        NoiDungThayDoi = $"Khởi tạo phiếu xuất kho sau khi Quản lý xác nhận đơn hàng {hd.MaHD}. Người thực hiện: {confirmedBy?.TenNV ?? "Hệ thống"}",
                        MaNguoiThucHien = staffId,
                        NgayTao = DateTime.UtcNow
                    });
                }
            }

            var oldItems = await _ctx.CTHDs.Where(c => c.MaHoaDon == id).ToListAsync();
            foreach (var oldItem in oldItems)
            {
                var kho = await _ctx.CTKhoHangs.FirstOrDefaultAsync(k => k.MaSanPham == oldItem.MaSanPham);
                if (kho != null) 
                {
                    if (hd.TrangThai == "Hoàn thành") kho.SoLuong += oldItem.SoLuong;
                    kho.SoLuongTon += oldItem.SoLuong;
                }
                _ctx.CTHDs.Remove(oldItem);
            }

            if (dto.Items != null && dto.Items.Any())
            {
                foreach (var item in dto.Items)
                {
                    _ctx.CTHDs.Add(new CTHD
                    {
                        MaHoaDon = id, MaSanPham = item.MaSanPham, SoLuong = item.SoLuong,
                        DonGia = item.DonGia, GiamGia = item.GiamGia,
                        ThanhTien = (item.SoLuong * item.DonGia) - item.GiamGia,
                        NgayTao = DateTime.UtcNow,
                        DiaChiGiaoHang = item.DiaChiGiaoHang,
                        TenNguoiNhan = item.TenNguoiNhan,
                        SdtNguoiNhan = item.SdtNguoiNhan
                    });
                    var kho = await _ctx.CTKhoHangs.FirstOrDefaultAsync(k => k.MaSanPham == item.MaSanPham);
                    if (kho != null) 
                    {
                        if (hd.TrangThai == "Hoàn thành" || hd.TrangThai == "Đã xác nhận")
                        {
                            if (hd.TrangThai == "Hoàn thành") kho.SoLuong -= item.SoLuong;
                            
                            // Log to outbound history
                            if (pxk != null)
                            {
                                _ctx.CTPhieuXuatKhos.Add(new CTPhieuXuatKho
                                {
                                    MaPhieuXK = pxk.MaPhieuXK,
                                    MaSanPham = item.MaSanPham,
                                    SoLuong = item.SoLuong,
                                    MaKho = kho.MaKhoHang,
                                    DonGiaVon = 0
                                });
                            }
                        }
                        kho.SoLuongTon -= item.SoLuong;
                    }
                }
            }

                await _ctx.SaveChangesAsync(); 
                await SyncCongNoFromHoaDon(hd.MaHoaDon);
                if (hd.TrangThai == "Hoàn thành" && hd.MaKhachHang.HasValue) 
                    await RecalculateCustomerTier(hd.MaKhachHang.Value);

                // Gửi thông báo cho khách hàng
                if (hd.MaKhachHang.HasValue && oldStatus != hd.TrangThai)
                {
                    var kh = await _ctx.KhachHangs.FindAsync(hd.MaKhachHang.Value);
                    if (kh?.MaTaiKhoan.HasValue == true)
                    {
                        string title = "";
                        string content = "";
                        if (hd.TrangThai == "Đã xác nhận")
                        {
                            title = "Đơn hàng đã được xác nhận";
                            content = $"Đơn hàng {hd.MaHD} của bạn đã được quản lý xác nhận và đang chờ chuẩn bị.";
                        }
                        else if (hd.TrangThai == "Đã hủy")
                        {
                            title = "Đơn hàng đã bị hủy";
                            content = $"Đơn hàng {hd.MaHD} của bạn đã bị hủy. Vui lòng liên hệ nếu có thắc mắc.";
                        }
                        else if (hd.TrangThai == "Hoàn thành")
                        {
                            title = "Đơn hàng hoàn tất";
                            content = $"Đơn hàng {hd.MaHD} của bạn đã hoàn tất. Cảm ơn bạn đã tin tưởng chúng tôi!";
                        }
                        else if (hd.TrangThai == "Yêu cầu đổi/trả hàng")
                        {
                            title = "Đã nhận yêu cầu đổi trả";
                            content = $"Yêu cầu đổi trả cho đơn hàng {hd.MaHD} của bạn đã được tiếp nhận.";
                        }

                        if (!string.IsNullOrEmpty(title))
                        {
                            await _notificationService.SendNotificationAsync(
                                title,
                                content,
                                "DonHang",
                                kh.MaTaiKhoan.Value.ToString(),
                                link: $"/order-detail/{hd.MaHoaDon}"
                            );
                        }
                    }
                }

                return Ok(new { maHoaDon = hd.MaHoaDon });
            }
            catch (Exception ex) 
            { 
                Console.WriteLine($"[Order Update Error] {ex.InnerException?.Message ?? ex.Message}");
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message }); 
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var hd = await _ctx.HoaDons.FindAsync(id);
            if (hd == null) return NotFound();

            // 1. Restore stock (if order was completed)
            var items = await _ctx.CTHDs.Where(c => c.MaHoaDon == id).ToListAsync();
            foreach (var item in items)
            {
                var kho = await _ctx.CTKhoHangs.FirstOrDefaultAsync(k => k.MaSanPham == item.MaSanPham);
                if (kho != null) 
                {
                    if (hd.TrangThai == "Hoàn thành") kho.SoLuong += item.SoLuong;
                    kho.SoLuongTon += item.SoLuong;
                }
                _ctx.CTHDs.Remove(item);
            }

            // 2. Delete related debts
            var debts = await _ctx.CongNos.Where(c => c.MaHoaDon == id).ToListAsync();
            _ctx.CongNos.RemoveRange(debts);

            // 3. Delete the order
            _ctx.HoaDons.Remove(hd);

            try 
            { 
                await _ctx.SaveChangesAsync(); 
                if (hd.MaKhachHang.HasValue) await RecalculateCustomerTier(hd.MaKhachHang.Value);
                return NoContent(); 
            }
            catch (Exception ex) { return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message }); }
        }

        private async Task RecalculateCustomerTier(int customerId)
        {
            var kh = await _ctx.KhachHangs.FindAsync(customerId);
            if (kh == null) return;

            var tongChiTieu = await _ctx.HoaDons
                .Where(h => h.MaKhachHang == customerId && h.TrangThai == "Hoàn thành")
                .SumAsync(h => (decimal?)(h.ThanhToan ?? 0)) ?? 0;

            string oldTier = kh.HangThanhVien;
            string newTier = tongChiTieu switch
            {
                >= 60_000_000 => "Kim Cương",
                >= 45_000_000 => "Vàng",
                >= 15_000_000 => "Bạc",
                _              => "Đồng"
            };

            kh.TongChiTieu = tongChiTieu;
            if (oldTier != newTier)
            {
                kh.HangThanhVien = newTier;
                _ctx.LichSuThangHangs.Add(new LichSuThangHang
                {
                    MaKhachHang = customerId,
                    HangCu = oldTier,
                    HangMoi = newTier,
                    TongChiTieuHienTai = tongChiTieu,
                    LyDo = $"Cập nhật tự động sau khi hoàn thành đơn hàng. Tổng chi tiêu đạt {tongChiTieu:N0}đ",
                    NgayThayDoi = DateTime.UtcNow
                });
            }
            
            await _ctx.SaveChangesAsync();
        }

        private async Task SyncCongNoFromHoaDon(int hoaDonId)
        {
            var hd = await _ctx.HoaDons.FindAsync(hoaDonId);
            if (hd == null || !hd.MaKhachHang.HasValue) return;

            var tongTien = hd.TongTien ?? 0;
            var daThanhToan = hd.ThanhToan ?? 0;
            var conLai = tongTien - daThanhToan;

            if (conLai <= 0)
            {
                // Nếu đã trả hết, cập nhật bản ghi công nợ hiện có (nếu có)
                var existingCn = await _ctx.CongNos.FirstOrDefaultAsync(c => c.MaHoaDon == hoaDonId);
                if (existingCn != null)
                {
                    existingCn.SoTienDaTra = tongTien;
                    existingCn.SoTienConLai = 0;
                    existingCn.TrangThai = "Đã thanh toán";
                    existingCn.NgayCapNhat = DateTime.UtcNow;
                    await _ctx.SaveChangesAsync();
                }
                return;
            }

            var cn = await _ctx.CongNos.FirstOrDefaultAsync(c => c.MaHoaDon == hoaDonId);
            if (cn == null)
            {
                cn = new CongNo
                {
                    MaHoaDon = hoaDonId,
                    MaKhachHang = hd.MaKhachHang,
                    SoTienNo = tongTien,
                    SoTienDaTra = daThanhToan,
                    SoTienConLai = conLai,
                    LoaiCongNo = "Phải thu",
                    TrangThai = "Chưa thanh toán",
                    NgayTao = DateTime.UtcNow,
                    NgayCapNhat = DateTime.UtcNow,
                    HanThanhToan = DateTime.UtcNow.AddDays(30) // Mặc định 30 ngày
                };
                _ctx.CongNos.Add(cn);
            }
            else
            {
                cn.SoTienNo = tongTien;
                cn.SoTienDaTra = daThanhToan;
                cn.SoTienConLai = conLai;
                cn.TrangThai = conLai > 0 ? "Chưa thanh toán" : "Đã thanh toán";
                cn.NgayCapNhat = DateTime.UtcNow;
            }
            await _ctx.SaveChangesAsync();
        }
    }

    public class HoaDonDto
    {
        public string? MaHD { get; set; }
        public DateTime? NgayLap { get; set; }
        public DateTime? NgayGiao { get; set; }
        public decimal? TongTien { get; set; }
        public decimal GiamGia { get; set; }
        public decimal? ThanhToan { get; set; }
        public string? PTTT { get; set; }
        public string? TrangThai { get; set; }
        public string? GhiChu { get; set; }
        public int? MaNhanVien { get; set; }
        public int? MaKhachHang { get; set; }
        public int? MaKhuyenMai { get; set; }

        public List<CTHDDto>? Items { get; set; }

        // New delivery and VAT fields
        public string? TenNguoiNhan { get; set; }
        public string? SdtNguoiNhan { get; set; }
        public string? EmailNguoiNhan { get; set; }
        public string? DiaChiGiaoHang { get; set; }
        public bool YeuCauVat { get; set; }
        public string? VatType { get; set; }
        public string? VatBuyerName { get; set; }
        public string? VatEmail { get; set; }
        public string? VatAddress { get; set; }
        public string? VatIdCard { get; set; }
        public string? VatPassport { get; set; }
        public string? VatCompanyName { get; set; }
        public string? VatCompanyAddress { get; set; }
        public string? VatTaxId { get; set; }
        public string? VatBudgetCode { get; set; }
        public decimal? PhiVanChuyen { get; set; }
        [JsonPropertyName("anhBangChung")]
        public string? AnhBangChung { get; set; }
        public decimal? SoTienPhaiThu { get; set; }
    }

    public class CTHDDto
    {
        public int MaSanPham { get; set; }
        public int SoLuong { get; set; }
        public decimal DonGia { get; set; }
        public decimal GiamGia { get; set; }
        public string? DiaChiGiaoHang { get; set; }
        public string? TenNguoiNhan { get; set; }
        public string? SdtNguoiNhan { get; set; }
    }
}
