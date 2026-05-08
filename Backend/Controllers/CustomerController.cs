using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/customers")]
    public class CustomerController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public CustomerController(ApplicationDbContext ctx) { _ctx = ctx; }

        // ─── Hạng thành viên theo tổng chi tiêu ──────────────────────
        private static string TinhHang(decimal tongChiTieu) => tongChiTieu switch
        {
            >= 60_000_000 => "Kim Cương",
            >= 45_000_000 => "Vàng",
            >= 15_000_000 => "Bạc",
            _              => "Đồng"
        };

        // ─── Màu hiển thị theo hạng ────────────────────────────────
        public static string MauHang(string hang) => hang switch
        {
            "Kim Cương" => "#00BCD4",
            "Vàng"      => "#FFC107",
            "Bạc"       => "#9E9E9E",
            _            => "#CD7F32"  // Đồng
        };

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var customers = await _ctx.KhachHangs.ToListAsync();
            return Ok(customers.Select(k => new
            {
                maKhachHang = k.MaKhachHang, maKH = k.MaKH, tenKH = k.TenKH,
                sdt = k.Sdt, email = k.Email, diaChi = k.DiaChi,
                trangThai = k.TrangThai, ngayTao = k.NgayTao,
                hangThanhVien = k.HangThanhVien,
                anhDaiDien = k.AnhDaiDien,
                gioiTinh = k.GioiTinh,
                cccd = k.CCCD,
                tongChiTieu = k.TongChiTieu,
                mauHang = MauHang(k.HangThanhVien ?? "Đồng")
            }));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var k = await _ctx.KhachHangs.FindAsync(id);
            return k == null ? NotFound() : Ok(k);
        }

        [HttpGet("{id}/tier-history")]
        public async Task<IActionResult> GetTierHistory(int id)
        {
            var history = await _ctx.LichSuThangHangs
                .Where(l => l.MaKhachHang == id)
                .OrderByDescending(l => l.NgayThayDoi)
                .ToListAsync();
            return Ok(history);
        }

        // ─── Tính lại hạng thủ công (gọi sau khi có hóa đơn mới) ──
        [HttpPost("{id}/recalculate-tier")]
        public async Task<IActionResult> RecalculateTier(int id)
        {
            var kh = await _ctx.KhachHangs.FindAsync(id);
            if (kh == null) return NotFound();

            // Tổng chi tiêu = tổng ThanhToan của các hóa đơn Hoàn thành
            var tongChiTieu = await _ctx.HoaDons
                .Where(h => h.MaKhachHang == id && h.TrangThai == "Hoàn thành")
                .SumAsync(h => (decimal?)(h.ThanhToan ?? 0)) ?? 0;

            kh.TongChiTieu = tongChiTieu;
            kh.HangThanhVien = TinhHang(tongChiTieu);
            kh.NgayCapNhat = DateTime.UtcNow;
            await _ctx.SaveChangesAsync();

            return Ok(new { tongChiTieu, hangThanhVien = kh.HangThanhVien });
        }

        // ─── Cập nhật hạng cho tất cả KH (batch) ──────────────────
        [HttpPost("recalculate-all-tiers")]
        public async Task<IActionResult> RecalculateAllTiers()
        {
            var customers = await _ctx.KhachHangs.ToListAsync();
            var orderTotals = await _ctx.HoaDons
                .Where(h => h.TrangThai == "Hoàn thành")
                .GroupBy(h => h.MaKhachHang)
                .Select(g => new { maKH = g.Key, total = g.Sum(h => (decimal?)(h.ThanhToan ?? 0)) ?? 0 })
                .ToListAsync();

            foreach (var kh in customers)
            {
                var total = orderTotals.FirstOrDefault(o => o.maKH == kh.MaKhachHang)?.total ?? 0;
                kh.TongChiTieu = total;
                kh.HangThanhVien = TinhHang(total);
                kh.NgayCapNhat = DateTime.UtcNow;
            }
            await _ctx.SaveChangesAsync();
            return Ok(new { updated = customers.Count });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] KhachHangDto dto)
        {
            if (dto == null) return BadRequest();
            var kh = new KhachHang
            {
                TenKH = dto.TenKH ?? "",
                Sdt = dto.SDT, Email = dto.Email, DiaChi = dto.DiaChi,
                LoaiKH = dto.LoaiKH, NguoiLienHe = dto.NguoiLienHe, MaSoThue = dto.MaSoThue,
                TrangThai = dto.TrangThai,
                HangThanhVien = "Đồng",  // Mặc định Đồng
                AnhDaiDien = dto.AnhDaiDien,
                TongChiTieu = 0,
                NgayTao = DateTime.UtcNow, NgayCapNhat = DateTime.UtcNow,
            };
            _ctx.KhachHangs.Add(kh);
            try { await _ctx.SaveChangesAsync(); return Ok(kh); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message }); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] KhachHangDto dto)
        {
            var kh = await _ctx.KhachHangs.FindAsync(id);
            if (kh == null) return NotFound();
            kh.TenKH = string.IsNullOrWhiteSpace(dto.TenKH) ? kh.TenKH : dto.TenKH;
            kh.Sdt = string.IsNullOrWhiteSpace(dto.SDT) ? null : dto.SDT;
            kh.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email;
            kh.DiaChi = string.IsNullOrWhiteSpace(dto.DiaChi) ? null : dto.DiaChi;
            kh.LoaiKH = string.IsNullOrWhiteSpace(dto.LoaiKH) ? null : dto.LoaiKH;
            kh.NguoiLienHe = string.IsNullOrWhiteSpace(dto.NguoiLienHe) ? null : dto.NguoiLienHe;
            kh.MaSoThue = string.IsNullOrWhiteSpace(dto.MaSoThue) ? null : dto.MaSoThue;
            kh.TrangThai = dto.TrangThai;
            kh.NgaySinh = dto.NgaySinh;
            kh.GioiTinh = dto.GioiTinh;
            kh.CCCD = dto.CCCD;
            if (!string.IsNullOrWhiteSpace(dto.AnhDaiDien)) { kh.AnhDaiDien = dto.AnhDaiDien; }
            kh.NgayCapNhat = DateTime.UtcNow;
            try { await _ctx.SaveChangesAsync(); return Ok(kh); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message }); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var kh = await _ctx.KhachHangs.FindAsync(id);
            if (kh == null) return NotFound();
            _ctx.KhachHangs.Remove(kh);
            await _ctx.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("export")]
        public async Task<IActionResult> Export()
        {
            var list = await _ctx.KhachHangs.ToListAsync();
            using var package = new OfficeOpenXml.ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("KhachHang");
            worksheet.Cells[1, 1].Value = "Id (Bỏ qua khi import mới)";
            worksheet.Cells[1, 2].Value = "Tên KH";
            worksheet.Cells[1, 3].Value = "SĐT";
            worksheet.Cells[1, 4].Value = "Email";
            worksheet.Cells[1, 5].Value = "Địa Chỉ";
            worksheet.Cells[1, 6].Value = "Loại KH";
            worksheet.Cells[1, 7].Value = "Người Liên Hệ";
            worksheet.Cells[1, 8].Value = "Mã Số Thuế";
            worksheet.Cells[1, 9].Value = "Trạng Thái (1/0)";
            worksheet.Cells[1, 10].Value = "Hạng Thành Viên";
            worksheet.Cells[1, 11].Value = "Tổng Chi Tiêu";
            worksheet.Cells["A1:K1"].Style.Font.Bold = true;

            for (int i = 0; i < list.Count; i++)
            {
                var item = list[i];
                worksheet.Cells[i + 2, 1].Value = item.MaKhachHang;
                worksheet.Cells[i + 2, 2].Value = item.TenKH;
                worksheet.Cells[i + 2, 3].Value = item.Sdt;
                worksheet.Cells[i + 2, 4].Value = item.Email;
                worksheet.Cells[i + 2, 5].Value = item.DiaChi;
                worksheet.Cells[i + 2, 6].Value = item.LoaiKH;
                worksheet.Cells[i + 2, 7].Value = item.NguoiLienHe;
                worksheet.Cells[i + 2, 8].Value = item.MaSoThue;
                worksheet.Cells[i + 2, 9].Value = item.TrangThai ? 1 : 0;
                worksheet.Cells[i + 2, 10].Value = item.HangThanhVien;
                worksheet.Cells[i + 2, 11].Value = item.TongChiTieu;
            }

            var stream = new MemoryStream();
            package.SaveAs(stream);
            stream.Position = 0;
            return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"KhachHang_{DateTime.Now:yyyyMMddHHmmss}.xlsx");
        }

        [HttpPost("import")]
        public async Task<IActionResult> Import(IFormFile file)
        {
            if (file == null || file.Length <= 0) return BadRequest("No file");
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            using var package = new OfficeOpenXml.ExcelPackage(stream);
            var worksheet = package.Workbook.Worksheets.FirstOrDefault();
            if (worksheet == null) return BadRequest("No worksheet");

            var rowCount = worksheet.Dimension?.Rows ?? 0;
            for (int row = 2; row <= rowCount; row++)
            {
                var idStr = worksheet.Cells[row, 1].Value?.ToString();
                var ten = worksheet.Cells[row, 2].Value?.ToString();
                var sdt = worksheet.Cells[row, 3].Value?.ToString();
                var email = worksheet.Cells[row, 4].Value?.ToString();
                var diaChi = worksheet.Cells[row, 5].Value?.ToString();
                var loai = worksheet.Cells[row, 6].Value?.ToString();
                var nguoi = worksheet.Cells[row, 7].Value?.ToString();
                var mst = worksheet.Cells[row, 8].Value?.ToString();
                var ttStr = worksheet.Cells[row, 9].Value?.ToString();

                if (string.IsNullOrWhiteSpace(ten)) continue;
                bool trangThai = ttStr == "1" || ttStr?.ToLower() == "true";

                if (int.TryParse(idStr, out int id) && id > 0)
                {
                    var existing = await _ctx.KhachHangs.FindAsync(id);
                    if (existing != null)
                    {
                        existing.TenKH = ten;
                        existing.Sdt = sdt; existing.Email = email; existing.DiaChi = diaChi;
                        existing.LoaiKH = loai; existing.NguoiLienHe = nguoi; existing.MaSoThue = mst;
                        existing.TrangThai = trangThai; existing.NgayCapNhat = DateTime.UtcNow;
                    }
                }
                else
                {
                    _ctx.KhachHangs.Add(new KhachHang
                    {
                        TenKH = ten, Sdt = sdt, Email = email, DiaChi = diaChi,
                        LoaiKH = loai, NguoiLienHe = nguoi, MaSoThue = mst, TrangThai = trangThai,
                        HangThanhVien = "Đồng", TongChiTieu = 0,
                        NgayTao = DateTime.UtcNow, NgayCapNhat = DateTime.UtcNow
                    });
                }
            }
            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Import successful" });
        }
    }

    public class KhachHangDto
    {
        public string? MaKH { get; set; }
        public string? TenKH { get; set; }
        public string? SDT { get; set; }
        public string? Email { get; set; }
        public string? DiaChi { get; set; }
        public string? LoaiKH { get; set; }
        public string? NguoiLienHe { get; set; }
        public string? MaSoThue { get; set; }
        public DateTime? NgaySinh { get; set; }
        public string? AnhDaiDien { get; set; }
        public string? GioiTinh { get; set; }
        public string? CCCD { get; set; }
        public bool TrangThai { get; set; } = true;
    }
}
