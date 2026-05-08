using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/price-history")]
    public class PriceHistoryController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public PriceHistoryController(ApplicationDbContext ctx) { _ctx = ctx; }

        // GET /api/price-history?productId=1&days=90
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? productId, [FromQuery] int days = 180)
        {
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var query = _ctx.LichSuGias
                .Include(l => l.SanPham)
                .Include(l => l.NhanVien)
                .Where(l => l.NgayThayDoi >= cutoff);

            if (productId.HasValue)
                query = query.Where(l => l.MaSanPham == productId.Value);

            var data = await query
                .OrderByDescending(l => l.NgayThayDoi)
                .Select(l => new
                {
                    maLSG = l.MaLSG,
                    maSanPham = l.MaSanPham,
                    tenSP = l.SanPham != null ? l.SanPham.TenSP : "",
                    maSP = l.SanPham != null ? l.SanPham.MaSP : "",
                    giaBanCu = l.GiaBanCu,
                    giaBanMoi = l.GiaBanMoi,
                    giaNhapCu = l.GiaNhapCu,
                    giaNhapMoi = l.GiaNhapMoi,
                    phanTramThayDoi = l.GiaBanCu.HasValue && l.GiaBanCu > 0
                        ? Math.Round((l.GiaBanMoi - l.GiaBanCu.Value) / l.GiaBanCu.Value * 100, 2)
                        : (decimal?)null,
                    lyDo = l.LyDo,
                    nguonThayDoi = l.NguonThayDoi,
                    ngayThayDoi = l.NgayThayDoi,
                    tenNhanVien = l.NhanVien != null ? l.NhanVien.TenNV : "Hệ thống"
                })
                .ToListAsync();

            return Ok(data);
        }

        // GET /api/price-history/products-overview — bảng tất cả SP với giá hiện tại & giá trước
        [HttpGet("products-overview")]
        public async Task<IActionResult> GetProductsOverview()
        {
            var products = await _ctx.SanPhams
                .Where(p => p.TrangThai == true)
                .Include(p => p.LoaiSanPham)
                .Include(p => p.CTKhoHangs)
                .ToListAsync();

            // Lấy bản ghi lịch sử gần nhất cho mỗi SP một lần
            var latestHistory = await _ctx.LichSuGias
                .GroupBy(l => l.MaSanPham)
                .Select(g => g.OrderByDescending(x => x.NgayThayDoi).First())
                .ToListAsync();

            var historyDict = latestHistory.ToDictionary(h => h.MaSanPham);

            var result = products.Select(p =>
            {
                historyDict.TryGetValue(p.MaSanPham, out var hist);
                var soLuongTon = p.CTKhoHangs?.Sum(k => k.SoLuongTon) ?? 0;
                var pctBan = hist?.GiaBanCu.HasValue == true && hist.GiaBanCu > 0
                    ? Math.Round((p.GiaBan - hist.GiaBanCu.Value) / hist.GiaBanCu.Value * 100, 2)
                    : (decimal?)null;

                return new
                {
                    maSanPham = p.MaSanPham,
                    maSP = p.MaSP,
                    tenSP = p.TenSP,
                    tenLoai = p.LoaiSanPham?.TenLoai ?? "",
                    soLuongTon,
                    // Giá bán
                    giaBanHienTai = p.GiaBan,
                    giaBanTruoc = hist?.GiaBanCu,
                    phanTramGiaBan = pctBan,
                    // Giá nhập
                    giaNhapHienTai = p.GiaNhap,
                    giaNhapTruoc = hist?.GiaNhapCu,
                    // Lần thay đổi gần nhất
                    lanThayDoiGanNhat = hist?.NgayThayDoi,
                    soLanThayDoi = _ctx.LichSuGias.Count(l => l.MaSanPham == p.MaSanPham)
                };
            }).OrderBy(x => x.maSP).ToList();

            return Ok(result);
        }

        // GET /api/price-history/product/{id}/chart — dữ liệu cho biểu đồ
        [HttpGet("product/{id}/chart")]
        public async Task<IActionResult> GetChart(int id, [FromQuery] int days = 180)
        {
            var cutoff = DateTime.UtcNow.AddDays(-days);

            // Lấy giá hiện tại của sản phẩm
            var product = await _ctx.SanPhams.FindAsync(id);
            if (product == null) return NotFound();

            var history = await _ctx.LichSuGias
                .Where(l => l.MaSanPham == id && l.NgayThayDoi >= cutoff)
                .OrderBy(l => l.NgayThayDoi)
                .Select(l => new
                {
                    ngay = l.NgayThayDoi,
                    giaBan = l.GiaBanMoi,
                    giaNhap = l.GiaNhapMoi,
                    nguonThayDoi = l.NguonThayDoi
                })
                .ToListAsync();

            // Thêm điểm hiện tại
            var chartData = history.ToList<object>();
            chartData.Add(new
            {
                ngay = DateTime.UtcNow,
                giaBan = product.GiaBan,
                giaNhap = product.GiaNhap,
                nguonThayDoi = "Hiện tại"
            });

            return Ok(new
            {
                product = new { maSanPham = product.MaSanPham, tenSP = product.TenSP, giaBanHienTai = product.GiaBan, giaNhapHienTai = product.GiaNhap },
                chartData
            });
        }

        // GET /api/price-history/summary — thống kê biến động giá
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] int days = 30)
        {
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var changes = await _ctx.LichSuGias
                .Include(l => l.SanPham)
                .Where(l => l.NgayThayDoi >= cutoff && l.GiaBanCu.HasValue && l.GiaBanCu > 0)
                .ToListAsync();

            var summary = changes
                .GroupBy(l => l.MaSanPham)
                .Select(g => new
                {
                    maSanPham = g.Key,
                    tenSP = g.First().SanPham?.TenSP ?? "",
                    maSP = g.First().SanPham?.MaSP ?? "",
                    soLanThayDoi = g.Count(),
                    giaDauKy = g.OrderBy(x => x.NgayThayDoi).First().GiaBanCu,
                    giaCuoiKy = g.OrderByDescending(x => x.NgayThayDoi).First().GiaBanMoi,
                    phanTramThayDoi = g.First().GiaBanCu > 0
                        ? Math.Round((g.OrderByDescending(x => x.NgayThayDoi).First().GiaBanMoi
                            - g.OrderBy(x => x.NgayThayDoi).First().GiaBanCu!.Value)
                            / g.OrderBy(x => x.NgayThayDoi).First().GiaBanCu!.Value * 100, 2)
                        : 0
                })
                .OrderByDescending(x => Math.Abs(x.phanTramThayDoi))
                .ToList();

            return Ok(new
            {
                tongSoSanPhamBienDong = summary.Count,
                tangGia = summary.Count(x => x.phanTramThayDoi > 0),
                giamGia = summary.Count(x => x.phanTramThayDoi < 0),
                khongThayDoi = summary.Count(x => x.phanTramThayDoi == 0),
                chiTiet = summary
            });
        }

        // POST /api/price-history — ghi nhận thủ công
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] LichSuGiaDto dto)
        {
            var record = new LichSuGia
            {
                MaSanPham = dto.MaSanPham,
                GiaBanCu = dto.GiaBanCu,
                GiaBanMoi = dto.GiaBanMoi,
                GiaNhapCu = dto.GiaNhapCu,
                GiaNhapMoi = dto.GiaNhapMoi,
                LyDo = dto.LyDo,
                NguonThayDoi = dto.NguonThayDoi ?? "Thủ công",
                NgayThayDoi = DateTime.UtcNow,
                MaNhanVien = dto.MaNhanVien
            };
            _ctx.LichSuGias.Add(record);
            await _ctx.SaveChangesAsync();
            return Ok(record);
        }
    }

    public class LichSuGiaDto
    {
        public int MaSanPham { get; set; }
        public decimal? GiaBanCu { get; set; }
        public decimal GiaBanMoi { get; set; }
        public decimal? GiaNhapCu { get; set; }
        public decimal? GiaNhapMoi { get; set; }
        public string? LyDo { get; set; }
        public string? NguonThayDoi { get; set; }
        public int? MaNhanVien { get; set; }
    }
}
