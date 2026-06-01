using System.Net;
using System.Net.Mail;
using BuildingMaterialAPI.Models;
using BuildingMaterialAPI.DTOs;
using BuildingMaterialAPI.Services;
using BuildingMaterialAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ApplicationDbContext _ctx;
        private readonly IConfiguration _config;

        public AuthController(IAuthService authService, ApplicationDbContext ctx, IConfiguration config)
        {
            _authService = authService;
            _ctx = ctx;
            _config = config;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                if (loginDto == null || string.IsNullOrEmpty(loginDto.Username) || string.IsNullOrEmpty(loginDto.Password))
                    return BadRequest(new { message = "Username and password are required" });

                var taiKhoan = await _authService.AuthenticateAsync(loginDto.Username, loginDto.Password);
                
                if (taiKhoan == null)
                    return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không chính xác" });

                if (taiKhoan.TrangThai == false)
                    return Unauthorized(new { message = "Tài khoản của bạn đã bị khóa." });

                var nhanVien = taiKhoan.NhanVien;
                var khachHang = taiKhoan.KhachHang;

                if (khachHang != null && khachHang.TrangThai == false)
                    return Unauthorized(new { message = "Tài khoản khách hàng này đã ngưng hoạt động." });

                if (nhanVien != null && nhanVien.TrangThai == false)
                    return Unauthorized(new { message = "Tài khoản nhân viên này đã ngưng hoạt động." });

                var fullName = nhanVien?.TenNV ?? khachHang?.TenKH ?? taiKhoan.TenTK;
                var phoneNumber = nhanVien?.Sdt ?? khachHang?.Sdt;

                // Update last login
                taiKhoan.DangNhapCuoi = DateTime.UtcNow;
                await _ctx.SaveChangesAsync();

                // ─── XÁC ĐỊNH DANH SÁCH MODULE ĐƯỢC PHÉP TRUY CẬP (ALLOWED MODULES) ───
                var allowedModules = new List<string>();
                var roleName = taiKhoan.VaiTro?.TenVT ?? "Unknown";

                // 1. Gán các module mặc định theo vai trò gốc
                bool isAdminRole = roleName.ToLower().Contains("admin") || roleName.ToLower().Contains("quản trị");
                if (isAdminRole)
                {
                    // Admin chỉ được phép truy cập: Khách hàng, Nhân viên, Cài đặt
                    allowedModules.AddRange(new[] { "CUSTOMERS", "EMPLOYEES", "SETTINGS", "BACKUP_RESTORE" });
                }
                else if (roleName.ToLower().Contains("quản lý") || roleName.ToLower() == "manager")
                {
                    allowedModules.AddRange(new[] { "DASHBOARD", "PRODUCTS", "ORDERS", "CUSTOMERS", "SUPPLIERS", "PROMOTIONS", "STOCK_ORDERS", "RETURNS", "INVENTORY", "PRICE_HISTORY", "DELIVERIES", "DEBTS", "REPORTS", "EMPLOYEES", "CHAT" });
                }
                else if (roleName.ToLower().Contains("bán hàng") || roleName.ToLower() == "sales")
                {
                    allowedModules.AddRange(new[] { "PRODUCTS", "ORDERS", "CUSTOMERS", "PROMOTIONS", "CHAT" });
                }
                else if (roleName.ToLower().Contains("kho") || roleName.ToLower() == "warehouse")
                {
                    allowedModules.AddRange(new[] { "PRODUCTS", "STOCK_ORDERS", "INVENTORY", "RETURNS" });
                }
                else if (roleName.ToLower().Contains("tài xế") || roleName.ToLower() == "driver")
                {
                    allowedModules.AddRange(new[] { "DELIVERIES" });
                }
                else // Khách hàng hoặc Role khác
                {
                    allowedModules.AddRange(new[] { "PRODUCTS", "ORDERS", "CHAT" });
                }

                // 2. Gộp thêm các module được phân quyền động riêng cho nhân viên từ NhanVienModuleQuyen
                var modulePermissions = new Dictionary<string, ModuleQuyenDto>();
                var defaultAllModules = new[] { "DASHBOARD", "PRODUCTS", "ORDERS", "CUSTOMERS", "SUPPLIERS", "PROMOTIONS", "STOCK_ORDERS", "RETURNS", "INVENTORY", "PRICE_HISTORY", "DELIVERIES", "DEBTS", "REPORTS", "EMPLOYEES", "CHAT" };
                bool isManagerOrAdmin = roleName.ToLower().Contains("quản lý") || roleName.ToLower() == "manager" || roleName.ToLower().Contains("admin") || roleName.ToLower().Contains("quản trị");

                foreach (var m in defaultAllModules)
                {
                    bool canView = isManagerOrAdmin || allowedModules.Contains(m);
                    bool canCrud = isManagerOrAdmin;

                    // Admin không được xem/thao tác các module nghiệp vụ ngoài danh sách cho phép
                    if (isAdminRole && m != "CUSTOMERS" && m != "EMPLOYEES")
                    {
                        canView = false;
                        canCrud = false;
                    }

                    if (roleName.ToLower().Contains("bán hàng") || roleName.ToLower() == "sales")
                    {
                        if (m == "ORDERS" || m == "CUSTOMERS" || m == "PRODUCTS") canCrud = true;
                    }
                    else if (roleName.ToLower().Contains("thủ kho") || roleName.ToLower() == "warehouse")
                    {
                        if (m == "STOCK_ORDERS" || m == "RETURNS" || m == "INVENTORY" || m == "PRODUCTS") canCrud = true;
                    }

                    modulePermissions[m] = new ModuleQuyenDto
                    {
                        Module = m, TenModule = m, CoTheXem = canView, CoTheTao = canCrud, CoTheSua = canCrud, CoTheXoa = canCrud
                    };
                }

                if (nhanVien != null)
                {
                    var customPerms = await _ctx.NhanVienModuleQuyens
                        .Where(q => q.MaNhanVien == nhanVien.MaNhanVien)
                        .ToListAsync();

                    var activePerms = customPerms;
                    if (!customPerms.Any())
                    {
                        var rolePerms = await _ctx.VaiTroModuleQuyens
                            .Where(q => q.MaVaiTro == taiKhoan.MaVaiTro)
                            .ToListAsync();
                        activePerms = rolePerms.Select(p => new NhanVienModuleQuyen
                        {
                            Module = p.Module, TenModule = p.TenModule,
                            CoTheXem = p.CoTheXem, CoTheTao = p.CoTheTao,
                            CoTheSua = p.CoTheSua, CoTheXoa = p.CoTheXoa
                        }).ToList();
                    }

                    foreach (var p in activePerms)
                    {
                        var upperModule = p.Module.ToUpper();
                        
                        modulePermissions[upperModule] = new ModuleQuyenDto
                        {
                            Module = p.Module, TenModule = p.TenModule, CoTheXem = p.CoTheXem, CoTheTao = p.CoTheTao, CoTheSua = p.CoTheSua, CoTheXoa = p.CoTheXoa
                        };

                        if (p.CoTheXem)
                        {
                            if (!allowedModules.Contains(p.Module)) allowedModules.Add(p.Module);
                            if (!allowedModules.Contains(upperModule)) allowedModules.Add(upperModule);
                        }
                        else
                        {
                            allowedModules.Remove(p.Module);
                            allowedModules.Remove(upperModule);
                        }
                    }
                }

                var response = new LoginResponseDto
                {
                    Id = taiKhoan.MaTaiKhoan,
                    EmployeeId = nhanVien?.MaNhanVien,
                    Username = taiKhoan.TenTK,
                    Email = taiKhoan.Email,
                    FullName = fullName,
                    PhoneNumber = phoneNumber,
                    RoleName = roleName,
                    IsActive = taiKhoan.TrangThai,
                    MaKhachHang = taiKhoan.KhachHang?.MaKhachHang,
                    ChuKy = nhanVien?.ChuKy,
                    AllowedModules = allowedModules,
                    ModulePermissions = modulePermissions
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrEmpty(dto.Username) || string.IsNullOrEmpty(dto.Password) || string.IsNullOrEmpty(dto.Email))
                    return BadRequest(new { message = "Username, password and email are required." });

                // Kiểm tra trùng username hoặc email
                var existingUser = await _ctx.TaiKhoans.FirstOrDefaultAsync(t => t.TenTK == dto.Username || t.Email == dto.Email);
                if (existingUser != null)
                {
                    if (existingUser.TenTK == dto.Username)
                        return BadRequest(new { message = "Tên đăng nhập đã tồn tại." });
                    else
                        return BadRequest(new { message = "Email này đã được sử dụng. Nếu bạn đã từng đăng nhập bằng Google/GitHub, hãy tiếp tục dùng phương thức đó hoặc chọn 'Quên mật khẩu' để tạo mật khẩu đăng nhập trực tiếp." });
                }

                // Tìm VaiTro "Khách hàng" (thường tên vai trò có thể là Khách hàng)
                var vaiTroKH = await _ctx.VaiTros.FirstOrDefaultAsync(v => v.TenVT.ToLower().Contains("khách hàng") || v.TenVT.ToLower() == "customer");
                if (vaiTroKH == null)
                    return BadRequest(new { message = "Không tìm thấy vai trò Khách hàng trong hệ thống." });

                var taiKhoan = new TaiKhoan
                {
                    TenTK = dto.Username,
                    MatKhau = _authService.HashPassword(dto.Password),
                    Email = dto.Email,
                    MaVaiTro = vaiTroKH.MaVaiTro,
                    TrangThai = true,
                    NgayTao = DateTime.UtcNow,
                    NgayCapNhat = DateTime.UtcNow
                };

                _ctx.TaiKhoans.Add(taiKhoan);
                await _ctx.SaveChangesAsync();

                var khachHang = new KhachHang
                {
                    TenKH = string.IsNullOrEmpty(dto.FullName) ? dto.Username : dto.FullName,
                    Email = dto.Email,
                    Sdt = dto.PhoneNumber,
                    DiaChi = dto.Address,
                    MaTaiKhoan = taiKhoan.MaTaiKhoan,
                    NgayTao = DateTime.UtcNow,
                    NgayCapNhat = DateTime.UtcNow,
                    TrangThai = true,
                    HangThanhVien = "Đồng",
                    TongChiTieu = 0
                };
                
                _ctx.KhachHangs.Add(khachHang);
                await _ctx.SaveChangesAsync();

                return Ok(new { message = "Đăng ký thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống.", details = ex.Message });
            }
        }

        [HttpPut("{id}/change-password")]
        public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto dto)
        {
            var tk = await _ctx.TaiKhoans.FindAsync(id);
            if (tk == null) return NotFound(new { message = "Không tìm thấy tài khoản" });

            if (!_authService.VerifyPassword(dto.OldPassword, tk.MatKhau))
            {
                // Fallback check if plain text matches (for old seed data compatibility)
                if (tk.MatKhau != dto.OldPassword)
                    return BadRequest(new { message = "Mật khẩu cũ không đúng" });
            }

            if (_authService.VerifyPassword(dto.NewPassword, tk.MatKhau) || tk.MatKhau == dto.NewPassword)
            {
                return BadRequest(new { message = "Mật khẩu mới không được trùng với mật khẩu cũ." });
            }

            tk.MatKhau = _authService.HashPassword(dto.NewPassword);
            tk.NgayCapNhat = DateTime.UtcNow;
            await _ctx.SaveChangesAsync();

            return Ok(new { message = "Đổi mật khẩu thành công" });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var tk = await _ctx.TaiKhoans.FirstOrDefaultAsync(t => t.TenTK == dto.Username || t.Email == dto.Username);
            if (tk == null) return NotFound(new { message = "Không tìm thấy người dùng này." });
            if (string.IsNullOrEmpty(tk.Email)) return BadRequest(new { message = "Tài khoản này chưa được liên kết với địa chỉ Email nào." });

            // Sinh mã OTP 6 số ngẫu nhiên
            var opt = new Random().Next(100000, 999999).ToString();
            
            tk.ResetOTP = opt;
            tk.OTPExpiry = DateTime.UtcNow.AddMinutes(5); // Hết hạn trong 5 phút
            await _ctx.SaveChangesAsync();

            try
            {
                var smtpServer = _config["EmailSettings:SmtpServer"];
                var smtpPort = int.Parse(_config["EmailSettings:SmtpPort"] ?? "587");
                var senderEmail = _config["EmailSettings:SenderEmail"];
                var senderPassword = _config["EmailSettings:SenderPassword"];
                var senderName = _config["EmailSettings:SenderName"];

                if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
                {
                    return StatusCode(500, new { message = "Chưa cấu hình Email Server trong hệ thống." });
                }

                var mail = new MailMessage();
                mail.From = new MailAddress(senderEmail, senderName);
                mail.To.Add(tk.Email);
                mail.Subject = "Mã OTP Tái Tạo Mật Khẩu - Hệ Thống QLVLXD";
                mail.Body = $"<div style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>" +
                            $"<h2>Yêu cầu khôi phục mật khẩu</h2>" +
                            $"<p>Chào <b>{tk.TenTK}</b>,</p>" +
                            $"<p>Hệ thống đã nhận được yêu cầu cấp lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình:</p>" +
                            $"<h1 style='color: #4CAF50; letter-spacing: 5px; background: #eee; padding: 10px; display: inline-block; border-radius: 5px;'>{opt}</h1>" +
                            $"<p>Mã này có hiệu lực trong vòng <b>5 phút</b>. Không chia sẻ mã này cho bất kỳ ai.</p>" +
                            $"<br/><p>Trân trọng,<br/><b>Ban Quản Trị Hệ Thống VLXD</b></p>" +
                            $"</div>";
                mail.IsBodyHtml = true;

                using var smtp = new SmtpClient(smtpServer, smtpPort);
                smtp.Credentials = new NetworkCredential(senderEmail, senderPassword);
                smtp.EnableSsl = true;

                await smtp.SendMailAsync(mail);

                return Ok(new { message = $"Mã OTP đã được gửi đến email: {tk.Email}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi gửi email: " + ex.Message });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var tk = await _ctx.TaiKhoans.FirstOrDefaultAsync(t => t.TenTK == dto.Username || t.Email == dto.Username);
            if (tk == null) return NotFound(new { message = "Không tìm thấy người dùng này." });

            if (string.IsNullOrEmpty(tk.ResetOTP) || tk.ResetOTP != dto.Otp)
                return BadRequest(new { message = "Mã OTP không chính xác." });

            if (tk.OTPExpiry == null || tk.OTPExpiry < DateTime.UtcNow)
                return BadRequest(new { message = "Mã OTP đã hết hạn." });

            if (_authService.VerifyPassword(dto.NewPassword, tk.MatKhau) || tk.MatKhau == dto.NewPassword)
            {
                return BadRequest(new { message = "Mật khẩu mới không được trùng với mật khẩu cũ." });
            }

            // Hợp lệ, tiến hành đổi
            tk.MatKhau = _authService.HashPassword(dto.NewPassword);
            tk.ResetOTP = null; // xóa OTP đã dùng
            tk.OTPExpiry = null;
            tk.NgayCapNhat = DateTime.UtcNow;

            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại." });
        }

        [HttpPost("social-login")]
        public async Task<IActionResult> SocialLogin([FromBody] SocialLoginDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrEmpty(dto.Email))
                    return BadRequest(new { message = "Email is required." });

                // 1. Kiểm tra tài khoản bằng email đã tồn tại hay chưa
                var taiKhoan = await _ctx.TaiKhoans
                    .Include(tk => tk.VaiTro)
                    .Include(tk => tk.NhanVien)
                    .Include(tk => tk.KhachHang)
                    .FirstOrDefaultAsync(t => t.Email == dto.Email);

                if (taiKhoan == null)
                {
                    // 2. Nếu chưa tồn tại, tự động tạo mới tài khoản (Đăng ký tự động)
                    var username = dto.Email.Split('@')[0] + "_" + dto.Provider.ToLower();
                    
                    // Đảm bảo username không trùng lặp (nếu trùng, thêm hậu tố ngẫu nhiên)
                    var tempUsername = username;
                    int count = 1;
                    while (await _ctx.TaiKhoans.AnyAsync(t => t.TenTK == tempUsername))
                    {
                        tempUsername = $"{username}_{count++}";
                    }
                    username = tempUsername;

                    var vaiTroKH = await _ctx.VaiTros.FirstOrDefaultAsync(v => v.TenVT.ToLower().Contains("khách hàng") || v.TenVT.ToLower() == "customer");
                    if (vaiTroKH == null)
                        return BadRequest(new { message = "Không tìm thấy vai trò Khách hàng trong hệ thống." });

                    // Tạo mật khẩu mặc định an toàn cho đăng nhập MXH
                    var defaultPassword = _authService.HashPassword("SocialLoginSecret123!");

                    taiKhoan = new TaiKhoan
                    {
                        TenTK = username,
                        MatKhau = defaultPassword,
                        Email = dto.Email,
                        MaVaiTro = vaiTroKH.MaVaiTro,
                        TrangThai = true,
                        NgayTao = DateTime.UtcNow,
                        NgayCapNhat = DateTime.UtcNow
                    };

                    _ctx.TaiKhoans.Add(taiKhoan);
                    await _ctx.SaveChangesAsync();

                    var khachHang = new KhachHang
                    {
                        TenKH = string.IsNullOrEmpty(dto.FullName) ? username : dto.FullName,
                        Email = dto.Email,
                        Sdt = "0987654321", // SDT mặc định
                        DiaChi = "",
                        MaTaiKhoan = taiKhoan.MaTaiKhoan,
                        NgayTao = DateTime.UtcNow,
                        NgayCapNhat = DateTime.UtcNow,
                        TrangThai = true,
                        HangThanhVien = "Đồng",
                        TongChiTieu = 0
                    };
                    
                    _ctx.KhachHangs.Add(khachHang);
                    await _ctx.SaveChangesAsync();
                }

                // 3. Sau khi đảm bảo tài khoản đã tồn tại (hoặc tự động đăng ký hoặc đã có từ trước)
                // Tiến hành đăng nhập (Liên kết tự động)
                if (taiKhoan.TrangThai == false)
                    return Unauthorized(new { message = "Tài khoản của bạn đã bị khóa." });

                var nhanVien = taiKhoan.NhanVien;
                var khachHangObj = taiKhoan.KhachHang;

                if (khachHangObj != null && khachHangObj.TrangThai == false)
                    return Unauthorized(new { message = "Tài khoản khách hàng này đã ngưng hoạt động." });

                if (nhanVien != null && nhanVien.TrangThai == false)
                    return Unauthorized(new { message = "Tài khoản nhân viên này đã ngưng hoạt động." });

                var fullName = nhanVien?.TenNV ?? khachHangObj?.TenKH ?? taiKhoan.TenTK;
                var phoneNumber = nhanVien?.Sdt ?? khachHangObj?.Sdt;

                // Cập nhật ngày đăng nhập cuối
                taiKhoan.DangNhapCuoi = DateTime.UtcNow;
                await _ctx.SaveChangesAsync();

                // Xác định danh sách module được phép truy cập
                var allowedModules = new List<string>();
                var roleName = taiKhoan.VaiTro?.TenVT ?? "Unknown";

                bool isAdminRole = roleName.ToLower().Contains("admin") || roleName.ToLower().Contains("quản trị");
                if (isAdminRole)
                {
                    allowedModules.AddRange(new[] { "CUSTOMERS", "EMPLOYEES", "SETTINGS", "BACKUP_RESTORE" });
                }
                else if (roleName.ToLower().Contains("quản lý") || roleName.ToLower() == "manager")
                {
                    allowedModules.AddRange(new[] { "DASHBOARD", "PRODUCTS", "ORDERS", "CUSTOMERS", "SUPPLIERS", "PROMOTIONS", "STOCK_ORDERS", "RETURNS", "INVENTORY", "PRICE_HISTORY", "DELIVERIES", "DEBTS", "REPORTS", "EMPLOYEES", "CHAT" });
                }
                else if (roleName.ToLower().Contains("bán hàng") || roleName.ToLower() == "sales")
                {
                    allowedModules.AddRange(new[] { "PRODUCTS", "ORDERS", "CUSTOMERS", "PROMOTIONS", "CHAT" });
                }
                else if (roleName.ToLower().Contains("kho") || roleName.ToLower() == "warehouse")
                {
                    allowedModules.AddRange(new[] { "PRODUCTS", "STOCK_ORDERS", "INVENTORY", "RETURNS" });
                }
                else if (roleName.ToLower().Contains("tài xế") || roleName.ToLower() == "driver")
                {
                    allowedModules.AddRange(new[] { "DELIVERIES" });
                }
                else
                {
                    allowedModules.AddRange(new[] { "PRODUCTS", "ORDERS", "CHAT" });
                }

                var modulePermissions = new Dictionary<string, ModuleQuyenDto>();
                var defaultAllModules = new[] { "DASHBOARD", "PRODUCTS", "ORDERS", "CUSTOMERS", "SUPPLIERS", "PROMOTIONS", "STOCK_ORDERS", "RETURNS", "INVENTORY", "PRICE_HISTORY", "DELIVERIES", "DEBTS", "REPORTS", "EMPLOYEES", "CHAT" };
                bool isManagerOrAdmin = roleName.ToLower().Contains("quản lý") || roleName.ToLower() == "manager" || roleName.ToLower().Contains("admin") || roleName.ToLower().Contains("quản trị");

                foreach (var m in defaultAllModules)
                {
                    bool canView = isManagerOrAdmin || allowedModules.Contains(m);
                    bool canCrud = isManagerOrAdmin;

                    if (isAdminRole && m != "CUSTOMERS" && m != "EMPLOYEES")
                    {
                        canView = false;
                        canCrud = false;
                    }

                    if (roleName.ToLower().Contains("bán hàng") || roleName.ToLower() == "sales")
                    {
                        if (m == "ORDERS" || m == "CUSTOMERS" || m == "PRODUCTS") canCrud = true;
                    }
                    else if (roleName.ToLower().Contains("thủ kho") || roleName.ToLower() == "warehouse")
                    {
                        if (m == "STOCK_ORDERS" || m == "RETURNS" || m == "INVENTORY" || m == "PRODUCTS") canCrud = true;
                    }

                    modulePermissions[m] = new ModuleQuyenDto
                    {
                        Module = m, TenModule = m, CoTheXem = canView, CoTheTao = canCrud, CoTheSua = canCrud, CoTheXoa = canCrud
                    };
                }

                if (nhanVien != null)
                {
                    var customPerms = await _ctx.NhanVienModuleQuyens
                        .Where(q => q.MaNhanVien == nhanVien.MaNhanVien)
                        .ToListAsync();

                    var activePerms = customPerms;
                    if (!customPerms.Any())
                    {
                        var rolePerms = await _ctx.VaiTroModuleQuyens
                            .Where(q => q.MaVaiTro == taiKhoan.MaVaiTro)
                            .ToListAsync();
                        activePerms = rolePerms.Select(p => new NhanVienModuleQuyen
                        {
                            Module = p.Module, TenModule = p.TenModule,
                            CoTheXem = p.CoTheXem, CoTheTao = p.CoTheTao,
                            CoTheSua = p.CoTheSua, CoTheXoa = p.CoTheXoa
                        }).ToList();
                    }

                    foreach (var p in activePerms)
                    {
                        var upperModule = p.Module.ToUpper();
                        
                        modulePermissions[upperModule] = new ModuleQuyenDto
                        {
                            Module = p.Module, TenModule = p.TenModule, CoTheXem = p.CoTheXem, CoTheTao = p.CoTheTao, CoTheSua = p.CoTheSua, CoTheXoa = p.CoTheXoa
                        };

                        if (p.CoTheXem)
                        {
                            if (!allowedModules.Contains(p.Module)) allowedModules.Add(p.Module);
                            if (!allowedModules.Contains(upperModule)) allowedModules.Add(upperModule);
                        }
                        else
                        {
                            allowedModules.Remove(p.Module);
                            allowedModules.Remove(upperModule);
                        }
                    }
                }

                var response = new LoginResponseDto
                {
                    Id = taiKhoan.MaTaiKhoan,
                    EmployeeId = nhanVien?.MaNhanVien,
                    Username = taiKhoan.TenTK,
                    Email = taiKhoan.Email,
                    FullName = fullName,
                    PhoneNumber = phoneNumber,
                    RoleName = roleName,
                    IsActive = taiKhoan.TrangThai,
                    MaKhachHang = taiKhoan.KhachHang?.MaKhachHang,
                    ChuKy = nhanVien?.ChuKy,
                    AllowedModules = allowedModules,
                    ModulePermissions = modulePermissions
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống khi đăng nhập mạng xã hội.", details = ex.Message });
            }
        }
    }

    public class SocialLoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Provider { get; set; } = string.Empty;
    }

    public class ChangePasswordDto
    {
        public string OldPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class ForgotPasswordDto
    {
        public string Username { get; set; } = string.Empty; // Hoặc dùng email
    }

    public class ResetPasswordDto
    {
        public string Username { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class LoginResponseDto
    {
        public int Id { get; set; }
        public int? EmployeeId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int? MaKhachHang { get; set; }
        public string? ChuKy { get; set; }
        public List<string> AllowedModules { get; set; } = new List<string>();
        public Dictionary<string, ModuleQuyenDto> ModulePermissions { get; set; } = new Dictionary<string, ModuleQuyenDto>();
    }
}


