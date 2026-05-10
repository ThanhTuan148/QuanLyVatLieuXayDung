using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/employees")]
    public class EmployeeController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public EmployeeController(ApplicationDbContext ctx) { _ctx = ctx; }

        // ─── GET ALL EMPLOYEES ────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _ctx.NhanViens
                .Include(nv => nv.TaiKhoan).ThenInclude(tk => tk != null ? tk.VaiTro : null)
                .OrderBy(nv => nv.TenNV)
                .Select(nv => new
                {
                    maNhanVien = nv.MaNhanVien, maNV = nv.MaNV, tenNV = nv.TenNV,
                    sdt = nv.Sdt, email = nv.Email, diaChi = nv.DiaChi,
                    trangThai = nv.TrangThai, ngayTao = nv.NgayTao,
                    sucChuaToiDa = nv.SucChuaToiDa,
                    maTaiKhoan = nv.MaTaiKhoan,
                    tenTK = nv.TaiKhoan != null ? nv.TaiKhoan.TenTK : "",
                    emailTK = nv.TaiKhoan != null ? nv.TaiKhoan.Email : "",
                    maVaiTro = nv.TaiKhoan != null ? nv.TaiKhoan.MaVaiTro : 0,
                    tenVaiTro = nv.TaiKhoan != null && nv.TaiKhoan.VaiTro != null ? nv.TaiKhoan.VaiTro.TenVT : "Chưa cấp",
                    trangThaiTK = nv.TaiKhoan != null ? nv.TaiKhoan.TrangThai : false,
                    dangNhapCuoi = nv.TaiKhoan != null ? nv.TaiKhoan.DangNhapCuoi : null,
                }).ToListAsync());

        // ─── GET BY ID ─────────────────────────────────────────
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var nv = await _ctx.NhanViens.Include(n => n.TaiKhoan).ThenInclude(tk => tk != null ? tk.VaiTro : null).FirstOrDefaultAsync(n => n.MaNhanVien == id);
            return nv == null ? NotFound() : Ok(nv);
        }

        // ─── CREATE EMPLOYEE ───────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] NhanVienDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.TenNV)) return BadRequest(new { message = "Tên nhân viên không được trống" });
            var nv = new NhanVien
            {
                TenNV = dto.TenNV, Sdt = dto.Sdt, Email = dto.Email, DiaChi = dto.DiaChi,
                TrangThai = dto.TrangThai, NgayTao = DateTime.UtcNow, NgayCapNhat = DateTime.UtcNow,
                SucChuaToiDa = dto.SucChuaToiDa,
                ChuKy = dto.ChuKy
            };
            _ctx.NhanViens.Add(nv);
            try { await _ctx.SaveChangesAsync(); return Ok(new { maNhanVien = nv.MaNhanVien }); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message }); }
        }

        // ─── UPDATE EMPLOYEE ───────────────────────────────────
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] NhanVienDto dto)
        {
            var nv = await _ctx.NhanViens.FindAsync(id);
            if (nv == null) return NotFound();
            nv.TenNV = dto.TenNV ?? nv.TenNV;
            nv.Sdt = dto.Sdt; nv.Email = dto.Email; nv.DiaChi = dto.DiaChi;
            nv.TrangThai = dto.TrangThai; nv.NgayCapNhat = DateTime.UtcNow;
            nv.SucChuaToiDa = dto.SucChuaToiDa;
            nv.ChuKy = dto.ChuKy ?? nv.ChuKy;
            try { await _ctx.SaveChangesAsync(); return Ok(nv); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message }); }
        }

        // ─── DELETE ────────────────────────────────────────────
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var nv = await _ctx.NhanViens.FindAsync(id);
            if (nv == null) return NotFound();
            _ctx.NhanViens.Remove(nv);
            await _ctx.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("export")]
        public async Task<IActionResult> Export()
        {
            var list = await _ctx.NhanViens.ToListAsync();
            using var package = new OfficeOpenXml.ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("NhanVien");
            worksheet.Cells[1, 1].Value = "Id (Bỏ qua khi import mới)";
            worksheet.Cells[1, 2].Value = "Tên NV";
            worksheet.Cells[1, 3].Value = "SĐT";
            worksheet.Cells[1, 4].Value = "Email";
            worksheet.Cells[1, 5].Value = "Địa Chỉ";
            worksheet.Cells[1, 6].Value = "Trạng Thái (1/0)";
            worksheet.Cells["A1:F1"].Style.Font.Bold = true;

            for (int i = 0; i < list.Count; i++)
            {
                var item = list[i];
                worksheet.Cells[i + 2, 1].Value = item.MaNhanVien;
                worksheet.Cells[i + 2, 2].Value = item.TenNV;
                worksheet.Cells[i + 2, 3].Value = item.Sdt;
                worksheet.Cells[i + 2, 4].Value = item.Email;
                worksheet.Cells[i + 2, 5].Value = item.DiaChi;
                worksheet.Cells[i + 2, 6].Value = item.TrangThai ? 1 : 0;
            }

            var stream = new MemoryStream();
            package.SaveAs(stream);
            stream.Position = 0;
            return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"NhanVien_{DateTime.Now:yyyyMMddHHmmss}.xlsx");
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
                var ttStr = worksheet.Cells[row, 6].Value?.ToString();

                if (string.IsNullOrWhiteSpace(ten)) continue;
                bool trangThai = ttStr == "1" || ttStr?.ToLower() == "true";

                if (int.TryParse(idStr, out int id) && id > 0)
                {
                    var existing = await _ctx.NhanViens.FindAsync(id);
                    if (existing != null)
                    {
                        existing.TenNV = ten;
                        existing.Sdt = sdt; existing.Email = email; existing.DiaChi = diaChi;
                        existing.TrangThai = trangThai; existing.NgayCapNhat = DateTime.UtcNow;
                    }
                }
                else
                {
                    _ctx.NhanViens.Add(new NhanVien
                    {
                        TenNV = ten, Sdt = sdt, Email = email, DiaChi = diaChi,
                        TrangThai = trangThai, NgayTao = DateTime.UtcNow, NgayCapNhat = DateTime.UtcNow
                    });
                }
            }
            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Import successful" });
        }

        // ─── GET ALL ROLES ─────────────────────────────────────
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles() =>
            Ok(await _ctx.VaiTros.Select(v => new { maVaiTro = v.MaVaiTro, maVT = v.MaVT, tenVT = v.TenVT, moTa = v.MoTa }).ToListAsync());

        // ─── CHANGE ROLE for employee's account ────────────────
        [HttpPut("{id}/role")]
        public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleDto dto)
        {
            var nv = await _ctx.NhanViens.Include(n => n.TaiKhoan).FirstOrDefaultAsync(n => n.MaNhanVien == id);
            if (nv == null) return NotFound(new { message = "Không tìm thấy nhân viên" });
            if (nv.TaiKhoan == null) return BadRequest(new { message = "Nhân viên chưa có tài khoản. Tạo tài khoản trước." });

            nv.TaiKhoan.MaVaiTro = dto.MaVaiTro;
            nv.TaiKhoan.NgayCapNhat = DateTime.UtcNow;
            await _ctx.SaveChangesAsync();
            var role = await _ctx.VaiTros.FindAsync(dto.MaVaiTro);
            return Ok(new { message = $"Đã nâng quyền lên '{role?.TenVT}'", tenVaiTro = role?.TenVT });
        }

        // ─── GET ALL PERMISSIONS ────────────────────────────────
        [HttpGet("permissions")]
        public async Task<IActionResult> GetPermissions() =>
            Ok(await _ctx.Quyens.Select(q => new { maQuyen = q.MaQuyen, maQ = q.MaQ, tenQ = q.TenQ, moTa = q.MoTa }).ToListAsync());

        // ─── GET PERMISSIONS OF A ROLE ──────────────────────────
        [HttpGet("{id}/permissions")]
        public async Task<IActionResult> GetRolePermissions(int id)
        {
            var nv = await _ctx.NhanViens.Include(n => n.TaiKhoan).FirstOrDefaultAsync(n => n.MaNhanVien == id);
            if (nv?.TaiKhoan == null) return Ok(new List<object>());

            var phanQuyens = await _ctx.PhanQuyens
                .Include(pq => pq.Quyen)
                .Where(pq => pq.MaVaiTro == nv.TaiKhoan.MaVaiTro)
                .Select(pq => new { maQuyen = pq.MaQuyen, tenQ = pq.Quyen.TenQ, maQ = pq.Quyen.MaQ })
                .ToListAsync();
            return Ok(phanQuyens);
        }

        // ─── SET PERMISSIONS FOR ROLE ───────────────────────────
        // Sets permissions for the role that this employee belongs to
        [HttpPut("{id}/permissions")]
        public async Task<IActionResult> SetPermissions(int id, [FromBody] SetPermissionsDto dto)
        {
            var nv = await _ctx.NhanViens.Include(n => n.TaiKhoan).FirstOrDefaultAsync(n => n.MaNhanVien == id);
            if (nv?.TaiKhoan == null) return BadRequest(new { message = "Nhân viên chưa có tài khoản" });

            int maVaiTro = nv.TaiKhoan.MaVaiTro;

            // Remove old permissions for this role
            var oldPerms = _ctx.PhanQuyens.Where(pq => pq.MaVaiTro == maVaiTro);
            _ctx.PhanQuyens.RemoveRange(oldPerms);

            // Add new permissions
            if (dto.MaQuyens != null && dto.MaQuyens.Any())
            {
                foreach (var mq in dto.MaQuyens.Distinct())
                {
                    _ctx.PhanQuyens.Add(new PhanQuyen { MaVaiTro = maVaiTro, MaQuyen = mq });
                }
            }

            await _ctx.SaveChangesAsync();
            return Ok(new { message = $"Đã cập nhật {dto.MaQuyens?.Count ?? 0} quyền cho vai trò này" });
        }

        // ─── GET MODULE-LEVEL CRUD PERMISSIONS ─────────────────
        [HttpGet("{id}/module-permissions")]
        public async Task<IActionResult> GetModulePermissions(int id) =>
            Ok(await _ctx.NhanVienModuleQuyens
                .Where(x => x.MaNhanVien == id)
                .Select(x => new { x.Id, x.Module, x.TenModule, x.CoTheXem, x.CoTheTao, x.CoTheSua, x.CoTheXoa })
                .ToListAsync());

        // ─── SET MODULE-LEVEL CRUD PERMISSIONS ─────────────────
        [HttpPut("{id}/module-permissions")]
        public async Task<IActionResult> SetModulePermissions(int id, [FromBody] List<ModuleQuyenDto> dtos)
        {
            if (!await _ctx.NhanViens.AnyAsync(n => n.MaNhanVien == id))
                return NotFound(new { message = "Không tìm thấy nhân viên" });

            // Replace all existing module permissions for this employee
            var old = _ctx.NhanVienModuleQuyens.Where(x => x.MaNhanVien == id);
            _ctx.NhanVienModuleQuyens.RemoveRange(old);

            foreach (var dto in dtos ?? new List<ModuleQuyenDto>())
            {
                // Only save if at least one permission is granted
                if (!dto.CoTheXem && !dto.CoTheTao && !dto.CoTheSua && !dto.CoTheXoa) continue;
                _ctx.NhanVienModuleQuyens.Add(new NhanVienModuleQuyen
                {
                    MaNhanVien = id, Module = dto.Module, TenModule = dto.TenModule,
                    CoTheXem = dto.CoTheXem, CoTheTao = dto.CoTheTao,
                    CoTheSua = dto.CoTheSua, CoTheXoa = dto.CoTheXoa,
                    NgayCapNhat = DateTime.UtcNow,
                });
            }

            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Đã lưu phân quyền danh mục" });
        }

        // ─── TOGGLE ACCOUNT STATUS ──────────────────────────────
        [HttpPut("{id}/toggle-status")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var nv = await _ctx.NhanViens.Include(n => n.TaiKhoan).FirstOrDefaultAsync(n => n.MaNhanVien == id);
            if (nv == null) return NotFound();
            nv.TrangThai = !nv.TrangThai;
            if (nv.TaiKhoan != null) nv.TaiKhoan.TrangThai = nv.TrangThai;
            nv.NgayCapNhat = DateTime.UtcNow;
            await _ctx.SaveChangesAsync();
            return Ok(new { trangThai = nv.TrangThai });
        }

        // ─── CREATE ACCOUNT FOR EMPLOYEE ───────────────────────
        [HttpPost("{id}/create-account")]
        public async Task<IActionResult> CreateAccount(int id, [FromBody] CreateAccountDto dto)
        {
            var nv = await _ctx.NhanViens.Include(n => n.TaiKhoan).FirstOrDefaultAsync(n => n.MaNhanVien == id);
            if (nv == null) return NotFound();
            if (nv.TaiKhoan != null) return BadRequest(new { message = "Nhân viên đã có tài khoản" });

            // Check username exists
            var exists = await _ctx.TaiKhoans.AnyAsync(tk => tk.TenTK == dto.TenTK);
            if (exists) return BadRequest(new { message = "Tên tài khoản đã tồn tại" });

            var tk = new TaiKhoan
            {
                TenTK = dto.TenTK,
                MatKhau = HashPassword(dto.MatKhau ?? "123456"),
                Email = dto.Email ?? nv.Email ?? "", MaVaiTro = dto.MaVaiTro,
                TrangThai = true, NgayTao = DateTime.UtcNow, NgayCapNhat = DateTime.UtcNow,
            };
            _ctx.TaiKhoans.Add(tk);
            await _ctx.SaveChangesAsync();

            nv.MaTaiKhoan = tk.MaTaiKhoan;
            await _ctx.SaveChangesAsync();

            return Ok(new { message = "Tạo tài khoản thành công", maTaiKhoan = tk.MaTaiKhoan });
        }

        private static string HashPassword(string password)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }
    }

    // ─── DTOs ──────────────────────────────────────────────────
    public class NhanVienDto
    {
        public string? MaNV { get; set; }
        public string? TenNV { get; set; }
        public string? Sdt { get; set; }
        public string? Email { get; set; }
        public string? DiaChi { get; set; }
        public bool TrangThai { get; set; } = true;
        public string? SucChuaToiDa { get; set; }
        public string? ChuKy { get; set; }
    }

    public class ChangeRoleDto { public int MaVaiTro { get; set; } }
    public class SetPermissionsDto { public List<int>? MaQuyens { get; set; } }

    public class CreateAccountDto
    {
        public string? TenTK { get; set; }
        public string? MatKhau { get; set; }
        public string? Email { get; set; }
        public int MaVaiTro { get; set; }
    }

    public class ModuleQuyenDto
    {
        public string Module { get; set; } = "";
        public string TenModule { get; set; } = "";
        public bool CoTheXem { get; set; }
        public bool CoTheTao { get; set; }
        public bool CoTheSua { get; set; }
        public bool CoTheXoa { get; set; }
    }
}
