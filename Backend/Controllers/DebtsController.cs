using System;
using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuildingMaterialAPI.Services;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/debts")]
    public class DebtsController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly IEmailService _emailService;
        private readonly INotificationService _notificationService;

        public DebtsController(ApplicationDbContext ctx, IEmailService emailService, INotificationService notificationService)
        {
            _ctx = ctx;
            _emailService = emailService;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? type, [FromQuery] string? status)
        {
            try 
            {
                var query = _ctx.CongNos
                    .Include(c => c.KhachHang)
                    .Include(c => c.NhaCungCap)
                    .Include(c => c.HoaDon)
                    .Include(c => c.PhieuNhap)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(type))
                    query = query.Where(c => c.LoaiCongNo == type);
                
                if (!string.IsNullOrEmpty(status))
                    query = query.Where(c => c.TrangThai == status);

                var list = await query.OrderByDescending(c => c.NgayCapNhat).ToListAsync();
                var now = DateTime.UtcNow;

                // Self-healing & Auto-status update
                bool changed = false;
                foreach (var c in list)
                {
                    string oldStatus = c.TrangThai;

                    // Sync with order/purchase payment status
                    if (c.MaHoaDon.HasValue && c.HoaDon != null)
                        c.SoTienDaTra = c.HoaDon.ThanhToan ?? 0;
                    else if (c.MaPhieuNhap.HasValue && c.PhieuNhap != null)
                        c.SoTienDaTra = c.PhieuNhap.ThanhToan ?? 0;

                    c.SoTienConLai = Math.Max(0, c.SoTienNo - c.SoTienDaTra);

                    if (c.SoTienConLai <= 0)
                    {
                        c.TrangThai = "Đã thanh toán";
                    }
                    else
                    {
                        if (c.HanThanhToan.HasValue)
                        {
                            if (c.HanThanhToan.Value < now)
                                c.TrangThai = "Quá hạn";
                            else if ((c.HanThanhToan.Value - now).TotalDays <= 7)
                                c.TrangThai = "Sắp đến hạn";
                            else
                                c.TrangThai = "Chưa thanh toán";
                        }
                        else
                        {
                            c.TrangThai = "Chưa thanh toán";
                        }
                    }

                    if (oldStatus != c.TrangThai)
                    {
                        c.NgayCapNhat = now;
                        changed = true;
                    }
                }
                if (changed) await _ctx.SaveChangesAsync();

                var result = list.Select(c => new {
                        maCongNo = c.MaCongNo,
                        maCN = c.MaCN,
                        loaiCongNo = c.LoaiCongNo,
                        soTienNo = c.SoTienNo,
                        soTienDaTra = c.SoTienDaTra,
                        soTienConLai = c.SoTienConLai,
                        hanThanhToan = c.HanThanhToan,
                        trangThai = c.TrangThai,
                        maKhachHang = c.MaKhachHang,
                        tenKhachHang = c.KhachHang != null ? c.KhachHang.TenKH : "",
                        maNhaCungCap = c.MaNhaCungCap,
                        tenNCC = c.NhaCungCap != null ? c.NhaCungCap.TenNCC : "",
                        maHoaDon = c.MaHoaDon,
                        maHD = c.HoaDon != null ? c.HoaDon.MaHD : "",
                        maPhieuNhap = c.MaPhieuNhap,
                        maPN = c.PhieuNhap != null ? c.PhieuNhap.MaPN : "",
                        ngayTao = c.NgayTao,
                        ngayCapNhat = c.NgayCapNhat
                    }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message });
            }
        }
        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetByCustomer(int customerId)
        {
            var list = await _ctx.CongNos
                .Include(c => c.KhachHang)
                .Include(c => c.HoaDon)
                .Where(c => c.MaKhachHang == customerId && c.LoaiCongNo == "Phải thu")
                .OrderByDescending(c => c.NgayCapNhat)
                .Select(c => new {
                    maCongNo = c.MaCongNo,
                    maCN = c.MaCN,
                    soTienNo = c.SoTienNo,
                    soTienDaTra = c.SoTienDaTra,
                    soTienConLai = c.SoTienConLai,
                    hanThanhToan = c.HanThanhToan,
                    trangThai = c.TrangThai,
                    maHoaDon = c.MaHoaDon,
                    maHD = c.HoaDon != null ? c.HoaDon.MaHD : "",
                    ngayTao = c.NgayTao,
                    ngayCapNhat = c.NgayCapNhat,
                    laiPhat = c.LaiPhat
                }).ToListAsync();

            return Ok(list);
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            var now = DateTime.UtcNow;
            var stats = new {
                tongNoPhaiThu = await _ctx.CongNos.Where(c => c.LoaiCongNo == "Phải thu" && c.TrangThai != "Đã thanh toán").SumAsync(c => c.SoTienConLai ?? 0),
                soKhachNo = await _ctx.CongNos.Where(c => c.LoaiCongNo == "Phải thu" && c.TrangThai != "Đã thanh toán").Select(c => c.MaKhachHang).Distinct().CountAsync(),
                tongNoPhaiTra = await _ctx.CongNos.Where(c => c.LoaiCongNo == "Phải trả" && c.TrangThai != "Đã thanh toán").SumAsync(c => c.SoTienConLai ?? 0),
                soNCCNo = await _ctx.CongNos.Where(c => c.LoaiCongNo == "Phải trả" && c.TrangThai != "Đã thanh toán").Select(c => c.MaNhaCungCap).Distinct().CountAsync(),
                soKhoanQuaHan = await _ctx.CongNos.Where(c => c.TrangThai == "Quá hạn").CountAsync(),
                tienSapToiPhaiTra = await _ctx.LichHenTraNos.Where(l => l.TrangThai == "Chưa hoàn thành" && l.NgayHen >= now).SumAsync(l => l.SoTienDuKien)
            };
            return Ok(stats);
        }

        [HttpGet("warnings")]
        public async Task<IActionResult> GetWarnings()
        {
            var now = DateTime.UtcNow;
            var threeDaysLater = now.AddDays(3);

            var warnings = await _ctx.CongNos
                .Include(c => c.KhachHang)
                .Include(c => c.HoaDon)
                .Where(c => c.LoaiCongNo == "Phải thu" && c.SoTienConLai > 0 && 
                            (c.HanThanhToan < now || c.HanThanhToan <= threeDaysLater))
                .OrderBy(c => c.HanThanhToan)
                .Select(c => new {
                    maCongNo = c.MaCongNo,
                    maCN = c.MaCN,
                    maHD = c.HoaDon != null ? c.HoaDon.MaHD : "",
                    tenKhachHang = c.KhachHang != null ? c.KhachHang.TenKH : "Ẩn danh",
                    soTienConLai = c.SoTienConLai,
                    hanThanhToan = c.HanThanhToan,
                    isOverdue = c.HanThanhToan < now,
                    ngayNhacNoEmail = c.NgayNhacNoEmail,
                    laiPhat = c.LaiPhat
                })
                .ToListAsync();

            return Ok(warnings);
        }

        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetHistory(int id)
        {
            var history = await _ctx.ChiTietTraNos
                .Include(h => h.NhanVien)
                .Where(h => h.MaCongNo == id)
                .OrderByDescending(h => h.NgayTT)
                .Select(h => new {
                    maChiTietTN = h.MaChiTietTN,
                    maTT = h.MaTT,
                    ngayTT = h.NgayTT,
                    soTien = h.SoTien,
                    pttt = h.PTTT,
                    soGiaoDich = h.SoGiaoDich,
                    ghiChu = h.GhiChu,
                    anhBangChung = h.AnhBangChung,
                    tenNhanVien = h.NhanVien != null ? h.NhanVien.TenNV : "Hệ thống"
                }).ToListAsync();
            return Ok(history);
        }

        [HttpPost("payment")]
        public async Task<IActionResult> RecordPayment([FromBody] PaymentRequest req)
        {
            var cn = await _ctx.CongNos.FindAsync(req.MaCongNo);
            if (cn == null) return NotFound("Không tìm thấy bản ghi công nợ.");

            if (req.SoTien <= 0) return BadRequest("Số tiền thanh toán phải lớn hơn 0.");
            if (req.SoTien > cn.SoTienConLai) return BadRequest("Số tiền thanh toán không được vượt quá số nợ còn lại.");

            var ct = new ChiTietTraNo
            {
                MaCongNo = cn.MaCongNo,
                MaHoaDon = cn.MaHoaDon,
                NgayTT = req.NgayTT ?? DateTime.UtcNow,
                SoTien = req.SoTien,
                PTTT = req.PTTT,
                SoGiaoDich = req.SoGiaoDich,
                MaNhanVien = req.MaNhanVien,
                GhiChu = req.GhiChu,
                AnhBangChung = req.AnhBangChung,
                TrangThai = "Thành công",
                NgayTao = DateTime.UtcNow
            };

            cn.SoTienDaTra += req.SoTien;
            cn.SoTienConLai = cn.SoTienNo - cn.SoTienDaTra;
            cn.TrangThai = cn.SoTienConLai <= 0 ? "Đã thanh toán" : "Chưa thanh toán";
            cn.NgayCapNhat = DateTime.UtcNow;

            _ctx.ChiTietTraNos.Add(ct);

            // Sync back to original document
            if (cn.MaHoaDon.HasValue)
            {
                var hd = await _ctx.HoaDons.FindAsync(cn.MaHoaDon.Value);
                if (hd != null)
                {
                    hd.ThanhToan = cn.SoTienDaTra;
                    hd.NgayCapNhat = DateTime.UtcNow;
                }
            }

            if (cn.MaPhieuNhap.HasValue)
            {
                var pn = await _ctx.PhieuNhaps.FindAsync(cn.MaPhieuNhap.Value);
                if (pn != null)
                {
                    pn.ThanhToan = cn.SoTienDaTra;
                    pn.NgayCapNhat = DateTime.UtcNow;
                }
            }


            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thanh toán thành công.", conLai = cn.SoTienConLai });
        }

        // --- LỊCH HẸN TRẢ NỢ ---
        [HttpGet("{debtId}/appointments")]
        public async Task<IActionResult> GetAppointments(int debtId)
        {
            var list = await _ctx.LichHenTraNos
                .Where(l => l.MaCongNo == debtId)
                .OrderBy(l => l.NgayHen)
                .ToListAsync();
            return Ok(list);
        }

        [HttpPost("appointments")]
        public async Task<IActionResult> CreateAppointment([FromBody] LichHenTraNo appointment)
        {
            var cn = await _ctx.CongNos
                .Include(c => c.KhachHang)
                .Include(c => c.HoaDon)
                .FirstOrDefaultAsync(c => c.MaCongNo == appointment.MaCongNo);

            var activeAppointments = await _ctx.LichHenTraNos
                .Where(l => l.MaCongNo == appointment.MaCongNo && l.TrangThai == "Chưa hoàn thành")
                .SumAsync(l => l.SoTienDuKien);

            if (cn != null && (appointment.SoTienDuKien + activeAppointments) > (cn.SoTienConLai ?? 0))
            {
                return BadRequest("Tổng số tiền hẹn trả không được vượt quá số nợ còn lại.");
            }

            appointment.NgayTao = DateTime.UtcNow;
            appointment.TrangThai = "Chưa hoàn thành";
            _ctx.LichHenTraNos.Add(appointment);
            await _ctx.SaveChangesAsync();

            if (cn != null && cn.KhachHang != null && !string.IsNullOrEmpty(cn.KhachHang.Email))
                {
                    string subject = $"Xác nhận lịch hẹn thanh toán công nợ - {cn.HoaDon?.MaHD}";
                    string body = $@"
                        <h3>Kính gửi ông/bà {cn.KhachHang.TenKH},</h3>
                        <p>Hệ thống đã ghi nhận lịch hẹn thanh toán cho đơn hàng <b>{cn.HoaDon?.MaHD}</b> của quý khách.</p>
                        <ul>
                            <li><b>Ngày hẹn thanh toán:</b> {appointment.NgayHen:dd/MM/yyyy}</li>
                            <li><b>Số tiền dự kiến:</b> {appointment.SoTienDuKien:N0} VNĐ</li>
                            <li><b>Ghi chú:</b> {appointment.GhiChu ?? "Không có"}</li>
                        </ul>
                        <p>Quý khách vui lòng lưu ý và sắp xếp thanh toán đúng hạn. Xin cảm ơn!</p>
                        <br/>
                        <p>Trân trọng,<br/>Cửa hàng Vật liệu Xây dựng</p>";
                    
                    await _emailService.SendEmailAsync(cn.KhachHang.Email, subject, body);
                }

            return Ok(appointment);
        }

        [HttpPut("appointments/{id}/complete")]
        public async Task<IActionResult> CompleteAppointment(int id)
        {
            var app = await _ctx.LichHenTraNos.FindAsync(id);
            if (app == null) return NotFound();
            
            if (app.TrangThai == "Đã hoàn thành") return Ok();
            
            app.TrangThai = "Đã hoàn thành";

            // Tạo giao dịch thanh toán tự động
            var cn = await _ctx.CongNos.FindAsync(app.MaCongNo);
            if (cn != null && cn.SoTienConLai > 0)
            {
                decimal amountToPay = Math.Min(app.SoTienDuKien, cn.SoTienConLai.Value);
                
                var ct = new ChiTietTraNo
                {
                    MaCongNo = cn.MaCongNo,
                    MaHoaDon = cn.MaHoaDon,
                    NgayTT = DateTime.UtcNow,
                    SoTien = amountToPay,
                    PTTT = "Tiền mặt / Chuyển khoản (Lịch hẹn)",
                    GhiChu = $"Tự động thanh toán theo lịch hẹn ngày {app.NgayHen:dd/MM/yyyy}",
                    TrangThai = "Thành công",
                    NgayTao = DateTime.UtcNow
                };

                cn.SoTienDaTra += amountToPay;
                cn.SoTienConLai = Math.Max(0, cn.SoTienNo - cn.SoTienDaTra);
                cn.TrangThai = cn.SoTienConLai <= 0 ? "Đã thanh toán" : "Chưa thanh toán";
                cn.NgayCapNhat = DateTime.UtcNow;

                _ctx.ChiTietTraNos.Add(ct);

                // Đồng bộ lại hóa đơn nếu có
                if (cn.MaHoaDon.HasValue)
                {
                    var hd = await _ctx.HoaDons.FindAsync(cn.MaHoaDon.Value);
                    if (hd != null)
                    {
                        hd.ThanhToan = cn.SoTienDaTra;
                        hd.NgayCapNhat = DateTime.UtcNow;
                    }
                }
            }

            await _ctx.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("appointments/{id}")]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            var app = await _ctx.LichHenTraNos.FindAsync(id);
            if (app == null) return NotFound();
            _ctx.LichHenTraNos.Remove(app);
            await _ctx.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("export")]
        public async Task<IActionResult> Export([FromQuery] string? type, [FromQuery] string? status)
        {
            var query = _ctx.CongNos
                .Include(c => c.KhachHang)
                .Include(c => c.NhaCungCap)
                .Include(c => c.HoaDon)
                .Include(c => c.PhieuNhap)
                .AsQueryable();

            if (!string.IsNullOrEmpty(type))
                query = query.Where(c => c.LoaiCongNo == type);
            
            if (!string.IsNullOrEmpty(status))
                query = query.Where(c => c.TrangThai == status);

            var list = await query.OrderByDescending(c => c.NgayCapNhat).ToListAsync();

            using var package = new OfficeOpenXml.ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("CongNo");
            worksheet.Cells[1, 1].Value = "Mã Công Nợ";
            worksheet.Cells[1, 2].Value = "Loại Công Nợ";
            worksheet.Cells[1, 3].Value = "Đối Tác";
            worksheet.Cells[1, 4].Value = "Tổng Nợ";
            worksheet.Cells[1, 5].Value = "Đã Trả";
            worksheet.Cells[1, 6].Value = "Còn Lại";
            worksheet.Cells[1, 7].Value = "Hạn Thanh Toán";
            worksheet.Cells[1, 8].Value = "Trạng Thái";
            worksheet.Cells["A1:H1"].Style.Font.Bold = true;

            for (int i = 0; i < list.Count; i++)
            {
                var item = list[i];
                var tenDoiTac = item.LoaiCongNo == "Phải thu" 
                    ? (item.KhachHang?.TenKH ?? "") 
                    : (item.NhaCungCap?.TenNCC ?? "");

                worksheet.Cells[i + 2, 1].Value = item.MaCN;
                worksheet.Cells[i + 2, 2].Value = item.LoaiCongNo;
                worksheet.Cells[i + 2, 3].Value = tenDoiTac;
                worksheet.Cells[i + 2, 4].Value = item.SoTienNo;
                worksheet.Cells[i + 2, 5].Value = item.SoTienDaTra;
                worksheet.Cells[i + 2, 6].Value = item.SoTienConLai;
                worksheet.Cells[i + 2, 7].Value = item.HanThanhToan?.ToString("dd/MM/yyyy") ?? "";
                worksheet.Cells[i + 2, 8].Value = item.TrangThai;
            }

            var stream = new MemoryStream();
            package.SaveAs(stream);
            stream.Position = 0;
            string excelName = $"BaoCaoCongNo_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
            return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelName);
        }
    }

    public class PaymentRequest
    {
        public int MaCongNo { get; set; }
        public decimal SoTien { get; set; }
        public string? PTTT { get; set; }
        public string? SoGiaoDich { get; set; }
        public int? MaNhanVien { get; set; }
        public string? GhiChu { get; set; }
        public DateTime? NgayTT { get; set; }
        public string? AnhBangChung { get; set; }
    }
}
