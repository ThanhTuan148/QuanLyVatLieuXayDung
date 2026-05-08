using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/categories")]
    public class CategoryController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public CategoryController(ApplicationDbContext ctx) { _ctx = ctx; }

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _ctx.LoaiSanPhams.Select(l => new
            {
                maLoaiSanPham = l.MaLoaiSP, maLoai = l.MaLoai, tenLoai = l.TenLoai,
                moTa = l.MoTa, hinhAnh = l.HinhAnh, soSanPham = l.SanPhams.Count
            }).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var l = await _ctx.LoaiSanPhams.FindAsync(id);
            return l == null ? NotFound() : Ok(l);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] LoaiSanPhamDto dto)
        {
            if (dto == null) return BadRequest();
            var lsp = new LoaiSanPham { TenLoai = dto.TenLoai ?? "", MoTa = dto.MoTa, HinhAnh = dto.HinhAnh, NgayTao = DateTime.UtcNow, NgayCapNhat = DateTime.UtcNow };
            _ctx.LoaiSanPhams.Add(lsp);
            try { await _ctx.SaveChangesAsync(); return Ok(lsp); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message }); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] LoaiSanPhamDto dto)
        {
            var lsp = await _ctx.LoaiSanPhams.FindAsync(id);
            if (lsp == null) return NotFound();
            lsp.TenLoai = dto.TenLoai ?? lsp.TenLoai;
            lsp.MoTa = dto.MoTa; lsp.HinhAnh = dto.HinhAnh; lsp.NgayCapNhat = DateTime.UtcNow;
            try { await _ctx.SaveChangesAsync(); return Ok(lsp); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message }); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var lsp = await _ctx.LoaiSanPhams.FindAsync(id);
            if (lsp == null) return NotFound();
            _ctx.LoaiSanPhams.Remove(lsp);
            await _ctx.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("export")]
        public async Task<IActionResult> Export()
        {
            var categories = await _ctx.LoaiSanPhams.ToListAsync();
            using var package = new OfficeOpenXml.ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("LoaiSanPham");
            worksheet.Cells[1, 1].Value = "Id (Bỏ qua khi import mới)";
            worksheet.Cells[1, 2].Value = "Tên Loại";
            worksheet.Cells[1, 3].Value = "Hình Ảnh URL";
            worksheet.Cells[1, 4].Value = "Mô Tả";
            worksheet.Cells["A1:D1"].Style.Font.Bold = true;

            for (int i = 0; i < categories.Count; i++)
            {
                var item = categories[i];
                worksheet.Cells[i + 2, 1].Value = item.MaLoaiSP;
                worksheet.Cells[i + 2, 2].Value = item.TenLoai;
                worksheet.Cells[i + 2, 3].Value = item.HinhAnh;
                worksheet.Cells[i + 2, 4].Value = item.MoTa;
            }

            var stream = new MemoryStream();
            package.SaveAs(stream);
            stream.Position = 0;
            string excelName = $"LoaiSanPham_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
            return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelName);
        }

        [HttpPost("import")]
        public async Task<IActionResult> Import(IFormFile file)
        {
            if (file == null || file.Length <= 0) return BadRequest("No file uploaded");
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            using var package = new OfficeOpenXml.ExcelPackage(stream);
            var worksheet = package.Workbook.Worksheets.FirstOrDefault();
            if (worksheet == null) return BadRequest("No worksheet found");

            var rowCount = worksheet.Dimension?.Rows ?? 0;
            for (int row = 2; row <= rowCount; row++)
            {
                var idStr = worksheet.Cells[row, 1].Value?.ToString();
                var tenLoai = worksheet.Cells[row, 2].Value?.ToString();
                var hinhAnh = worksheet.Cells[row, 3].Value?.ToString();
                var moTa = worksheet.Cells[row, 4].Value?.ToString();

                if (string.IsNullOrWhiteSpace(tenLoai)) continue;

                if (int.TryParse(idStr, out int id) && id > 0)
                {
                    var existing = await _ctx.LoaiSanPhams.FindAsync(id);
                    if (existing != null)
                    {
                        existing.TenLoai = tenLoai;
                        existing.HinhAnh = hinhAnh;
                        existing.MoTa = moTa;
                        existing.NgayCapNhat = DateTime.UtcNow;
                    }
                }
                else
                {
                    _ctx.LoaiSanPhams.Add(new LoaiSanPham
                    {
                        TenLoai = tenLoai,
                        HinhAnh = hinhAnh,
                        MoTa = moTa,
                        NgayTao = DateTime.UtcNow,
                        NgayCapNhat = DateTime.UtcNow
                    });
                }
            }
            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Import successful" });
        }
    }

    public class LoaiSanPhamDto
    {
        public string? MaLoai { get; set; }
        public string? TenLoai { get; set; }
        public string? MoTa { get; set; }
        public string? HinhAnh { get; set; }
    }
}
