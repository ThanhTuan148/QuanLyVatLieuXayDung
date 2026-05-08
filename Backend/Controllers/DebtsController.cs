using System;
using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/debts")]
    public class DebtsController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public DebtsController(ApplicationDbContext ctx) { _ctx = ctx; }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? type, [FromQuery] string? status)
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

                c.SoTienConLai = c.SoTienNo - c.SoTienDaTra;

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
            appointment.NgayTao = DateTime.UtcNow;
            appointment.TrangThai = "Chưa hoàn thành";
            _ctx.LichHenTraNos.Add(appointment);
            await _ctx.SaveChangesAsync();
            return Ok(appointment);
        }

        [HttpPut("appointments/{id}/complete")]
        public async Task<IActionResult> CompleteAppointment(int id)
        {
            var app = await _ctx.LichHenTraNos.FindAsync(id);
            if (app == null) return NotFound();
            app.TrangThai = "Đã hoàn thành";
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
    }
}
