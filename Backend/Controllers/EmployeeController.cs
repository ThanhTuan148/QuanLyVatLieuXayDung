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

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] NhanVienDto dto)
        {
            if (dto == null) return BadRequest();

            if (string.IsNullOrWhiteSpace(dto.TenNV)) 
                return BadRequest(new { message = "Tên nhân viên không được bỏ trống." });

            if (string.IsNullOrWhiteSpace(dto.Sdt))
            {
                return BadRequest(new { message = "Số điện thoại không được bỏ trống." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Sdt.Trim(), @"^[0-9]{10}$"))
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

            var executionStrategy = _ctx.Database.CreateExecutionStrategy();
            try
            {
                return await executionStrategy.ExecuteAsync<IActionResult>(async () =>
                {
                    using var transaction = await _ctx.Database.BeginTransactionAsync();
                    try
                    {
                        int? maTaiKhoan = null;

                        if (dto.MaVaiTro.HasValue && dto.MaVaiTro.Value > 0)
                        {
                            var existingUser = await _ctx.TaiKhoans.FirstOrDefaultAsync(t => t.TenTK == dto.Sdt);
                            if (existingUser != null)
                            {
                                return BadRequest(new { message = "Số điện thoại này đã được sử dụng cho một tài khoản khác." });
                            }

                            if (!string.IsNullOrWhiteSpace(dto.Email))
                            {
                                var existingEmail = await _ctx.TaiKhoans.FirstOrDefaultAsync(t => t.Email == dto.Email);
                                if (existingEmail != null)
                                {
                                    return BadRequest(new { message = "Địa chỉ email này đã được sử dụng cho một tài khoản khác." });
                                }
                            }

                            var tk = new TaiKhoan
                            {
                                TenTK = dto.Sdt,
                                MatKhau = HashPassword("123456"),
                                Email = dto.Email ?? "",
                                MaVaiTro = dto.MaVaiTro.Value,
                                TrangThai = dto.TrangThai,
                                NgayTao = DateTime.UtcNow,
                                NgayCapNhat = DateTime.UtcNow
                            };

                            _ctx.TaiKhoans.Add(tk);
                            await _ctx.SaveChangesAsync();
                            maTaiKhoan = tk.MaTaiKhoan;
                        }

                        string maNV = dto.MaNV;
                        if (string.IsNullOrWhiteSpace(maNV))
                        {
                            var count = await _ctx.NhanViens.CountAsync() + 1;
                            maNV = "NV" + count.ToString("D3");
                        }

                        var nv = new NhanVien
                        {
                            MaNV = maNV,
                            TenNV = dto.TenNV,
                            Sdt = dto.Sdt,
                            Email = dto.Email,
                            DiaChi = dto.DiaChi,
                            TrangThai = dto.TrangThai,
                            SucChuaToiDa = dto.SucChuaToiDa,
                            ChuKy = dto.ChuKy,
                            MaTaiKhoan = maTaiKhoan,
                            NgayTao = DateTime.UtcNow,
                            NgayCapNhat = DateTime.UtcNow
                        };

                        _ctx.NhanViens.Add(nv);
                        await _ctx.SaveChangesAsync();

                        await transaction.CommitAsync();
                        return Ok(new { maNhanVien = nv.MaNhanVien, maNV = nv.MaNV });
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // ─── UPDATE EMPLOYEE ───────────────────────────────────
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] NhanVienDto dto)
        {
            var nv = await _ctx.NhanViens.Include(n => n.TaiKhoan).FirstOrDefaultAsync(n => n.MaNhanVien == id);
            if (nv == null) return NotFound();

            var currentEmpId = GetCurrentEmployeeId();
            if (currentEmpId.HasValue && currentEmpId.Value == id && nv.TrangThai != dto.TrangThai)
            {
                return BadRequest(new { message = "Bạn không thể tự thay đổi trạng thái làm việc của chính mình." });
            }

            if (string.IsNullOrWhiteSpace(dto.TenNV))
            {
                return BadRequest(new { message = "Tên nhân viên không được bỏ trống." });
            }

            if (string.IsNullOrWhiteSpace(dto.Sdt))
            {
                return BadRequest(new { message = "Số điện thoại không được bỏ trống." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Sdt.Trim(), @"^[0-9]{10}$"))
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

            nv.TenNV = dto.TenNV;
            nv.Sdt = dto.Sdt; 
            nv.Email = dto.Email; 
            nv.DiaChi = dto.DiaChi;
            nv.TrangThai = dto.TrangThai; nv.NgayCapNhat = DateTime.UtcNow;
            nv.SucChuaToiDa = dto.SucChuaToiDa;
            nv.ChuKy = dto.ChuKy ?? nv.ChuKy;

            if (nv.TaiKhoan != null)
            {
                nv.TaiKhoan.TrangThai = dto.TrangThai;
                nv.TaiKhoan.Email = !string.IsNullOrWhiteSpace(dto.Email) ? dto.Email : nv.TaiKhoan.Email;
                nv.TaiKhoan.NgayCapNhat = DateTime.UtcNow;
            }

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

        // ─── CREATE ROLE ───────────────────────────────────────
        [HttpPost("roles")]
        public async Task<IActionResult> CreateRole([FromBody] RoleDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.TenVT))
                return BadRequest(new { message = "Tên vai trò không được trống" });

            var vt = new VaiTro
            {
                TenVT = dto.TenVT,
                MoTa = dto.MoTa,
                NgayTao = DateTime.UtcNow,
                NgayCapNhat = DateTime.UtcNow
            };

            _ctx.VaiTros.Add(vt);
            await _ctx.SaveChangesAsync();

            if (dto.MaQuyens != null && dto.MaQuyens.Any())
            {
                foreach (var mq in dto.MaQuyens.Distinct())
                {
                    _ctx.PhanQuyens.Add(new PhanQuyen { MaVaiTro = vt.MaVaiTro, MaQuyen = mq });
                }
                await _ctx.SaveChangesAsync();
            }

            return Ok(new { maVaiTro = vt.MaVaiTro, tenVT = vt.TenVT });
        }

        // ─── UPDATE ROLE ───────────────────────────────────────
        [HttpPut("roles/{id}")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] RoleDto dto)
        {
            var vt = await _ctx.VaiTros.FindAsync(id);
            if (vt == null) return NotFound(new { message = "Không tìm thấy vai trò" });

            vt.TenVT = dto.TenVT ?? vt.TenVT;
            vt.MoTa = dto.MoTa;
            vt.NgayCapNhat = DateTime.UtcNow;

            var oldPerms = _ctx.PhanQuyens.Where(pq => pq.MaVaiTro == id);
            _ctx.PhanQuyens.RemoveRange(oldPerms);

            if (dto.MaQuyens != null && dto.MaQuyens.Any())
            {
                foreach (var mq in dto.MaQuyens.Distinct())
                {
                    _ctx.PhanQuyens.Add(new PhanQuyen { MaVaiTro = id, MaQuyen = mq });
                }
            }

            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Cập nhật vai trò thành công" });
        }

        // ─── DELETE ROLE ───────────────────────────────────────
        [HttpDelete("roles/{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var vt = await _ctx.VaiTros.FindAsync(id);
            if (vt == null) return NotFound(new { message = "Không tìm thấy vai trò" });

            var hasUsers = await _ctx.TaiKhoans.AnyAsync(tk => tk.MaVaiTro == id);
            if (hasUsers)
                return BadRequest(new { message = "Không thể xóa vai trò đang có tài khoản sử dụng." });

            var oldPerms = _ctx.PhanQuyens.Where(pq => pq.MaVaiTro == id);
            _ctx.PhanQuyens.RemoveRange(oldPerms);

            _ctx.VaiTros.Remove(vt);
            await _ctx.SaveChangesAsync();
            return NoContent();
        }

        // ─── GET PERMISSIONS OF A ROLE ──────────────────────────
        [HttpGet("roles/{id}/permissions")]
        public async Task<IActionResult> GetPermissionsOfRole(int id)
        {
            var phanQuyens = await _ctx.PhanQuyens
                .Where(pq => pq.MaVaiTro == id)
                .Select(pq => pq.MaQuyen)
                .ToListAsync();
            return Ok(phanQuyens);
        }

        // ─── CHANGE ROLE for employee's account ────────────────
        [HttpPut("{id}/role")]
        public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleDto dto)
        {
            var nv = await _ctx.NhanViens.Include(n => n.TaiKhoan).FirstOrDefaultAsync(n => n.MaNhanVien == id);
            if (nv == null) return NotFound(new { message = "Không tìm thấy nhân viên" });
            if (nv.TaiKhoan == null) return BadRequest(new { message = "Nhân viên chưa có tài khoản. Tạo tài khoản trước." });

            nv.TaiKhoan.MaVaiTro = dto.MaVaiTro;
            nv.TaiKhoan.NgayCapNhat = DateTime.UtcNow;

            // Clear any custom permissions for this employee so they inherit the new role's permissions
            var customPerms = _ctx.NhanVienModuleQuyens.Where(x => x.MaNhanVien == id);
            if (customPerms.Any())
            {
                _ctx.NhanVienModuleQuyens.RemoveRange(customPerms);
            }

            await _ctx.SaveChangesAsync();
            var role = await _ctx.VaiTros.FindAsync(dto.MaVaiTro);
            return Ok(new { message = $"Đã thay đổi vai trò thành '{role?.TenVT}' và đồng bộ quyền", tenVaiTro = role?.TenVT });
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
        public async Task<IActionResult> GetModulePermissions(int id)
        {
            var nv = await _ctx.NhanViens.Include(n => n.TaiKhoan).FirstOrDefaultAsync(n => n.MaNhanVien == id);
            if (nv == null) return NotFound(new { message = "Không tìm thấy nhân viên" });

            var custom = await _ctx.NhanVienModuleQuyens
                .Where(x => x.MaNhanVien == id)
                .Select(x => new { x.Id, x.Module, x.TenModule, x.CoTheXem, x.CoTheTao, x.CoTheSua, x.CoTheXoa })
                .ToListAsync();

            if (custom.Any()) return Ok(custom);

            // Fallback to role-level module permissions if empty
            if (nv.TaiKhoan != null)
            {
                var rolePerms = await _ctx.VaiTroModuleQuyens
                    .Where(x => x.MaVaiTro == nv.TaiKhoan.MaVaiTro)
                    .Select(x => new { Id = 0, x.Module, x.TenModule, x.CoTheXem, x.CoTheTao, x.CoTheSua, x.CoTheXoa })
                    .ToListAsync();
                
                if (rolePerms.Any()) return Ok(rolePerms);
            }

            return Ok(new List<object>());
        }

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

        // ─── GET ROLE MODULE-LEVEL CRUD PERMISSIONS ───────────
        [HttpGet("roles/{id}/module-permissions")]
        public async Task<IActionResult> GetRoleModulePermissions(int id) =>
            Ok(await _ctx.VaiTroModuleQuyens
                .Where(x => x.MaVaiTro == id)
                .Select(x => new { x.Id, x.Module, x.TenModule, x.CoTheXem, x.CoTheTao, x.CoTheSua, x.CoTheXoa })
                .ToListAsync());

        // ─── SET ROLE MODULE-LEVEL CRUD PERMISSIONS ───────────
        [HttpPut("roles/{id}/module-permissions")]
        public async Task<IActionResult> SetRoleModulePermissions(int id, [FromBody] List<ModuleQuyenDto> dtos)
        {
            if (!await _ctx.VaiTros.AnyAsync(vt => vt.MaVaiTro == id))
                return NotFound(new { message = "Không tìm thấy vai trò" });

            var old = _ctx.VaiTroModuleQuyens.Where(x => x.MaVaiTro == id);
            _ctx.VaiTroModuleQuyens.RemoveRange(old);

            foreach (var dto in dtos ?? new List<ModuleQuyenDto>())
            {
                if (!dto.CoTheXem && !dto.CoTheTao && !dto.CoTheSua && !dto.CoTheXoa) continue;
                _ctx.VaiTroModuleQuyens.Add(new VaiTroModuleQuyen
                {
                    MaVaiTro = id, Module = dto.Module, TenModule = dto.TenModule,
                    CoTheXem = dto.CoTheXem, CoTheTao = dto.CoTheTao,
                    CoTheSua = dto.CoTheSua, CoTheXoa = dto.CoTheXoa,
                    NgayCapNhat = DateTime.UtcNow,
                });
            }

            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Đã lưu phân quyền vai trò" });
        }

        // ─── TOGGLE ACCOUNT STATUS ──────────────────────────────
        [HttpPut("{id}/toggle-status")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var nv = await _ctx.NhanViens.Include(n => n.TaiKhoan).FirstOrDefaultAsync(n => n.MaNhanVien == id);
            if (nv == null) return NotFound();

            var currentEmpId = GetCurrentEmployeeId();
            if (currentEmpId.HasValue && currentEmpId.Value == id)
            {
                return BadRequest(new { message = "Bạn không thể tự thay đổi trạng thái làm việc của chính mình." });
            }

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

        private int? GetCurrentEmployeeId()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer token_")) return null;
            
            var parts = authHeader.Replace("Bearer token_", "").Split('_');
            if (parts.Length > 0 && int.TryParse(parts[0], out int accountId))
            {
                var tk = _ctx.TaiKhoans.Include(t => t.NhanVien).FirstOrDefault(t => t.MaTaiKhoan == accountId);
                return tk?.NhanVien?.MaNhanVien;
            }
            return null;
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
        public int? MaVaiTro { get; set; }
    }

    public class ChangeRoleDto { public int MaVaiTro { get; set; } }
    public class SetPermissionsDto { public List<int>? MaQuyens { get; set; } }
    
    public class RoleDto
    {
        public string? TenVT { get; set; }
        public string? MoTa { get; set; }
        public List<int>? MaQuyens { get; set; }
    }

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
