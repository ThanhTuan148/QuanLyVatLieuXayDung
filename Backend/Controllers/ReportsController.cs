using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/reports")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public ReportsController(ApplicationDbContext ctx) { _ctx = ctx; }

        [HttpGet("revenue-profit")]
        public async Task<IActionResult> GetRevenueProfit([FromQuery] int days = 30, [FromQuery] string? startDateStr = null, [FromQuery] string? endDateStr = null)
        {
            DateTime startDate;
            DateTime endDate = DateTime.Today.AddDays(1);

            if (!string.IsNullOrEmpty(startDateStr) && DateTime.TryParseExact(startDateStr, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var sd)) {
                startDate = sd;
                if (!string.IsNullOrEmpty(endDateStr) && DateTime.TryParseExact(endDateStr, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var ed)) {
                    endDate = ed.AddDays(1);
                } else {
                    endDate = sd.AddDays(1); // Nếu chỉ chọn 1 ngày, mặc định lấy trong ngày đó
                }
            } else {
                startDate = DateTime.Today.AddDays(-days);
            }
            
            // Lấy tất cả hóa đơn hoàn thành trong khoảng thời gian
            var orders = await _ctx.HoaDons
                .Include(h => h.CTHDs)
                .Where(h => (h.TrangThai ?? "").ToLower().Contains("hoàn thành") && h.NgayLap >= startDate && h.NgayLap < endDate)
                .ToListAsync();

            // Lấy giá nhập gần nhất của các sản phẩm để tính lợi nhuận (giả định đơn giản)
            var productIds = orders.SelectMany(h => h.CTHDs).Select(c => c.MaSanPham).Distinct().ToList();
            var ctpns = await _ctx.CTPNs
                .Where(c => productIds.Contains(c.MaSanPham))
                .Select(c => new { c.MaSanPham, c.DonGia, c.NgayTao })
                .ToListAsync();

            var latestImportPrices = ctpns
                .GroupBy(c => c.MaSanPham)
                .ToDictionary(
                    g => g.Key, 
                    g => g.OrderByDescending(x => x.NgayTao).Select(x => x.DonGia).FirstOrDefault()
                );

            var report = orders
                .GroupBy(h => h.NgayLap.Date)
                .Select(g => {
                    decimal totalRevenue = g.Sum(h => h.TongTien ?? 0);
                    decimal totalCost = g.Sum(h => h.CTHDs.Sum(ct => {
                        decimal cost = latestImportPrices.ContainsKey(ct.MaSanPham) ? latestImportPrices[ct.MaSanPham] : 0;
                        return cost * ct.SoLuong;
                    }));

                    return new {
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        Revenue = totalRevenue,
                        Collected = g.Sum(h => h.ThanhToan ?? 0),
                        Profit = totalRevenue - totalCost,
                        OrderCount = g.Count()
                    };
                })
                .OrderBy(x => x.Date)
                .ToList();

            return Ok(report);
        }

        [HttpGet("inventory-aging")]
        public async Task<IActionResult> GetInventoryAging()
        {
            // Hàng tồn đọng: số lượng tồn > 0 và ngày cập nhật cuối > 60 ngày
            var sixtyDaysAgo = DateTime.UtcNow.AddDays(-60);
            var agingItems = await _ctx.CTKhoHangs
                .Include(k => k.SanPham)
                .Include(k => k.KhoHang)
                .Where(k => k.SoLuongTon > 0 && k.NgayCapNhat <= sixtyDaysAgo)
                .Select(k => new {
                    k.MaSanPham,
                    tenSP = k.SanPham != null ? k.SanPham.TenSP : "Unknown",
                    k.SoLuongTon,
                    ngayCapNhat = k.NgayCapNhat,
                    tenKho = k.KhoHang != null ? k.KhoHang.TenKho : "Unknown",
                    daysOld = EF.Functions.DateDiffDay(k.NgayCapNhat, DateTime.UtcNow)
                })
                .OrderByDescending(k => k.daysOld)
                .ToListAsync();

            return Ok(agingItems);
        }

        [HttpGet("customer-ranking")]
        public async Task<IActionResult> GetCustomerRanking()
        {
            var ranking = await _ctx.HoaDons
                .Include(h => h.KhachHang)
                .Where(h => h.TrangThai == "Hoàn thành")
                .GroupBy(h => new { h.MaKhachHang, TenKH = h.KhachHang != null ? h.KhachHang.TenKH : "Khách lẻ", MaKH = h.KhachHang != null ? h.KhachHang.MaKH : "N/A" })
                .Select(g => new {
                    maKH = g.Key.MaKH,
                    tenKH = g.Key.TenKH,
                    orderCount = g.Count(),
                    totalSpend = g.Sum(h => h.ThanhToan ?? 0)
                })
                .OrderByDescending(x => x.totalSpend)
                .Take(20)
                .ToListAsync();

            return Ok(ranking);
        }

        [HttpGet("debt-aging")]
        public async Task<IActionResult> GetDebtAging()
        {
            var now = DateTime.Today;
            var debts = await _ctx.CongNos
                .Include(c => c.KhachHang)
                .Where(c => c.SoTienConLai > 0 && c.MaKhachHang != null)
                .ToListAsync();

            var summary = new {
                InTerm = debts.Where(d => d.HanThanhToan >= now).Sum(d => d.SoTienConLai),
                Overdue30 = debts.Where(d => d.HanThanhToan < now && d.HanThanhToan >= now.AddDays(-30)).Sum(d => d.SoTienConLai),
                Overdue60 = debts.Where(d => d.HanThanhToan < now.AddDays(-30) && d.HanThanhToan >= now.AddDays(-60)).Sum(d => d.SoTienConLai),
                OverdueLong = debts.Where(d => d.HanThanhToan < now.AddDays(-60)).Sum(d => d.SoTienConLai),
                Details = debts.Select(d => new {
                    tenKH = d.KhachHang?.TenKH,
                    soTien = d.SoTienConLai,
                    hanTT = d.HanThanhToan,
                    daysOverdue = d.HanThanhToan < now ? (now - d.HanThanhToan.Value).Days : 0
                }).OrderByDescending(x => x.daysOverdue).Take(10)
            };

            return Ok(summary);
        }

        [HttpGet("daily-orders")]
        public async Task<IActionResult> GetDailyOrders([FromQuery] string date)
        {
            if (!DateTime.TryParseExact(date, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var parsedDate)) 
                return BadRequest("Invalid date format. Expected yyyy-MM-dd");

            var startDate = parsedDate.Date;
            var endDate = startDate.AddDays(1);

            var orders = await _ctx.HoaDons
                .Include(h => h.KhachHang)
                .Where(h => (h.TrangThai ?? "").ToLower().Contains("hoàn thành") && h.NgayLap >= startDate && h.NgayLap < endDate)
                .Select(h => new {
                    h.MaHoaDon,
                    h.MaHD,
                    tenKH = h.KhachHang != null ? h.KhachHang.TenKH : "Khách lẻ",
                    h.NgayLap,
                    tongTien = h.TongTien,
                    thanhToan = h.ThanhToan,
                    h.PTTT,
                    h.TrangThai
                })
                .ToListAsync();

            return Ok(orders);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var totalRevenue = await _ctx.HoaDons.Where(h => h.TrangThai != null && h.TrangThai.ToLower().Contains("hoàn thành")).SumAsync(h => h.TongTien ?? 0);
            var totalCollected = await _ctx.HoaDons.Where(h => h.TrangThai != null && h.TrangThai.ToLower().Contains("hoàn thành")).SumAsync(h => h.ThanhToan ?? 0);
            var totalDebt = await _ctx.CongNos.Where(c => c.MaKhachHang != null).SumAsync(c => c.SoTienConLai);
            var totalProducts = await _ctx.SanPhams.CountAsync();
            var totalOrders = await _ctx.HoaDons.CountAsync(h => h.TrangThai != null && h.TrangThai.ToLower().Contains("hoàn thành"));
            
            var inventoryItems = await _ctx.CTKhoHangs.Where(k => k.SoLuongTon > 0).ToListAsync();
            var productIds = inventoryItems.Select(i => i.MaSanPham).Distinct().ToList();
            
            var ctpns = await _ctx.CTPNs
                .Where(c => productIds.Contains(c.MaSanPham))
                .Select(c => new { c.MaSanPham, c.DonGia, c.NgayTao })
                .ToListAsync();

            var latestPrices = ctpns
                .GroupBy(c => c.MaSanPham)
                .ToDictionary(
                    g => g.Key, 
                    g => g.OrderByDescending(x => x.NgayTao).Select(x => x.DonGia).FirstOrDefault()
                );

            decimal inventoryValue = inventoryItems.Sum(item => {
                decimal price = latestPrices.ContainsKey(item.MaSanPham) ? latestPrices[item.MaSanPham] : 0;
                return item.SoLuongTon * price;
            });

            return Ok(new { totalRevenue, totalDebt, totalProducts, totalOrders, inventoryValue });
        }
    }
}
