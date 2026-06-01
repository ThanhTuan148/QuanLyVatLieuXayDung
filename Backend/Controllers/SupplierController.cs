using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/suppliers")]
    public class SupplierController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public SupplierController(ApplicationDbContext ctx) { _ctx = ctx; }

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _ctx.NhaCungCaps.Select(n => new
            {
                maNhaCungCap = n.MaNhaCungCap, maNCC = n.MaNCC, tenNCC = n.TenNCC,
                nguoiLienHe = n.NguoiLienHe, sdt = n.Sdt, email = n.Email,
                diaChi = n.DiaChi, thanhPho = n.ThanhPho, maSoThue = n.MaSoThue,
                trangThai = n.TrangThai, ngayTao = n.NgayTao
            }).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var n = await _ctx.NhaCungCaps.FindAsync(id);
            return n == null ? NotFound() : Ok(n);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] NhaCungCapDto dto)
        {
            if (dto == null) return BadRequest();

            if (string.IsNullOrWhiteSpace(dto.TenNCC))
            {
                return BadRequest(new { message = "Tên nhà cung cấp không được bỏ trống." });
            }

            if (string.IsNullOrWhiteSpace(dto.NguoiLienHe))
            {
                return BadRequest(new { message = "Người liên hệ không được bỏ trống." });
            }

            if (string.IsNullOrWhiteSpace(dto.SDT))
            {
                return BadRequest(new { message = "Số điện thoại không được bỏ trống." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.SDT.Trim(), @"^[0-9]{10}$"))
            {
                return BadRequest(new { message = "Số điện thoại phải có đúng 10 chữ số." });
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Email không được bỏ trống." });
            }

            if (!dto.Email.Contains("@") || !System.Text.RegularExpressions.Regex.IsMatch(dto.Email.Trim(), @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
            {
                return BadRequest(new { message = "Email không đúng định dạng (phải chứa ký tự @ và tên miền)." });
            }

            if (string.IsNullOrWhiteSpace(dto.DiaChi))
            {
                return BadRequest(new { message = "Địa chỉ không được bỏ trống." });
            }

            var ncc = new NhaCungCap
            {
                TenNCC = dto.TenNCC,
                NguoiLienHe = dto.NguoiLienHe, Sdt = dto.SDT, Email = dto.Email,
                DiaChi = dto.DiaChi, ThanhPho = dto.ThanhPho, MaSoThue = dto.MaSoThue,
                TrangThai = dto.TrangThai, NgayTao = DateTime.UtcNow, NgayCapNhat = DateTime.UtcNow,
            };
            _ctx.NhaCungCaps.Add(ncc);
            try { await _ctx.SaveChangesAsync(); return Ok(ncc); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message }); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] NhaCungCapDto dto)
        {
            var ncc = await _ctx.NhaCungCaps.FindAsync(id);
            if (ncc == null) return NotFound();

            if (string.IsNullOrWhiteSpace(dto.TenNCC))
            {
                return BadRequest(new { message = "Tên nhà cung cấp không được bỏ trống." });
            }

            if (string.IsNullOrWhiteSpace(dto.NguoiLienHe))
            {
                return BadRequest(new { message = "Người liên hệ không được bỏ trống." });
            }

            if (string.IsNullOrWhiteSpace(dto.SDT))
            {
                return BadRequest(new { message = "Số điện thoại không được bỏ trống." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.SDT.Trim(), @"^[0-9]{10}$"))
            {
                return BadRequest(new { message = "Số điện thoại phải có đúng 10 chữ số." });
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Email không được bỏ trống." });
            }

            if (!dto.Email.Contains("@") || !System.Text.RegularExpressions.Regex.IsMatch(dto.Email.Trim(), @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
            {
                return BadRequest(new { message = "Email không đúng định dạng (phải chứa ký tự @ và tên miền)." });
            }

            if (string.IsNullOrWhiteSpace(dto.DiaChi))
            {
                return BadRequest(new { message = "Địa chỉ không được bỏ trống." });
            }

            ncc.TenNCC = dto.TenNCC;
            ncc.NguoiLienHe = dto.NguoiLienHe; ncc.Sdt = dto.SDT; ncc.Email = dto.Email;
            ncc.DiaChi = dto.DiaChi; ncc.ThanhPho = dto.ThanhPho; ncc.MaSoThue = dto.MaSoThue;
            ncc.TrangThai = dto.TrangThai; ncc.NgayCapNhat = DateTime.UtcNow;
            try { await _ctx.SaveChangesAsync(); return Ok(ncc); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message }); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ncc = await _ctx.NhaCungCaps.FindAsync(id);
            if (ncc == null) return NotFound();
            _ctx.NhaCungCaps.Remove(ncc);
            await _ctx.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("export")]
        public async Task<IActionResult> Export()
        {
            var list = await _ctx.NhaCungCaps.ToListAsync();
            using var package = new OfficeOpenXml.ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("NhaCungCap");
            worksheet.Cells[1, 1].Value = "Id (Bỏ qua khi import mới)";
            worksheet.Cells[1, 2].Value = "Tên NCC";
            worksheet.Cells[1, 3].Value = "Người Liên Hệ";
            worksheet.Cells[1, 4].Value = "SĐT";
            worksheet.Cells[1, 5].Value = "Email";
            worksheet.Cells[1, 6].Value = "Địa Chỉ";
            worksheet.Cells[1, 7].Value = "Thành Phố";
            worksheet.Cells[1, 8].Value = "Mã Số Thuế";
            worksheet.Cells[1, 9].Value = "Trạng Thái (1/0)";
            worksheet.Cells["A1:I1"].Style.Font.Bold = true;

            for (int i = 0; i < list.Count; i++)
            {
                var item = list[i];
                worksheet.Cells[i + 2, 1].Value = item.MaNhaCungCap;
                worksheet.Cells[i + 2, 2].Value = item.TenNCC;
                worksheet.Cells[i + 2, 3].Value = item.NguoiLienHe;
                worksheet.Cells[i + 2, 4].Value = item.Sdt;
                worksheet.Cells[i + 2, 5].Value = item.Email;
                worksheet.Cells[i + 2, 6].Value = item.DiaChi;
                worksheet.Cells[i + 2, 7].Value = item.ThanhPho;
                worksheet.Cells[i + 2, 8].Value = item.MaSoThue;
                worksheet.Cells[i + 2, 9].Value = item.TrangThai ? 1 : 0;
            }

            var stream = new MemoryStream();
            package.SaveAs(stream);
            stream.Position = 0;
            return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"NhaCungCap_{DateTime.Now:yyyyMMddHHmmss}.xlsx");
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
                var nguoi = worksheet.Cells[row, 3].Value?.ToString();
                var sdt = worksheet.Cells[row, 4].Value?.ToString();
                var email = worksheet.Cells[row, 5].Value?.ToString();
                var diaChi = worksheet.Cells[row, 6].Value?.ToString();
                var tp = worksheet.Cells[row, 7].Value?.ToString();
                var mst = worksheet.Cells[row, 8].Value?.ToString();
                var ttStr = worksheet.Cells[row, 9].Value?.ToString();

                if (string.IsNullOrWhiteSpace(ten)) continue;
                bool trangThai = ttStr == "1" || ttStr?.ToLower() == "true";

                if (int.TryParse(idStr, out int id) && id > 0)
                {
                    var existing = await _ctx.NhaCungCaps.FindAsync(id);
                    if (existing != null)
                    {
                        existing.TenNCC = ten;
                        existing.NguoiLienHe = nguoi; existing.Sdt = sdt; existing.Email = email;
                        existing.DiaChi = diaChi; existing.ThanhPho = tp; existing.MaSoThue = mst;
                        existing.TrangThai = trangThai; existing.NgayCapNhat = DateTime.UtcNow;
                    }
                }
                else
                {
                    _ctx.NhaCungCaps.Add(new NhaCungCap
                    {
                        TenNCC = ten, NguoiLienHe = nguoi, Sdt = sdt, Email = email,
                        DiaChi = diaChi, ThanhPho = tp, MaSoThue = mst, TrangThai = trangThai,
                        NgayTao = DateTime.UtcNow, NgayCapNhat = DateTime.UtcNow
                    });
                }
            }
            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Import successful" });
        }
    }

    public class NhaCungCapDto
    {
        public string? MaNCC { get; set; }
        public string? TenNCC { get; set; }
        public string? NguoiLienHe { get; set; }
        public string? SDT { get; set; }
        public string? Email { get; set; }
        public string? DiaChi { get; set; }
        public string? ThanhPho { get; set; }
        public string? MaSoThue { get; set; }
        public bool TrangThai { get; set; } = true;
    }
}
