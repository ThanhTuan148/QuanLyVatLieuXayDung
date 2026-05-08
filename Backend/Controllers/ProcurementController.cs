using System;
using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Drawing;
using BuildingMaterialAPI.Services;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/procurement")]
    public class ProcurementController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly Services.INotificationService _notificationService;
        private readonly IEmailService _email;

        public ProcurementController(ApplicationDbContext ctx, Services.INotificationService notificationService, IEmailService email)
        {
            _ctx = ctx;
            _notificationService = notificationService;
            _email = email;
        }

        // 1. GET: Lấy danh sách Phiếu Nhập / Đề Xuất
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var ds = await _ctx.PhieuNhaps
                .Include(p => p.NhaCungCap)
                .Include(p => p.NhanVien)
                .OrderByDescending(p => p.NgayTao)
                .Select(p => new
                {
                    maPhieuNhap = p.MaPhieuNhap,
                    maPN = p.MaPN,
                    ngayNhap = p.NgayNhap,
                    ngayGiaoHang = p.NgayGiaoHang,
                    tongTien = p.TongTien,
                    trangThai = p.TrangThai,
                    ghiChu = p.GhiChu,
                    maNhaCungCap = p.MaNhaCungCap,
                    tenNhaCungCap = p.CTPNs.Select(c => c.MaNhaCungCap).Distinct().Count() > 1 
                        ? "Đa NCC" 
                        : (p.NhaCungCap != null ? p.NhaCungCap.TenNCC : "Chưa xác định"),
                    maNhanVien = p.MaNhanVien,
                    tenNhanVien = p.NhanVien.TenNV
                }).ToListAsync();
            return Ok(ds);
        }

        // GET Chi Tiết
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var p = await _ctx.PhieuNhaps
                .Include(x => x.NhaCungCap)
                .Include(x => x.NhanVien)
                .Include(x => x.CTPNs).ThenInclude(c => c.SanPham)
                .Include(x => x.CTPNs).ThenInclude(c => c.NhaCungCap)
                .FirstOrDefaultAsync(x => x.MaPhieuNhap == id);
            
            if (p == null) return NotFound();

            return Ok(new
            {
                 maPhieuNhap = p.MaPhieuNhap,
                 maPN = p.MaPN,
                 ngayNhap = p.NgayNhap,
                 ngayGiaoHang = p.NgayGiaoHang,
                 tongTien = p.TongTien,
                 trangThai = p.TrangThai,
                 ghiChu = p.GhiChu,
                 maNhaCungCap = p.MaNhaCungCap,
                 tenNhaCungCap = p.CTPNs.Select(c => c.MaNhaCungCap).Distinct().Count() > 1 
                    ? "Đa NCC" 
                    : (p.NhaCungCap != null ? p.NhaCungCap.TenNCC : "Chưa xác định"),
                 chiTiet = p.CTPNs.Select(c => {
                     return new {
                         maCTPN = c.MaCTPN,
                         maSanPham = c.MaSanPham,
                         tenSanPham = c.SanPham?.TenSP,
                         soLuong = c.SoLuong,
                         donGia = c.DonGia,
                         soLuongDaNhan = c.SoLuongDaNhan,
                         thanhTien = c.ThanhTien,
                         trangThai = c.TrangThai,
                         maNhaCungCap = c.MaNhaCungCap,
                         tenNhaCungCap = c.NhaCungCap?.TenNCC
                     };
                 }).ToList()
            });
        }

        [HttpPost("proposal")]
        public async Task<IActionResult> CreateProposal([FromBody] PhieuNhapDto dto)
        {
            if (dto.ChiTiet == null || !dto.ChiTiet.Any()) return BadRequest("Vui lòng chọn sản phẩm cần đề xuất.");

            using var transaction = await _ctx.Database.BeginTransactionAsync();
            try
            {
                // Thay vì tách ngay, tạo 1 phiếu duy nhất (NCC lấy theo mục đầu tiên)
                var firstItem = dto.ChiTiet.First();
                var phieu = new PhieuNhap
                {
                    NgayNhap = dto.NgayNhap ?? DateTime.UtcNow,
                    NgayGiaoHang = dto.NgayGiaoHang,
                    TrangThai = "Đề Xuất",
                    GhiChu = dto.GhiChu,
                    MaNhaCungCap = firstItem.MaNhaCungCap ?? 0,
                    MaNhanVien = dto.MaNhanVien,
                    NgayTao = DateTime.UtcNow,
                    NgayCapNhat = DateTime.UtcNow,
                    TongTien = 0,
                    ThanhToan = 0
                };

                _ctx.PhieuNhaps.Add(phieu);
                await _ctx.SaveChangesAsync();

                decimal tong = 0;
                foreach (var ct in dto.ChiTiet)
                {
                    var tt = ct.SoLuong * ct.DonGia;
                    tong += tt;
                    _ctx.CTPNs.Add(new CTPN
                    {
                        MaPhieuNhap = phieu.MaPhieuNhap,
                        MaSanPham = ct.MaSanPham,
                        SoLuong = ct.SoLuong,
                        DonGia = ct.DonGia,
                        ThanhTien = tt,
                        SoLuongDaNhan = 0,
                        MaKhoHang = ct.MaKhoHang, 
                        MaNhaCungCap = ct.MaNhaCungCap,
                        NgayTao = DateTime.UtcNow,
                        TrangThai = "Chờ Duyệt"
                    });
                }

                phieu.TongTien = tong;
                await _ctx.SaveChangesAsync();

                _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap
                {
                    MaPhieuNhap = phieu.MaPhieuNhap,
                    TrangThaiMoi = "Đề Xuất",
                    NoiDungThayDoi = $"Nhân viên {dto.MaNhanVien} tạo đề xuất mới với {dto.ChiTiet.Count} sản phẩm (Có thể đa nhà cung cấp).",
                    MaNguoiThucHien = dto.MaNhanVien
                });
                await _ctx.SaveChangesAsync();
                
                await transaction.CommitAsync();

                // Reload để lấy MaPN
                var p = await _ctx.PhieuNhaps.FindAsync(phieu.MaPhieuNhap);
                await _notificationService.SendNotificationAsync(
                    "Đề xuất nhập hàng mới",
                    $"Nhân viên kho vừa lập đề xuất nhập hàng mới {p?.MaPN ?? phieu.MaPhieuNhap.ToString()}. Vui lòng kiểm tra và duyệt.",
                    "DeXuat",
                    null, 
                    "/procurement"
                );
                return Ok(new { message = "Đã tạo phiếu đề xuất thành công.", maPhieuNhap = phieu.MaPhieuNhap, maPN = p?.MaPN });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi khi xử lý tạo đề xuất.", error = ex.Message });
            }
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProposal(int id, [FromBody] PhieuNhapDto dto)
        {
            using var transaction = await _ctx.Database.BeginTransactionAsync();
            try
            {
                var p = await _ctx.PhieuNhaps.Include(x => x.CTPNs).FirstOrDefaultAsync(x => x.MaPhieuNhap == id);
                if (p == null) return NotFound();

                // Cập nhật thông tin chung
                string trangThaiCu = p.TrangThai;
                p.GhiChu = dto.GhiChu;
                p.NgayCapNhat = DateTime.UtcNow;
                if (dto.NgayNhap.HasValue) p.NgayNhap = dto.NgayNhap.Value;
                if (dto.NgayGiaoHang.HasValue) p.NgayGiaoHang = dto.NgayGiaoHang.Value;

                if (!string.IsNullOrEmpty(dto.TargetStatus))
                {
                    p.TrangThai = dto.TargetStatus;
                }
                else if (p.TrangThai == "Yêu Cầu Sửa")
                {
                    p.TrangThai = "Chờ Duyệt";
                }

                // Xóa chi tiết cũ và thêm mới (hoặc cập nhật thông minh hơn)
                _ctx.CTPNs.RemoveRange(p.CTPNs);

                decimal tong = 0;
                foreach (var ct in dto.ChiTiet)
                {
                    var tt = ct.SoLuong * ct.DonGia;
                    tong += tt;
                    _ctx.CTPNs.Add(new CTPN
                    {
                        MaPhieuNhap = p.MaPhieuNhap,
                        MaSanPham = ct.MaSanPham,
                        SoLuong = ct.SoLuong,
                        DonGia = ct.DonGia,
                        ThanhTien = tt,
                        SoLuongDaNhan = 0,
                        MaKhoHang = ct.MaKhoHang ?? 1,
                        MaNhaCungCap = ct.MaNhaCungCap,
                        NgayTao = DateTime.UtcNow,
                        TrangThai = "Chờ Duyệt"
                    });
                }

                p.TongTien = tong;

                _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap
                {
                    MaPhieuNhap = p.MaPhieuNhap,
                    TrangThaiCu = trangThaiCu,
                    TrangThaiMoi = p.TrangThai,
                    NoiDungThayDoi = $"Người dùng {dto.MaNhanVien} cập nhật thông tin phiếu. (Đã gửi lại đề xuất)",
                    MaNguoiThucHien = dto.MaNhanVien
                });

                await _ctx.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Đã cập nhật phiếu đề xuất thành công." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi khi cập nhật phiếu.", error = ex.Message });
            }
        }

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveProposal(int id, [FromBody] HistoryActionDto dto)
        {
            using var transaction = await _ctx.Database.BeginTransactionAsync();
            try
            {
                var p = await _ctx.PhieuNhaps.Include(x => x.CTPNs).FirstOrDefaultAsync(x => x.MaPhieuNhap == id);
                if (p == null) return NotFound();
                if (p.TrangThai != "Đề Xuất" && p.TrangThai != "Đề Xuất (Nhập Bù)" && p.TrangThai != "Đang xử lý" && p.TrangThai != "Chờ Duyệt") 
                    return BadRequest("Phiếu này không ở trạng thái chờ duyệt (hoặc Đề xuất).");

                // Nhóm chi tiết theo Nhà cung cấp thực tế của sản phẩm
                // Note: MaNhaCungCap trong CTPN (dto) không lưu vào DB, nhưng ta có thể lấy từ bảng NHACUNGCAP_SANPHAM 
                // hoặc đơn giản là Nhân viên kho đã chọn NCC cho từng item trong lúc lập phiếu (CTPN.MaNhaCungCap không có trong Model CTPN gốc?)
                // Kiểm tra lại Model CTPN: không có MaNhaCungCap. 
                // Vậy ta sẽ lấy NCC mặc định của sản phẩm hoặc NCC rẻ nhất đã được chọn.
                // TUY NHIÊN, yêu cầu là "Duyệt mới tự động tách phiếu". 
                // Ta cần biết mỗi mặt hàng thuộc NCC nào.
                
                // Giải pháp: Dùng bảng NHACUNGCAP_SANPHAM để xác định NCC của từng mặt hàng trong phiếu.
                // Hoặc giả định Frontend gửi kèm NCC trong lúc tạo (nhưng DB CTPN không lưu).
                // Để đơn giản và chính xác nhất theo luồng hiện tại: 
                // Ta sẽ lấy danh sách các NCC cung cấp các SP trong phiếu này.
                
                var items = p.CTPNs.ToList();
                var productIds = items.Select(i => i.MaSanPham).ToList();
                
                // Lấy giá chào hàng để biết SP này thuộc về NCC nào (trong thực tế có thể 1 SP có nhiều NCC, 
                // nhưng ta lấy NCC có giá khớp với giá đề xuất)
                var supplierQuotes = await _ctx.NhaCungCapSanPhams
                    .Where(x => productIds.Contains(x.MaSanPham))
                    .ToListAsync();

                var itemsWithSupplier = items.GroupBy(x => x.MaNhaCungCap ?? p.MaNhaCungCap).ToList();

                string oldStatus = p.TrangThai;
                int splitCount = 0;
                List<int> approvedPhieuIds = new List<int>();

                foreach (var group in itemsWithSupplier)
                {
                    var maNCC = group.Key;
                    PhieuNhap currentPhieu;

                    if (maNCC == p.MaNhaCungCap)
                    {
                        currentPhieu = p;
                    }
                    else
                    {
                        // Tạo phiếu mới cho NCC khác
                        currentPhieu = new PhieuNhap
                        {
                            NgayNhap = p.NgayNhap,
                            TrangThai = "Đã Duyệt",
                            GhiChu = p.GhiChu + $" (Tách từ {p.MaPN})",
                            MaNhaCungCap = maNCC,
                            MaNhanVien = p.MaNhanVien,
                            NgayTao = DateTime.UtcNow,
                            NgayCapNhat = DateTime.UtcNow,
                            TongTien = group.Sum(x => x.ThanhTien ?? 0),
                            ThanhToan = 0
                        };
                        _ctx.PhieuNhaps.Add(currentPhieu);
                        await _ctx.SaveChangesAsync();
                        splitCount++;

                        foreach (var item in group)
                        {
                            item.MaPhieuNhap = currentPhieu.MaPhieuNhap;
                        }
                    }

                    currentPhieu.TrangThai = "Đã Duyệt";
                    currentPhieu.NgayCapNhat = DateTime.UtcNow;
                    approvedPhieuIds.Add(currentPhieu.MaPhieuNhap);

                    _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap {
                        MaPhieuNhap = currentPhieu.MaPhieuNhap,
                        TrangThaiCu = currentPhieu == p ? oldStatus : null,
                        TrangThaiMoi = "Đã Duyệt",
                        NoiDungThayDoi = currentPhieu == p ? "Quản lý đã phê duyệt toàn bộ đơn đề xuất." : $"Phiếu được tách tự động từ {p.MaPN} khi quản lý duyệt.",
                        MaNguoiThucHien = dto.UserId
                    });
                }

                // Cập nhật lại tổng tiền phiếu gốc (nếu bị bớt item)
                p.TongTien = p.CTPNs.Sum(c => c.ThanhTien ?? 0);

                await _ctx.SaveChangesAsync();
                await transaction.CommitAsync();

                // Notify warehouse staff
                await _notificationService.SendNotificationAsync(
                    "Đề xuất đã được duyệt",
                    $"Đề xuất nhập hàng {p.MaPN} của bạn đã được quản lý phê duyệt {(splitCount > 0 ? $"và tách thành {splitCount + 1} đơn hàng" : "")}.",
                    "HeThong",
                    p.MaNhanVien.ToString(),
                    link: "/procurement"
                );

                // Auto send emails to suppliers
                foreach (var phieuId in approvedPhieuIds)
                {
                    await SendEmailToSupplierInternal(phieuId, dto.UserId);
                }

                return Ok(new { message = splitCount > 0 ? $"Đã phê duyệt và tách thành {splitCount + 1} phiếu nhập hàng!" : "Đã phê duyệt đề xuất nhập hàng!" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi khi xử lý duyệt và tách phiếu.", error = ex.Message });
            }
        }

        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectProposal(int id, [FromBody] RejectDto dto)
        {
            var p = await _ctx.PhieuNhaps.FindAsync(id);
            if (p == null) return NotFound();
            
            string oldStatus = p.TrangThai;
            p.TrangThai = "Từ Chối";
            p.GhiChu = string.IsNullOrEmpty(p.GhiChu) ? dto.LyDo : p.GhiChu + " | Từ chối: " + dto.LyDo;
            p.NgayCapNhat = DateTime.UtcNow;

            _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap {
                MaPhieuNhap = id,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = "Từ Chối",
                NoiDungThayDoi = "Lý do từ chối: " + dto.LyDo,
                MaNguoiThucHien = dto.UserId
            });

            await _ctx.SaveChangesAsync();

            // Notify warehouse staff
            await _notificationService.SendNotificationAsync(
                "Đề xuất bị từ chối",
                $"Đề xuất nhập hàng {p.MaPN} đã bị từ chối. Lý do: {dto.LyDo}",
                "HeThong",
                p.MaNhanVien.ToString(),
                link: "/procurement"
            );

            return Ok(new { message = "Đã từ chối phiếu đề xuất!" });
        }

        // 4. PUT: Hoàn tất quá trình nhập kho & Tăng tồn kho & Cập nhật giá NCC
        [HttpPut("{id}/receive")]
        public async Task<IActionResult> ReceiveItems(int id, [FromBody] List<ReceiveItemDto> items)
        {
            var p = await _ctx.PhieuNhaps.Include(x => x.CTPNs).FirstOrDefaultAsync(x => x.MaPhieuNhap == id);
            if (p == null) return NotFound();
            if (p.TrangThai == "Hoàn Thành") return BadRequest("Phiếu này đã được nhập vào kho trước đó.");
            if (p.TrangThai == "Đề Xuất" || p.TrangThai == "Đề Xuất (Nhập Bù)" || p.TrangThai == "Từ Chối") 
                return BadRequest("Phiếu phải được Duyệt mới được phép Nhận hàng.");

            bool tatCaDuSoLuong = true;

            foreach(var item in items)
            {
                var ct = p.CTPNs.FirstOrDefault(c => c.MaCTPN == item.MaCTPN);
                if (ct != null)
                {
                    ct.SoLuongDaNhan = item.SoLuongDaNhan;
                    // Chọn kho thực tế (ưu tiên kho được chọn trong chi tiết phiếu, nếu không có thì mặc định kho 1)
                    int maKhoTarget = ct.MaKhoHang ?? 1;

                    var kho = await _ctx.CTKhoHangs.FirstOrDefaultAsync(k => k.MaSanPham == ct.MaSanPham && k.MaKhoHang == maKhoTarget);
                    if (kho != null)
                    {
                        kho.SoLuong += ct.SoLuongDaNhan;
                        kho.SoLuongTon += ct.SoLuongDaNhan;
                        kho.SoLuongNhap += ct.SoLuongDaNhan;
                        kho.NgayNhapCuoi = DateTime.UtcNow;
                    }
                    else
                    {
                        _ctx.CTKhoHangs.Add(new CTKhoHang {
                            MaKhoHang = maKhoTarget,
                            MaSanPham = ct.MaSanPham,
                            SoLuong = ct.SoLuongDaNhan,
                            SoLuongTon = ct.SoLuongDaNhan,
                            SoLuongNhap = ct.SoLuongDaNhan,
                            NgayNhapCuoi = DateTime.UtcNow,
                            NgayCapNhat = DateTime.UtcNow
                        });
                    }

                    // Tự động cập nhật bảng giá chào hàng cho NCC này
                    var nccSP = await _ctx.NhaCungCapSanPhams.FirstOrDefaultAsync(x => x.MaNCC == p.MaNhaCungCap && x.MaSanPham == ct.MaSanPham);
                    if (nccSP != null)
                    {
                        nccSP.GiaCungCap = ct.DonGia;
                        nccSP.NgayCapNhat = DateTime.UtcNow;
                    }
                    else
                    {
                        _ctx.NhaCungCapSanPhams.Add(new NhaCungCapSanPham
                        {
                            MaNCC = p.MaNhaCungCap,
                            MaSanPham = ct.MaSanPham,
                            GiaCungCap = ct.DonGia,
                            NgayCapNhat = DateTime.UtcNow
                        });
                    }

                    if (ct.SoLuongDaNhan < ct.SoLuong) tatCaDuSoLuong = false;
                }
            }

            p.NgayGiaoHang = DateTime.UtcNow;
            string oldStatus = p.TrangThai;
            if (tatCaDuSoLuong) p.TrangThai = "Hoàn Thành";
            else p.TrangThai = "Nhập Thiếu (Cần Đổi Trả)"; 

            p.NgayCapNhat = DateTime.UtcNow;

            _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap {
                MaPhieuNhap = id,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = p.TrangThai,
                NoiDungThayDoi = $"Nhân viên kho xác nhận nhập {items.Count} mặt hàng vào kho.",
                MaNguoiThucHien = items.FirstOrDefault()?.UserId // Using first item's performer if available
            });

            await _ctx.SaveChangesAsync();

            // TỰ ĐỘNG TẠO CÔNG NỢ PHẢI TRẢ NCC VÀ THANH TOÁN
            var existingCN = await _ctx.CongNos.FirstOrDefaultAsync(x => x.MaPhieuNhap == id);
            if (existingCN == null && p.TongTien > 0)
            {
                p.ThanhToan = p.TongTien; // Tự động cập nhật đã thanh toán vào phiếu nhập

                var cn = new CongNo
                {
                    MaNhaCungCap = p.MaNhaCungCap,
                    MaPhieuNhap = p.MaPhieuNhap,
                    SoTienNo = p.TongTien ?? 0,
                    SoTienDaTra = p.TongTien ?? 0,
                    SoTienConLai = 0,
                    LoaiCongNo = "Phải trả",
                    TrangThai = "Đã thanh toán",
                    NgayTao = DateTime.UtcNow,
                    NgayCapNhat = DateTime.UtcNow,
                    GhiChu = $"Tự động tạo và thanh toán từ phiếu nhập {p.MaPN}"
                };
                _ctx.CongNos.Add(cn);
                await _ctx.SaveChangesAsync();

                // Ghi nhận lịch sử giao dịch thanh toán tiền
                _ctx.ChiTietTraNos.Add(new ChiTietTraNo {
                    MaCongNo = cn.MaCongNo,
                    SoTien = p.TongTien ?? 0,
                    PTTT = "Chuyển khoản/Tiền mặt",
                    GhiChu = "Hệ thống tự động thanh toán ngay khi hoàn thành nhập kho",
                    MaNhanVien = items.FirstOrDefault()?.UserId ?? 1,
                    NgayTT = DateTime.Now,
                    TrangThai = "Thành công",
                    NgayTao = DateTime.UtcNow
                });
                await _ctx.SaveChangesAsync();
            }

            return Ok(new { message = "Nghiệm thu nhập kho và cập nhật bảng giá NCC thành công!", trangThai = p.TrangThai });
        }

        // 5. GET: So sánh giá (Lịch sử + Giá chào hàng của TẤT CẢ NCC)
        [HttpGet("price-compare/{productId}")]
        public async Task<IActionResult> GetPriceComparison(int productId)
        {
            // Lấy giá chào hàng hiện tại của tất cả NCC cho SP này
            var currentQuotes = await _ctx.NhaCungCapSanPhams
                .Include(x => x.NhaCungCap)
                .Where(x => x.MaSanPham == productId)
                .Select(x => new {
                    maNCC = x.NhaCungCap.MaNhaCungCap,
                    tenNCC = x.NhaCungCap.TenNCC,
                    giaHienTai = x.GiaCungCap,
                        ngayCapNhat = x.NgayCapNhat,
                    loai = "Giá chào hàng"
                }).ToListAsync();

            // Lấy thêm lịch sử nhập hàng thực tế
            var history = await _ctx.CTPNs
                .Include(c => c.PhieuNhap).ThenInclude(p => p.NhaCungCap)
                .Where(c => c.MaSanPham == productId && c.PhieuNhap.TrangThai == "Hoàn Thành")
                .OrderByDescending(c => c.PhieuNhap.NgayNhap)
                .Take(5)
                .Select(c => new
                {
                    maNCC = c.PhieuNhap.MaNhaCungCap,
                    tenNCC = c.PhieuNhap.NhaCungCap.TenNCC,
                    giaHienTai = c.DonGia,
                    ngayCapNhat = c.PhieuNhap.NgayNhap,
                    loai = "Lịch sử nhập"
                })
                .ToListAsync();

            return Ok(currentQuotes.Concat(history).OrderByDescending(x => x.ngayCapNhat));
        }

        [HttpPut("{id}/approve-items")]
        public async Task<IActionResult> ApproveSelectedItems(int id, [FromBody] ApproveItemsDto dto)
        {
            using var transaction = await _ctx.Database.BeginTransactionAsync();
            try
            {
                var p = await _ctx.PhieuNhaps.Include(x => x.CTPNs).FirstOrDefaultAsync(x => x.MaPhieuNhap == id);
                if (p == null) return NotFound();

                var approvedItems = p.CTPNs.Where(c => dto.MacTPNDuyet.Contains(c.MaCTPN)).ToList();
                var revisionItems = p.CTPNs.Where(c => dto.MacTPNSua.Contains(c.MaCTPN)).ToList();
                var rejectedItems = p.CTPNs.Where(c => dto.MacTPNTuChoi.Contains(c.MaCTPN)).ToList();

                // Cập nhật thông tin chi tiết (Số lượng, Đơn giá, NCC) nếu có gửi kèm
                if (dto.ChiTietUpdate != null && dto.ChiTietUpdate.Any())
                {
                    foreach (var upd in dto.ChiTietUpdate)
                    {
                        var item = p.CTPNs.FirstOrDefault(x => x.MaCTPN == upd.MaCTPN);
                        if (item == null && upd.MaCTPN == 0) // Fallback cho trường hợp cũ hoặc mapping theo SanPham
                             item = p.CTPNs.FirstOrDefault(x => x.MaSanPham == upd.MaSanPham);

                        if (item != null)
                        {
                            item.SoLuong = upd.SoLuong;
                            item.DonGia = upd.DonGia;
                            item.ThanhTien = upd.SoLuong * upd.DonGia;
                            item.MaNhaCungCap = (upd.MaNhaCungCap > 0) ? upd.MaNhaCungCap : item.MaNhaCungCap;
                            item.MaKhoHang = upd.MaKhoHang ?? item.MaKhoHang;
                        }
                    }
                }

                if (approvedItems.Any())
                {
                    // Tách các mục được duyệt theo NCC
                    var productIds = approvedItems.Select(i => i.MaSanPham).ToList();
                    var supplierQuotes = await _ctx.NhaCungCapSanPhams
                        .Where(x => productIds.Contains(x.MaSanPham))
                        .ToListAsync();

                    var approvedWithSupplier = approvedItems.Select(item => {
                        var quote = supplierQuotes.FirstOrDefault(q => q.MaSanPham == item.MaSanPham && q.GiaCungCap == item.DonGia);
                        if (quote == null) quote = supplierQuotes.FirstOrDefault(q => q.MaSanPham == item.MaSanPham);
                        return new { Item = item, MaNCC = quote?.MaNCC ?? item.MaNhaCungCap ?? p.MaNhaCungCap };
                    }).GroupBy(x => x.MaNCC).ToList();

                    foreach (var group in approvedWithSupplier)
                    {
                        var maNCC = group.Key;
                        // Tạo phiếu mới cho mỗi nhóm NCC đã duyệt
                        var newApprovedPhieu = new PhieuNhap
                        {
                            NgayNhap = p.NgayNhap,
                            TrangThai = "Đã Duyệt",
                            GhiChu = p.GhiChu + $" (Duyệt một phần từ {p.MaPN})",
                            MaNhaCungCap = maNCC,
                            MaNhanVien = p.MaNhanVien,
                            NgayTao = DateTime.UtcNow,
                            NgayCapNhat = DateTime.UtcNow,
                            TongTien = group.Sum(x => x.Item.ThanhTien ?? 0),
                            ThanhToan = 0
                        };
                        _ctx.PhieuNhaps.Add(newApprovedPhieu);
                        await _ctx.SaveChangesAsync();

                        foreach (var x in group)
                        {
                            x.Item.MaPhieuNhap = newApprovedPhieu.MaPhieuNhap;
                            x.Item.TrangThai = "Đã Duyệt";
                        }

                        _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap {
                            MaPhieuNhap = newApprovedPhieu.MaPhieuNhap,
                            TrangThaiMoi = "Đã Duyệt",
                            NoiDungThayDoi = $"Phiếu được duyệt một phần và tách từ {p.MaPN}.",
                            MaNguoiThucHien = dto.UserId
                        });
                    }
                }

                if (rejectedItems.Any())
                {
                    foreach (var item in rejectedItems)
                    {
                        item.TrangThai = "Từ Chối";
                    }
                    _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap
                    {
                        MaPhieuNhap = id,
                        TrangThaiMoi = "Một phần từ chối",
                        NoiDungThayDoi = $"Quản lý từ chối {rejectedItems.Count} sản phẩm.",
                        MaNguoiThucHien = dto.UserId
                    });
                }

                if (revisionItems.Any())
                {
                    p.TrangThai = "Yêu Cầu Sửa";
                    p.GhiChu = dto.GhiChuChung;
                    p.NgayCapNhat = DateTime.UtcNow;

                    foreach (var item in revisionItems) item.TrangThai = "Yêu Cầu Sửa";

                    _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap
                    {
                        MaPhieuNhap = id,
                        TrangThaiMoi = "Yêu Cầu Sửa",
                        NoiDungThayDoi = $"Quản lý yêu cầu sửa một số mục: {dto.LyDoSua ?? dto.GhiChuChung}",
                        MaNguoiThucHien = dto.UserId
                    });
                }
                else if (rejectedItems.Any() && !p.CTPNs.Any(c => c.TrangThai != "Từ Chối"))
                {
                    // Nếu không có mục yêu cầu sửa, và tất cả các mục còn lại đều bị từ chối
                    p.TrangThai = "Từ Chối";
                    p.NgayCapNhat = DateTime.UtcNow;
                }

                // Cập nhật lại tổng tiền cho phiếu cũ (chỉ còn các item chưa được duyệt/tách, loại bỏ hàng bị từ chối)
                p.TongTien = p.CTPNs.Where(c => c.TrangThai != "Từ Chối").Sum(c => c.ThanhTien ?? 0);

                if (!p.CTPNs.Any())
                {
                    p.TrangThai = "Đã Duyệt (Đã tách hết)";
                }

                await _ctx.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Đã xử lý duyệt và tách phiếu theo yêu cầu!" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi xử lý duyệt một phần.", error = ex.Message });
            }
        }

        // 5. Xuất Excel Đơn Nhập Hàng
        [HttpGet("{id}/export/excel")]
        public async Task<IActionResult> ExportExcel(int id)
        {
            var p = await _ctx.PhieuNhaps
                .Include(x => x.NhaCungCap)
                .Include(x => x.CTPNs).ThenInclude(c => c.SanPham)
                .FirstOrDefaultAsync(x => x.MaPhieuNhap == id);
            
            if (p == null) return NotFound();

            using var package = new ExcelPackage();
            var ws = package.Workbook.Worksheets.Add(p.MaPN);

            // Style Header
            ws.Cells["A1:E1"].Merge = true;
            ws.Cells["A1"].Value = "ĐƠN ĐẶT HÀNG / ĐỀ XUẤT NHẬP HÀNG";
            ws.Cells["A1"].Style.Font.Bold = true;
            ws.Cells["A1"].Style.Font.Size = 16;
            ws.Cells["A1"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            ws.Cells["A2"].Value = "Mã phiếu:"; ws.Cells["B2"].Value = p.MaPN;
            ws.Cells["A3"].Value = "Ngày tạo:"; ws.Cells["B3"].Value = p.NgayTao.ToString("dd/MM/yyyy HH:mm");
            ws.Cells["A4"].Value = "Nhà cung cấp:"; ws.Cells["B4"].Value = p.NhaCungCap?.TenNCC;
            ws.Cells["A5"].Value = "Địa chỉ NCC:"; ws.Cells["B5"].Value = p.NhaCungCap?.DiaChi;
            ws.Cells["A6"].Value = "Trạng thái:"; ws.Cells["B6"].Value = p.TrangThai;

            // Table Header
            ws.Cells["A8"].Value = "STT";
            ws.Cells["B8"].Value = "Sản phẩm";
            ws.Cells["C8"].Value = "Số lượng";
            ws.Cells["D8"].Value = "Đơn giá";
            ws.Cells["E8"].Value = "Thành tiền";
            ws.Cells["A8:E8"].Style.Font.Bold = true;
            ws.Cells["A8:E8"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            ws.Cells["A8:E8"].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);

            int row = 9;
            int stt = 1;
            foreach (var item in p.CTPNs)
            {
                ws.Cells[row, 1].Value = stt++;
                ws.Cells[row, 2].Value = item.SanPham?.TenSP;
                ws.Cells[row, 3].Value = item.SoLuong;
                ws.Cells[row, 4].Value = item.DonGia;
                ws.Cells[row, 5].Formula = $"C{row}*D{row}";
                row++;
            }

            ws.Cells[row, 4].Value = "Tổng cộng:";
            ws.Cells[row, 5].Value = p.TongTien;
            ws.Cells[row, 4, row, 5].Style.Font.Bold = true;

            ws.Cells.AutoFitColumns();
            var fileBytes = await package.GetAsByteArrayAsync();
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"DonNhapHang_{p.MaPN}.xlsx");
        }

        // 6. Xuất PDF Đơn Nhập Hàng
        [HttpGet("{id}/export/pdf")]
        public async Task<IActionResult> ExportPdf(int id)
        {
            var p = await _ctx.PhieuNhaps
                .Include(x => x.NhaCungCap)
                .Include(x => x.NhanVien)
                .Include(x => x.CTPNs).ThenInclude(c => c.SanPham)
                .FirstOrDefaultAsync(x => x.MaPhieuNhap == id);

            if (p == null) return NotFound();

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1, Unit.Centimetre);
                    page.PageColor(QuestPDF.Helpers.Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12).FontFamily(Fonts.Arial));

                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("CỬA HÀNG VẬT LIỆU XÂY DỰNG").FontSize(16).SemiBold().FontColor(QuestPDF.Helpers.Colors.Blue.Medium);
                            col.Item().Text("Địa chỉ: 123 Đường Chính, TP. Hồ Chí Minh");
                            col.Item().Text("SĐT: 0123 456 789");
                        });

                        row.RelativeItem().AlignRight().Column(col =>
                        {
                            col.Item().Text("PHIẾU NHẬP HÀNG").FontSize(20).ExtraBold().FontColor(QuestPDF.Helpers.Colors.Grey.Darken3);
                            col.Item().Text($"Số phiếu: {p.MaPN}").Bold();
                            col.Item().Text($"Ngày: {p.NgayTao:dd/MM/yyyy}");
                        });
                    });

                    page.Content().PaddingVertical(20).Column(col =>
                    {
                        col.Item().Row(r => {
                            r.RelativeItem().Column(c => {
                                c.Item().Text("NHÀ CUNG CẤP").Bold();
                                c.Item().Text(p.NhaCungCap?.TenNCC ?? "N/A");
                                c.Item().Text(p.NhaCungCap?.DiaChi ?? "N/A");
                                c.Item().Text($"SĐT: {p.NhaCungCap?.Sdt}");
                            });
                            r.RelativeItem().AlignRight().Column(c => {
                                c.Item().Text("TRẠNG THÁI").Bold();
                                c.Item().Text(p.TrangThai).FontColor(p.TrangThai == "Hoàn Thành" ? QuestPDF.Helpers.Colors.Green.Medium : QuestPDF.Helpers.Colors.Orange.Medium);
                                c.Item().Text($"NV tạo: {p.NhanVien?.TenNV}");
                            });
                        });

                        col.Item().PaddingTop(15).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(40);
                                columns.RelativeColumn();
                                columns.ConstantColumn(80);
                                columns.ConstantColumn(100);
                                columns.ConstantColumn(100);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Element(HeaderStyle).Text("STT");
                                header.Cell().Element(HeaderStyle).Text("Sản phẩm");
                                header.Cell().Element(HeaderStyle).AlignRight().Text("Số lượng");
                                header.Cell().Element(HeaderStyle).AlignRight().Text("Đơn giá");
                                header.Cell().Element(HeaderStyle).AlignRight().Text("Thành tiền");

                                static IContainer HeaderStyle(IContainer container) => container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Black);
                            });

                            int i = 1;
                            foreach (var item in p.CTPNs)
                            {
                                table.Cell().Element(CellStyle).Text(i++.ToString());
                                table.Cell().Element(CellStyle).Text(item.SanPham?.TenSP ?? "N/A");
                                table.Cell().Element(CellStyle).AlignRight().Text(item.SoLuong.ToString());
                                table.Cell().Element(CellStyle).AlignRight().Text(string.Format("{0:N0} đ", item.DonGia));
                                table.Cell().Element(CellStyle).AlignRight().Text(string.Format("{0:N0} đ", item.ThanhTien));

                                static IContainer CellStyle(IContainer container) => container.PaddingVertical(5).BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2);
                            }
                        });

                        col.Item().AlignRight().PaddingTop(10).Text(x =>
                        {
                            x.Span("TỔNG CỘNG: ").FontSize(14).Bold();
                            x.Span(string.Format("{0:N0} VNĐ", p.TongTien)).FontSize(14).Bold().FontColor(QuestPDF.Helpers.Colors.Red.Medium);
                        });

                        if (!string.IsNullOrEmpty(p.GhiChu))
                        {
                            col.Item().PaddingTop(20).Column(c => {
                                c.Item().Text("Ghi chú:").Italic();
                                c.Item().Text(p.GhiChu).FontSize(10);
                            });
                        }
                    });

                    page.Footer().AlignRight().Text(x =>
                    {
                        x.Span("Trang ");
                        x.CurrentPageNumber();
                    });
                });
            });

            var stream = new MemoryStream();
            pdf.GeneratePdf(stream);
            stream.Position = 0;
            return File(stream, "application/pdf", $"DonNhapHang_{p.MaPN}.pdf");
        }

        // 7. Gửi Email Đơn Nhập Hàng cho Nhà Cung Cấp
        [HttpPost("{id}/send-email")]
        public async Task<IActionResult> SendEmail(int id)
        {
            var success = await SendEmailToSupplierInternal(id);
            if (success) return Ok(new { message = "Đã gửi đơn hàng qua Email thành công!" });
            return BadRequest("Lỗi khi gửi Email hoặc NCC không có địa chỉ Email.");
        }

        private async Task<bool> SendEmailToSupplierInternal(int id, int? maNhanVienThucHien = null)
        {
            var p = await _ctx.PhieuNhaps
                .Include(x => x.NhaCungCap)
                .Include(x => x.NhanVien)
                .Include(x => x.CTPNs).ThenInclude(c => c.SanPham)
                .FirstOrDefaultAsync(x => x.MaPhieuNhap == id);

            if (p == null || string.IsNullOrEmpty(p.NhaCungCap?.Email)) return false;

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1, Unit.Centimetre);
                    page.PageColor(QuestPDF.Helpers.Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12).FontFamily(Fonts.Arial));

                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("CỬA HÀNG VẬT LIỆU XÂY DỰNG").FontSize(16).SemiBold().FontColor(QuestPDF.Helpers.Colors.Blue.Medium);
                        });
                        row.RelativeItem().AlignRight().Column(col =>
                        {
                            col.Item().Text("ĐƠN ĐẶT HÀNG").FontSize(20).ExtraBold();
                            col.Item().Text($"Mã phiếu: {p.MaPN}");
                        });
                    });

                    page.Content().PaddingVertical(20).Column(col =>
                    {
                        col.Item().Text($"Kính gửi: {p.NhaCungCap?.TenNCC}");
                        col.Item().Text($"Địa chỉ: {p.NhaCungCap?.DiaChi}");

                        col.Item().PaddingTop(15).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(40);
                                columns.RelativeColumn();
                                columns.ConstantColumn(80);
                                columns.ConstantColumn(100);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("STT");
                                header.Cell().Text("Sản phẩm");
                                header.Cell().AlignRight().Text("Số lượng");
                                header.Cell().AlignRight().Text("Thành tiền");
                            });

                            int i = 1;
                            foreach (var item in p.CTPNs)
                            {
                                table.Cell().Text(i++.ToString());
                                table.Cell().Text(item.SanPham?.TenSP ?? "");
                                table.Cell().AlignRight().Text(item.SoLuong.ToString());
                                table.Cell().AlignRight().Text(string.Format("{0:N0} đ", item.ThanhTien));
                            }
                        });

                        col.Item().AlignRight().PaddingTop(10).Text(x =>
                        {
                            x.Span("TỔNG CỘNG: ").Bold();
                            x.Span(string.Format("{0:N0} VNĐ", p.TongTien)).Bold().FontColor(QuestPDF.Helpers.Colors.Red.Medium);
                        });
                    });
                });
            });

            var stream = new MemoryStream();
            pdf.GeneratePdf(stream);
            var fileBytes = stream.ToArray();

            string subject = $"[Đơn Đặt Hàng] {p.MaPN} - Cửa Hàng Vật Liệu Xây Dựng";
            string body = $@"
                <div style='font-family: Arial, sans-serif;'>
                    <h3>Chào {p.NhaCungCap.TenNCC},</h3>
                    <p>Cửa hàng Vật Liệu Xây Dựng xin gửi đơn đặt hàng số <b>{p.MaPN}</b> lập ngày {p.NgayTao:dd/MM/yyyy}.</p>
                    <p>Vui lòng xem chi tiết danh sách mặt hàng và giá cả trong tệp PDF đính kèm.</p>
                    <p>Mọi thắc mắc vui lòng liên hệ trực tiếp với chúng tôi.</p>
                    <br/>
                    <p>Trân trọng,</p>
                    <p><b>{p.NhanVien?.TenNV}</b></p>
                    <p><i>Cửa Hàng Vật Liệu Xây Dựng</i></p>
                </div>
            ";

            try {
                await _email.SendEmailAsync(p.NhaCungCap.Email, subject, body, fileBytes, $"DonHang_{p.MaPN}.pdf");
                
                _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap {
                    MaPhieuNhap = id,
                    TrangThaiMoi = p.TrangThai,
                    NoiDungThayDoi = $"Đã gửi đơn hàng qua Email cho NCC {p.NhaCungCap.TenNCC}.",
                    MaNguoiThucHien = maNhanVienThucHien ?? p.MaNhanVien
                });
                await _ctx.SaveChangesAsync();
                return true;
            } catch {
                return false;
            }
        }

        // 8. GET: Lấy lịch sử trạng thái của phiếu
        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetHistory(int id)
        {
            var history = await _ctx.LichSuPhieuNhaps
                .Include(h => h.NhanVienThucHien)
                .Where(h => h.MaPhieuNhap == id)
                .OrderByDescending(h => h.NgayThayDoi)
                .Select(h => new {
                    maLichSu = h.MaLichSu,
                    trangThaiCu = h.TrangThaiCu,
                    trangThaiMoi = h.TrangThaiMoi,
                    noiDungThayDoi = h.NoiDungThayDoi,
                    ngayThayDoi = h.NgayThayDoi,
                    tenNguoiThucHien = h.NhanVienThucHien != null ? h.NhanVienThucHien.TenNV : "Hệ thống"
                })
                .ToListAsync();

            return Ok(history);
        }

        // 9. PUT: Nhân viên sửa và gửi lại đề xuất (Sau khi bị yêu cầu sửa)
        [HttpPut("{id}/resubmit")]
        public async Task<IActionResult> ResubmitProposal(int id, [FromBody] PhieuNhapDto dto)
        {
            var p = await _ctx.PhieuNhaps.Include(x => x.CTPNs).FirstOrDefaultAsync(x => x.MaPhieuNhap == id);
            if (p == null) return NotFound();
            if (p.TrangThai != "Yêu Cầu Sửa") return BadRequest("Phiếu này không ở trạng thái cần sửa.");

            string oldStatus = p.TrangThai;
            p.TrangThai = "Đề Xuất";
            p.GhiChu = dto.GhiChu;
            p.MaNhaCungCap = dto.MaNhaCungCap;
            p.NgayCapNhat = DateTime.UtcNow;
            if (dto.NgayGiaoHang.HasValue) p.NgayGiaoHang = dto.NgayGiaoHang.Value;

            // Xóa chi tiết cũ và thêm lại
            _ctx.CTPNs.RemoveRange(p.CTPNs);
            
            decimal tong = 0;
            foreach (var ct in dto.ChiTiet)
            {
                var tt = ct.SoLuong * ct.DonGia;
                tong += tt;
                _ctx.CTPNs.Add(new CTPN
                {
                    MaPhieuNhap = p.MaPhieuNhap,
                    MaSanPham = ct.MaSanPham,
                    SoLuong = ct.SoLuong,
                    DonGia = ct.DonGia,
                    ThanhTien = tt,
                    SoLuongDaNhan = 0,
                    MaKhoHang = ct.MaKhoHang,
                    NgayTao = DateTime.UtcNow,
                    TrangThai = "Chờ Duyệt"
                });
            }
            p.TongTien = tong;

            _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap
            {
                MaPhieuNhap = id,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = "Đề Xuất",
                NoiDungThayDoi = $"Nhân viên {dto.MaNhanVien} đã chỉnh sửa và gửi lại đề xuất.",
                MaNguoiThucHien = dto.MaNhanVien
            });

            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Đã gửi lại đề xuất để duyệt!" });
        }
    }

    public class PhieuNhapDto
    {
        public DateTime? NgayNhap { get; set; }
        public DateTime? NgayGiaoHang { get; set; }
        public string? GhiChu { get; set; }
        public string? TargetStatus { get; set; }
        public int MaNhaCungCap { get; set; }
        public int MaNhanVien { get; set; }
        public decimal? ThanhToan { get; set; }
        public List<CTPNDto> ChiTiet { get; set; }
    }

    public class CTPNDto
    {
        public int MaCTPN { get; set; } // Dùng để xác định chính xác dòng cần sửa
        public int MaSanPham { get; set; }
        public int SoLuong { get; set; }
        public decimal DonGia { get; set; }
        public int? MaNhaCungCap { get; set; }
        public int? MaKhoHang { get; set; }
    }

    public class HistoryActionDto { public int UserId { get; set; } }

    public class RejectDto 
    { 
        public string LyDo { get; set; } 
        public int UserId { get; set; }
    }
    public class ReceiveItemDto 
    { 
        public int MaCTPN { get; set; }  
        public int SoLuongDaNhan { get; set; } 
        public int? MaKhoHang { get; set; }
        public int UserId { get; set; }
    }
    public class ApproveItemsDto 
    { 
        public List<int> MacTPNDuyet { get; set; } = new(); 
        public List<int> MacTPNSua { get; set; } = new(); 
        public List<int> MacTPNTuChoi { get; set; } = new(); 
        public List<CTPNDto>? ChiTietUpdate { get; set; } // Cho phép cập nhật luôn lúc duyệt
        public string? GhiChuChung { get; set; }
        public string? LyDoSua { get; set; }
        public int UserId { get; set; }
    }
}
