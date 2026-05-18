using System;
using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using BuildingMaterialAPI.Services;
using BuildingMaterialAPI.Utilities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.IO;

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
                    tenNhanVien = p.NhanVien != null ? p.NhanVien.TenNV : "N/A"
                }).ToListAsync();
            return Ok(ds);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var p = await _ctx.PhieuNhaps
                .Include(x => x.NhaCungCap)
                .Include(x => x.NhanVien)
                .Include(x => x.CTPNs).ThenInclude(c => c.SanPham)
                .Include(x => x.CTPNs).ThenInclude(c => c.NhaCungCap)
                .Include(x => x.CTPNs).ThenInclude(c => c.KhoHang)
                .FirstOrDefaultAsync(x => x.MaPhieuNhap == id);
            
            if (p == null) return NotFound();

            // Lấy thêm các item từ các phiếu đã được tách ra từ phiếu này (đã duyệt)
            var splitItems = await _ctx.CTPNs
                .Include(c => c.SanPham)
                .Include(c => c.NhaCungCap)
                .Include(c => c.KhoHang)
                .Where(c => c.PhieuNhap.GhiChu != null && c.PhieuNhap.GhiChu.Contains($"[TáchTừPhiếu:{id}]"))
                .ToListAsync();

            var allItems = p.CTPNs.Concat(splitItems).ToList();

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
                 tenNhaCungCap = allItems.Select(c => c.MaNhaCungCap).Distinct().Count() > 1 
                    ? "Đa NCC" 
                    : (p.NhaCungCap != null ? p.NhaCungCap.TenNCC : "Chưa xác định"),
                 chiTiet = allItems.Select(c => {
                     return new {
                         maCTPN = c.MaCTPN,
                         maSanPham = c.MaSanPham,
                         tenSanPham = c.SanPham?.TenSP,
                         soLuong = c.SoLuong,
                         donGia = c.DonGia,
                         soLuongDaNhan = c.SoLuongDaNhan,
                         thanhTien = c.ThanhTien,
                         trangThai = c.TrangThai,
                         ghiChu = c.GhiChu,
                         maNhaCungCap = c.MaNhaCungCap,
                         tenNhaCungCap = c.NhaCungCap?.TenNCC,
                         maPhieuHienTai = c.MaPhieuNhap,
                         maKhoHang = c.MaKhoHang,
                         tenKhoHang = c.KhoHang?.TenKho ?? (c.MaKhoHang > 0 ? $"Kho #{c.MaKhoHang}" : "Chưa gán")
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
                        TrangThai = "Đề Xuất",
                        GhiChu = ct.GhiChu
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
                await _notificationService.SendToPermissionAsync(
                    "inventory",
                    "Đề xuất nhập hàng mới",
                    $"Nhân viên kho vừa lập đề xuất nhập hàng mới {p?.MaPN ?? phieu.MaPhieuNhap.ToString()}. Vui lòng kiểm tra và duyệt.",
                    "DeXuat",
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
                    p.TrangThai = "Đề Xuất";
                }

                // Xóa chi tiết cũ và thêm mới (hoặc cập nhật thông minh hơn)
                _ctx.CTPNs.RemoveRange(p.CTPNs);

                decimal tong = 0;
                foreach (var ct in dto.ChiTiet)
                {
                    var tt = ct.SoLuong * ct.DonGia;
                    tong += tt;
                    var nextTrangThai = (string.Equals(ct.TrangThai, "Từ Chối", StringComparison.OrdinalIgnoreCase)) ? "Từ Chối" : "Đề Xuất";
                    Console.WriteLine($"Item {ct.MaSanPham} TrangThai: '{ct.TrangThai}' -> Saving as: {nextTrangThai}");
                    
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
                        TrangThai = nextTrangThai,
                        GhiChu = ct.GhiChu
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
                if (p.TrangThai != "Đề Xuất" && p.TrangThai != "Đề Xuất (Nhập Bù)" && p.TrangThai != "Đang xử lý" && p.TrangThai != "Chờ Duyệt" && p.TrangThai != "Yêu Cầu Sửa") 
                    return BadRequest("Phiếu này không ở trạng thái cho phép duyệt.");

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
                // Phải lọc theo MaPhieuNhap == p.MaPhieuNhap vì item.MaPhieuNhap đã bị thay đổi trong bộ nhớ
                p.TongTien = p.CTPNs.Where(c => c.MaPhieuNhap == p.MaPhieuNhap).Sum(c => c.ThanhTien ?? 0);

                if (p.TongTien == 0 && !p.CTPNs.Any(c => c.MaPhieuNhap == p.MaPhieuNhap))
                {
                    // Nếu phiếu gốc không còn item nào (bị tách hết), đánh dấu là Đã Tách
                    p.TrangThai = "Đã Tách";
                }

                await _ctx.SaveChangesAsync();
                await transaction.CommitAsync();

                // Notify warehouse staff (requester)
                var requester = await _ctx.NhanViens.FindAsync(p.MaNhanVien);
                if (requester != null && requester.MaTaiKhoan.HasValue)
                {
                    await _notificationService.SendNotificationAsync(
                        "Đề xuất đã được duyệt",
                        $"Đề xuất nhập hàng {p.MaPN} của bạn đã được quản lý phê duyệt {(splitCount > 0 ? $"và tách thành {splitCount + 1} đơn hàng" : "")}.",
                        "HeThong",
                        requester.MaTaiKhoan.ToString(),
                        link: "/procurement"
                    );
                }

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

            // Notify warehouse staff (requester)
            var requesterReject = await _ctx.NhanViens.FindAsync(p.MaNhanVien);
            if (requesterReject != null && requesterReject.MaTaiKhoan.HasValue)
            {
                await _notificationService.SendNotificationAsync(
                    "Đề xuất bị từ chối",
                    $"Đề xuất nhập hàng {p.MaPN} đã bị từ chối. Lý do: {dto.LyDo}",
                    "HeThong",
                    requesterReject.MaTaiKhoan.ToString(),
                    link: "/procurement"
                );
            }

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
                    int oldQty = ct.SoLuongDaNhan;
                    int newQty = item.SoLuongDaNhan;
                    int delta = newQty - oldQty;

                    // Cập nhật CTPN
                    ct.SoLuongDaNhan = newQty;
                    
                    // Xác định kho (Ưu tiên kho từ DTO gửi lên, rồi mới tới kho trong CTPN, cuối cùng mặc định kho 1)
                    int maKhoTarget = item.MaKhoHang ?? ct.MaKhoHang ?? 1;
                    ct.MaKhoHang = maKhoTarget;

                    if (delta != 0)
                    {
                        var kho = await _ctx.CTKhoHangs.FirstOrDefaultAsync(k => k.MaSanPham == ct.MaSanPham && k.MaKhoHang == maKhoTarget)
                                  ?? _ctx.CTKhoHangs.Local.FirstOrDefault(k => k.MaSanPham == ct.MaSanPham && k.MaKhoHang == maKhoTarget);

                        if (kho != null)
                        {
                            kho.SoLuongTon += delta;
                            kho.SoLuongNhap += delta; // Chỉ tăng SL Nhập khi có thêm hàng mới vào
                            kho.SoLuong = kho.SoLuongTon; // Đồng bộ SoLuong
                            kho.NgayNhapCuoi = DateTime.UtcNow;
                            kho.NgayCapNhat = DateTime.UtcNow;
                        }
                        else if (delta > 0)
                        {
                            _ctx.CTKhoHangs.Add(new CTKhoHang {
                                MaKhoHang = maKhoTarget,
                                MaSanPham = ct.MaSanPham,
                                SoLuong = delta,
                                SoLuongTon = delta,
                                SoLuongNhap = delta,
                                NgayNhapCuoi = DateTime.UtcNow,
                                NgayCapNhat = DateTime.UtcNow
                            });
                        }
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

                // 1. (ĐÃ BỎ LOGIC THU HỒI): Không thu hồi các phiếu đã tách. 
                // Phiếu nào đã tách ra (Đã Duyệt) thì giữ nguyên, không xóa đi tạo lại để tránh gửi email 2 lần.
                // Các item đã tách sẽ không nằm trong p.CTPNs nữa, nên sẽ tự động bị bỏ qua trong lần xử lý này.


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
                            item.GhiChu = upd.GhiChu;
                        }
                    }
                }

                if (approvedItems.Any())
                {
                    // Tách các mục được duyệt theo NCC
                    var approvedWithSupplier = approvedItems.GroupBy(item => item.MaNhaCungCap ?? p.MaNhaCungCap).ToList();

                    // TRƯỜNG HỢP ĐẶC BIỆT: Nếu chỉ duyệt cho 1 NCC duy nhất VÀ tất cả sản phẩm trong phiếu đều được duyệt (không có rejected/revision)
                    // Thì cập nhật trực tiếp trên phiếu gốc, không cần tách.
                    if (approvedWithSupplier.Count == 1 && approvedItems.Count == p.CTPNs.Count)
                    {
                        var maNCC = approvedWithSupplier[0].Key;
                        p.TrangThai = "Đã Duyệt";
                        p.MaNhaCungCap = maNCC;
                        p.TongTien = approvedItems.Sum(x => x.ThanhTien ?? 0);
                        
                        foreach (var item in approvedItems)
                        {
                            item.TrangThai = "Đã Duyệt";
                        }

                        _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap {
                            MaPhieuNhap = id,
                            TrangThaiMoi = "Đã Duyệt",
                            NoiDungThayDoi = "Phiếu được duyệt trực tiếp (toàn bộ sản phẩm cùng 1 NCC).",
                            MaNguoiThucHien = dto.UserId
                        });
                        
                        // TỰ ĐỘNG GỬI EMAIL CHO NCC
                        await SendEmailToSupplierInternal(id, dto.UserId);
                    }
                    else
                    {
                        // Logic tách phiếu như cũ
                        foreach (var group in approvedWithSupplier)
                        {
                            var maNCC = group.Key;
                            // Tạo phiếu mới cho mỗi nhóm NCC đã duyệt
                            var newApprovedPhieu = new PhieuNhap
                            {
                                NgayNhap = p.NgayNhap,
                                TrangThai = "Đã Duyệt",
                                GhiChu = $"[TáchTừPhiếu:{id}] " + p.GhiChu,
                                MaNhaCungCap = maNCC,
                                MaNhanVien = p.MaNhanVien,
                                NgayTao = DateTime.UtcNow,
                                NgayCapNhat = DateTime.UtcNow,
                                TongTien = group.Sum(x => x.ThanhTien ?? 0),
                                ThanhToan = 0
                            };
                            _ctx.PhieuNhaps.Add(newApprovedPhieu);
                            await _ctx.SaveChangesAsync();

                            foreach (var item in group)
                            {
                                item.MaPhieuNhap = newApprovedPhieu.MaPhieuNhap;
                                item.TrangThai = "Đã Duyệt";
                            }

                            _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap {
                                MaPhieuNhap = newApprovedPhieu.MaPhieuNhap,
                                TrangThaiMoi = "Đã Duyệt",
                                NoiDungThayDoi = $"Phiếu được duyệt và tách từ {p.MaPN} theo nhà cung cấp.",
                                MaNguoiThucHien = dto.UserId
                            });

                            // BẮT BUỘC SAVE CHANGES ĐỂ CÁC ITEM ĐƯỢC CHUYỂN SANG PHIẾU MỚI TRƯỚC KHI GỬI EMAIL
                            await _ctx.SaveChangesAsync();

                            // TỰ ĐỘNG GỬI EMAIL CHO NCC (TÁCH PHIẾU)
                            await SendEmailToSupplierInternal(newApprovedPhieu.MaPhieuNhap, dto.UserId);
                        }
                    }
                }

                if (rejectedItems.Any())
                {
                    foreach (var item in rejectedItems)
                    {
                        item.TrangThai = "Từ Chối";
                    }
                }

                if (revisionItems.Any())
                {
                    foreach (var item in revisionItems)
                    {
                        item.TrangThai = "Yêu Cầu Sửa";
                    }
                }

                // Cập nhật trạng thái tổng quát cho phiếu gốc
                var remainingItems = p.CTPNs.Where(c => c.MaPhieuNhap == p.MaPhieuNhap).ToList();
                p.TongTien = remainingItems.Sum(c => c.ThanhTien ?? 0);

                if (remainingItems.Any())
                {
                    if (remainingItems.Any(c => c.TrangThai == "Yêu Cầu Sửa")) p.TrangThai = "Yêu Cầu Sửa";
                    else if (remainingItems.All(c => c.TrangThai == "Từ Chối")) p.TrangThai = "Từ Chối";
                    else if (remainingItems.All(c => c.TrangThai == "Đã Duyệt")) p.TrangThai = "Đã Duyệt";
                    else p.TrangThai = "Đang xử lý"; // Mixed state
                }
                else
                {
                    p.TrangThai = "Đã Tách";
                }

                p.NgayCapNhat = DateTime.UtcNow;

                // Log lịch sử cho phiếu gốc (nếu không phải trường hợp đã log ở trên)
                var hasGeneralHistory = _ctx.ChangeTracker.Entries<LichSuPhieuNhap>()
                    .Any(e => e.Entity.MaPhieuNhap == id && e.State == EntityState.Added);

                if (!hasGeneralHistory)
                {
                    var supplierCount = approvedItems.GroupBy(item => item.MaNhaCungCap ?? p.MaNhaCungCap).Count();
                    var isSplitMsg = (supplierCount > 1 || (approvedItems.Any() && approvedItems.Count != p.CTPNs.Count)) ? "(Đã tách)" : "";
                    
                    _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap
                    {
                        MaPhieuNhap = id,
                        TrangThaiMoi = p.TrangThai,
                        NoiDungThayDoi = $"Xử lý chi tiết: Duyệt {approvedItems.Count} {isSplitMsg}, Sửa {revisionItems.Count}, Từ chối {rejectedItems.Count}.",
                        MaNguoiThucHien = dto.UserId
                    });
                }

                await _ctx.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Đã xử lý duyệt phiếu thành công!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("APPROVE ITEMS EXCEPTION: " + ex.ToString());
                await transaction.RollbackAsync();
                var innerMsg = ex.InnerException != null ? ex.InnerException.Message : "";
                return StatusCode(500, new { message = "Lỗi xử lý duyệt một phần.", error = ex.Message + " | Inner: " + innerMsg });
            }
        }

        // 5. Xuất Excel Đơn Nhập Hàng
        [HttpGet("{id}/export/excel")]
        public async Task<IActionResult> ExportExcel(int id)
        {
            var p = await _ctx.PhieuNhaps
                .Include(x => x.NhaCungCap)
                .Include(x => x.NhanVien)
                .Include(x => x.CTPNs).ThenInclude(c => c.SanPham)
                .FirstOrDefaultAsync(x => x.MaPhieuNhap == id);
            
            if (p == null) return NotFound();

            var manager = await _ctx.NhanViens
                .Include(n => n.TaiKhoan).ThenInclude(tk => tk.VaiTro)
                .FirstOrDefaultAsync(n => n.TaiKhoan.VaiTro.TenVT.Contains("Quản lý") || n.TaiKhoan.VaiTro.TenVT.Contains("Giám đốc"));

            using var package = new ExcelPackage();
            var ws = package.Workbook.Worksheets.Add(p.MaPN);

            // 1. Store Info
            ws.Cells["A1"].Value = "CỬA HÀNG VẬT LIỆU XÂY DỰNG THÀNH ĐẠT";
            ws.Cells["A1"].Style.Font.Bold = true;
            ws.Cells["A1"].Style.Font.Size = 14;
            ws.Cells["A1"].Style.Font.Color.SetColor(System.Drawing.Color.FromArgb(255, 165, 0)); // Orange
            
            ws.Cells["A2"].Value = "Địa chỉ: 829 Lạc Long Quân, Phường Bảy Hiền, Quận Tân Bình, Tp. Hồ Chí Minh";
            ws.Cells["A2"].Style.Font.Italic = true;

            // 2. Title
            ws.Cells["A4:F4"].Merge = true;
            ws.Cells["A4"].Value = "ĐƠN ĐẶT HÀNG";
            ws.Cells["A4"].Style.Font.Bold = true;
            ws.Cells["A4"].Style.Font.Size = 20;
            ws.Cells["A4"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            // 3. Info
            ws.Cells["A6"].Value = "Mã đơn hàng:"; ws.Cells["B6"].Value = p.MaPN;
            ws.Cells["D6"].Value = "Ngày đặt:"; ws.Cells["E6"].Value = p.NgayTao.ToString("dd/MM/yyyy HH:mm");
            
            ws.Cells["A7"].Value = "Nhà cung cấp:"; ws.Cells["B7"].Value = p.NhaCungCap?.TenNCC;
            ws.Cells["A8"].Value = "Địa chỉ NCC:"; ws.Cells["B8"].Value = p.NhaCungCap?.DiaChi;
            ws.Cells["A9"].Value = "Điện thoại:"; ws.Cells["B9"].Value = p.NhaCungCap?.Sdt;

            // 4. Table Header
            int startRow = 11;
            string[] headers = { "STT", "Tên sản phẩm", "ĐVT", "SL", "Đơn giá", "Thành tiền" };
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = ws.Cells[startRow, i + 1];
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                cell.Style.Border.BorderAround(ExcelBorderStyle.Thin);
                cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                cell.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
            }

            // 5. Data
            int row = startRow + 1;
            int stt = 1;
            decimal total = 0;
            foreach (var item in p.CTPNs)
            {
                ws.Cells[row, 1].Value = stt++;
                ws.Cells[row, 2].Value = item.SanPham?.TenSP;
                ws.Cells[row, 3].Value = item.SanPham?.DonViTinh;
                ws.Cells[row, 4].Value = item.SoLuong;
                ws.Cells[row, 5].Value = item.DonGia;
                
                decimal tt = item.SoLuong * item.DonGia;
                ws.Cells[row, 6].Value = tt;
                total += tt;

                // Format numbers
                ws.Cells[row, 5, row, 6].Style.Numberformat.Format = "#,##0";
                
                // Borders
                for (int i = 1; i <= 6; i++) ws.Cells[row, i].Style.Border.BorderAround(ExcelBorderStyle.Thin);
                
                row++;
            }

            // 6. Totals
            ws.Cells[row, 5].Value = "Tổng cộng:";
            ws.Cells[row, 6].Value = total;
            ws.Cells[row, 5, row, 6].Style.Font.Bold = true;
            ws.Cells[row, 6].Style.Numberformat.Format = "#,##0";
            ws.Cells[row, 5, row, 6].Style.Border.BorderAround(ExcelBorderStyle.Thin);

            row++;
            ws.Cells[row, 1, row, 6].Merge = true;
            ws.Cells[row, 1].Value = "Số tiền viết bằng chữ: " + NumberToText.Convert(total);
            ws.Cells[row, 1].Style.Font.Italic = true;

            // 7. Signatures
            row += 2;
            ws.Cells[row, 2].Value = "Người lập";
            ws.Cells[row, 2].Style.Font.Bold = true;
            ws.Cells[row, 5].Value = "Người Đại diện cửa hàng";
            ws.Cells[row, 5].Style.Font.Bold = true;
            
            ws.Cells[row, 2, row, 5].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            
            row++;
            ws.Cells[row, 2].Value = "(Ký, họ tên)";
            ws.Cells[row, 5].Value = "(Ký, họ tên, đóng dấu)";
            ws.Cells[row, 2, row, 5].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            ws.Cells[row, 2, row, 5].Style.Font.Size = 9;

            row += 4;
            ws.Cells[row, 2].Value = p.NhanVien?.TenNV;
            ws.Cells[row, 5].Value = manager?.TenNV ?? "Phạm Văn Tài";
            ws.Cells[row, 2, row, 5].Style.Font.Bold = true;
            ws.Cells[row, 2, row, 5].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            ws.Cells.AutoFitColumns();
            ws.Column(2).Width = 40; // Tên SP rộng hơn

            var fileBytes = await package.GetAsByteArrayAsync();
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"DonDatHang_{p.MaPN}.xlsx");
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

            var manager = await _ctx.NhanViens
                .Include(n => n.TaiKhoan).ThenInclude(tk => tk.VaiTro)
                .FirstOrDefaultAsync(n => n.TaiKhoan.VaiTro.TenVT.Contains("Quản lý") || n.TaiKhoan.VaiTro.TenVT.Contains("Giám đốc"));

            var pdf = GenerateProcurementDocument(p, manager);

            var stream = new MemoryStream();
            pdf.GeneratePdf(stream);
            stream.Position = 0;
            return File(stream, "application/pdf", $"DonMuaHang_{p.MaPN}.pdf");
        }

        private IDocument GenerateProcurementDocument(PhieuNhap p, NhanVien? manager)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1.5f, Unit.Centimetre);
                    page.PageColor(QuestPDF.Helpers.Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Arial));

                    // 1. Header
                    page.Header().Column(col =>
                    {
                        col.Item().Text("CỬA HÀNG VẬT LIỆU XÂY DỰNG THÀNH ĐẠT").FontSize(16).Bold().FontColor(QuestPDF.Helpers.Colors.Orange.Medium);
                        col.Item().Text("Địa chỉ: 829 Lạc Long Quân, Phường Bảy Hiền, Quận Tân Bình, Tp. Hồ Chí Minh");
                        col.Item().PaddingTop(15).AlignCenter().Text("ĐƠN ĐẶT HÀNG").FontSize(20).ExtraBold();
                    });

                    // 2. Info Section
                    page.Content().PaddingVertical(10).Column(col =>
                    {
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text(t => { t.Span("Tên nhà cung cấp: ").Bold(); t.Span(p.NhaCungCap?.TenNCC ?? "N/A"); });
                                c.Item().Text(t => { t.Span("Địa chỉ: ").Bold(); t.Span(p.NhaCungCap?.DiaChi ?? "N/A"); });
                                c.Item().Text(t => { t.Span("Điện thoại: ").Bold(); t.Span(p.NhaCungCap?.Sdt ?? "N/A"); });
                            });

                            row.ConstantItem(150).Column(c =>
                            {
                                c.Item().Text(t => { t.Span("Ngày: ").Bold(); t.Span(p.NgayTao.ToString("dd/MM/yyyy")); });
                                c.Item().Text(t => { t.Span("Số: ").Bold(); t.Span(p.MaPN); });
                                c.Item().Text(t => { t.Span("Loại tiền: ").Bold(); t.Span("VND"); });
                            });
                        });

                        // 3. Table
                        decimal subtotal = 0;
                        col.Item().PaddingTop(10).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(25);  // STT
                                columns.ConstantColumn(80);  // Quy cách
                                columns.RelativeColumn();    // Tên sản phẩm (Give more space)
                                columns.ConstantColumn(45);  // Đơn vị
                                columns.ConstantColumn(55);  // Số lượng
                                columns.ConstantColumn(85);  // Đơn giá
                                columns.ConstantColumn(95);  // Thành tiền
                            });

                            table.Header(header =>
                            {
                                header.Cell().Element(HeaderStyle).Text("STT");
                                header.Cell().Element(HeaderStyle).Text("Quy cách");
                                header.Cell().Element(HeaderStyle).Text("Tên sản phẩm");
                                header.Cell().Element(HeaderStyle).Text("Đơn vị");
                                header.Cell().Element(HeaderStyle).AlignRight().Text("SL");
                                header.Cell().Element(HeaderStyle).AlignRight().Text("Đơn giá");
                                header.Cell().Element(HeaderStyle).AlignRight().Text("Thành tiền");

                                static IContainer HeaderStyle(IContainer container) => container.Border(1).Background(QuestPDF.Helpers.Colors.Grey.Lighten4).PaddingVertical(5).AlignCenter().AlignMiddle().DefaultTextStyle(x => x.Bold().FontSize(10));
                            });

                            int i = 1;
                            foreach (var item in p.CTPNs)
                            {
                                decimal tt = item.ThanhTien ?? 0m;
                                subtotal += tt;

                                table.Cell().Element(CellStyle).AlignCenter().Text(i++.ToString());
                                table.Cell().Element(CellStyle).AlignCenter().Text(item.SanPham?.KichThuoc ?? ""); 
                                table.Cell().Element(CellStyle).Text(item.SanPham?.TenSP ?? "N/A");
                                table.Cell().Element(CellStyle).AlignCenter().Text(item.SanPham?.DonViTinh ?? "");
                                table.Cell().Element(CellStyle).AlignRight().Text(item.SoLuong.ToString("N0"));
                                table.Cell().Element(CellStyle).AlignRight().Text(item.DonGia.ToString("N0"));
                                table.Cell().Element(CellStyle).AlignRight().Text(tt.ToString("N0"));

                                static IContainer CellStyle(IContainer container) => container.Border(1).PaddingHorizontal(5).PaddingVertical(3).AlignMiddle().DefaultTextStyle(x => x.FontSize(10));
                            }

                            // Footer Table Rows
                            table.Cell().ColumnSpan(6).Element(FooterLabelStyle).Text("Tổng tiền thanh toán:");
                            table.Cell().Element(FooterValueStyle).Text(subtotal.ToString("N0")).Bold();

                            static IContainer FooterLabelStyle(IContainer container) => container.Border(1).PaddingHorizontal(5).PaddingVertical(4).AlignRight().AlignMiddle().DefaultTextStyle(x => x.FontSize(10));
                            static IContainer FooterValueStyle(IContainer container) => container.Border(1).PaddingHorizontal(5).PaddingVertical(4).AlignRight().AlignMiddle().DefaultTextStyle(x => x.FontSize(10));
                        });

                        col.Item().PaddingTop(10).Text(t => { 
                            t.Span("Số tiền viết bằng chữ: ").Bold().Italic(); 
                            t.Span(NumberToText.Convert(subtotal)).Italic(); 
                        });

                        // 4. Signatures (Push to bottom)
                        col.Item().PaddingTop(50).AlignBottom().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().AlignCenter().Text("Người lập").Bold();
                                c.Item().AlignCenter().Text("(Ký, họ tên)");
                                
                                if (!string.IsNullOrEmpty(p.NhanVien?.ChuKy))
                                {
                                    try {
                                        var sigPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", p.NhanVien.ChuKy.TrimStart('/'));
                                        if (System.IO.File.Exists(sigPath))
                                        {
                                            c.Item().PaddingTop(5).AlignCenter().Height(60).Image(sigPath);
                                        }
                                    } catch { /* ignore signature load error */ }
                                }

                                c.Item().PaddingTop(p.NhanVien?.ChuKy != null ? 5 : 50).AlignCenter().Text(p.NhanVien?.TenNV ?? "").Bold();
                            });

                            row.RelativeItem().Column(c =>
                            {
                                c.Item().AlignCenter().Text("Người Đại diện cửa hàng").Bold();
                                c.Item().AlignCenter().Text("(Ký, họ tên, đóng dấu)");
                                
                                if (!string.IsNullOrEmpty(manager?.ChuKy))
                                {
                                    try {
                                        var sigPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", manager.ChuKy.TrimStart('/'));
                                        if (System.IO.File.Exists(sigPath))
                                        {
                                            c.Item().PaddingTop(5).AlignCenter().Height(60).Image(sigPath);
                                        }
                                    } catch { /* ignore signature load error */ }
                                }
                                
                                c.Item().PaddingTop(manager?.ChuKy != null ? 5 : 50).AlignCenter().Text(manager?.TenNV ?? "Phạm Văn Tài").Bold();
                            });
                        });
                    });

                    page.Footer().AlignRight().Text(x =>
                    {
                        x.Span("Trang ");
                        x.CurrentPageNumber();
                    });
                });
            });
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

            var manager = await _ctx.NhanViens
                .Include(n => n.TaiKhoan).ThenInclude(tk => tk.VaiTro)
                .FirstOrDefaultAsync(n => n.TaiKhoan.VaiTro.TenVT.Contains("Quản lý") || n.TaiKhoan.VaiTro.TenVT.Contains("Giám đốc"));

            var pdf = GenerateProcurementDocument(p, manager);

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
                    TrangThai = (string.Equals(ct.TrangThai, "Từ Chối", StringComparison.OrdinalIgnoreCase)) ? "Từ Chối" : "Đề Xuất"
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
        public List<CTPNDto> ChiTiet { get; set; } = new List<CTPNDto>();
    }

    public class CTPNDto
    {
        public int MaCTPN { get; set; } // Dùng để xác định chính xác dòng cần sửa
        public int MaSanPham { get; set; }
        public int SoLuong { get; set; }
        public decimal DonGia { get; set; }
        public int? MaNhaCungCap { get; set; }
        public int? MaKhoHang { get; set; }
        public string? GhiChu { get; set; }
        public string? TrangThai { get; set; }
    }

    public class HistoryActionDto { public int UserId { get; set; } }

    public class RejectDto 
    { 
        public string LyDo { get; set; } = null!;
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
