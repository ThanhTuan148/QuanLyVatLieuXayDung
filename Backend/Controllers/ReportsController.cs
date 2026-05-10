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
        public async Task<IActionResult> GetRevenueProfit([FromQuery] int days = 30)
        {
            var startDate = DateTime.Today.AddDays(-days);
            
            // Lấy tất cả hóa đơn hoàn thành trong khoảng thời gian
            var orders = await _ctx.HoaDons
                .Include(h => h.CTHDs)
                .Where(h => h.TrangThai.ToLower().Contains("hoàn thành") && h.NgayLap >= startDate)
                .ToListAsync();

            // Lấy giá nhập gần nhất của các sản phẩm để tính lợi nhuận (giả định đơn giản)
            var productIds = orders.SelectMany(h => h.CTHDs).Select(c => c.MaSanPham).Distinct().ToList();
            var latestImportPrices = await _ctx.CTPNs
                .Where(c => productIds.Contains(c.MaSanPham))
                .GroupBy(c => c.MaSanPham)
                .Select(g => new { 
                    MaSanPham = g.Key, 
                    GiaNhap = g.OrderByDescending(x => x.NgayTao).Select(x => x.DonGia).FirstOrDefault() 
                })
                .ToDictionaryAsync(x => x.MaSanPham, x => x.GiaNhap);

            var report = orders
                .GroupBy(h => h.NgayLap.Date)
                .Select(g => new {
                    Date = g.Key.ToString("yyyy-MM-dd"),
                    Revenue = g.Sum(h => h.ThanhToan ?? 0),
                    Profit = g.Sum(h => h.CTHDs.Sum(ct => {
                        decimal cost = latestImportPrices.ContainsKey(ct.MaSanPham) ? latestImportPrices[ct.MaSanPham] : 0;
                        return (ct.DonGia - cost) * ct.SoLuong;
                    })),
                    OrderCount = g.Count()
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
                    tenSP = k.SanPham.TenSP,
                    k.SoLuongTon,
                    ngayCapNhat = k.NgayCapNhat,
                    tenKho = k.KhoHang.TenKho,
                    daysOld = (DateTime.UtcNow - k.NgayCapNhat).Days
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
                .GroupBy(h => new { h.MaKhachHang, h.KhachHang.TenKH, h.KhachHang.MaKH })
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
    }
}
