using BuildingMaterialAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public DashboardController(ApplicationDbContext context) { _context = context; }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var tongSanPham = await _context.SanPhams.CountAsync();
            var tongDonHang = await _context.HoaDons.CountAsync();
            var tongKhachHang = await _context.KhachHangs.CountAsync();
            var doanhThu = await _context.HoaDons
                .Where(h => h.TrangThai == "Hoàn thành")
                .SumAsync(h => h.ThanhToan ?? 0);

            var tongNhaCungCap = await _context.NhaCungCaps.CountAsync();
            var tongNhanVien = await _context.NhanViens.CountAsync();
            var tongPhieuNhap = await _context.PhieuNhaps.CountAsync();
            var tongCongNo = await _context.CongNos.SumAsync(c => c.SoTienConLai ?? 0);

            return Ok(new
            {
                tongSanPham,
                tongDonHang,
                tongKhachHang,
                doanhThu,
                tongNhaCungCap,
                tongNhanVien,
                tongPhieuNhap,
                tongCongNo
            });
        }

        [HttpGet("recent-orders")]
        public async Task<IActionResult> GetRecentOrders()
        {
            var orders = await _context.HoaDons
                .Include(h => h.KhachHang)
                .Include(h => h.NhanVien)
                .OrderByDescending(h => h.NgayLap)
                .Take(5)
                .Select(h => new
                {
                    h.MaHD,
                    h.NgayLap,
                    tenKhachHang = h.KhachHang.TenKH,
                    h.TongTien,
                    h.ThanhToan,
                    h.TrangThai,
                    h.PTTT,
                    tenNhanVien = h.NhanVien.TenNV
                })
                .ToListAsync();
            return Ok(orders);
        }

        [HttpGet("top-products")]
        public async Task<IActionResult> GetTopProducts()
        {
            var products = await _context.CTHDs
                .Include(ct => ct.SanPham)
                .GroupBy(ct => new { ct.MaSanPham, ct.SanPham.TenSP })
                .Select(g => new
                {
                    tenSP = g.Key.TenSP,
                    soLuongBan = g.Sum(x => x.SoLuong),
                    doanhThu = g.Sum(x => x.ThanhTien ?? 0)
                })
                .OrderByDescending(x => x.soLuongBan)
                .Take(5)
                .ToListAsync();
            return Ok(products);
        }

        [HttpGet("inventory-alerts")]
        public async Task<IActionResult> GetInventoryAlerts()
        {
            var alerts = await _context.CTKhoHangs
                .Include(ct => ct.SanPham)
                .Include(ct => ct.KhoHang)
                .Where(ct => ct.SoLuongTon <= ct.SanPham.MucTonToiThieu)
                .Select(ct => new
                {
                    tenSP = ct.SanPham.TenSP,
                    maSP = ct.SanPham.MaSP,
                    soLuongTon = ct.SoLuongTon,
                    mucToiThieu = ct.SanPham.MucTonToiThieu,
                    tenKho = ct.KhoHang.TenKho
                })
                .ToListAsync();
            return Ok(alerts);
        }

        [HttpGet("debt-summary")]
        public async Task<IActionResult> GetDebtSummary()
        {
            var debts = await _context.CongNos
                .Include(cn => cn.KhachHang)
                .Where(cn => cn.TrangThai != "Đã thanh toán")
                .Select(cn => new
                {
                    cn.MaCN,
                    cn.LoaiCongNo,
                    tenDoiTac = cn.KhachHang != null ? cn.KhachHang.TenKH : "N/A",
                    cn.SoTienNo,
                    cn.SoTienDaTra,
                    cn.SoTienConLai,
                    cn.HanThanhToan,
                    cn.TrangThai
                })
                .ToListAsync();
            return Ok(debts);
        }
    }
}
