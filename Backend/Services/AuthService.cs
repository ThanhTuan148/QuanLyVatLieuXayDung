using System.Security.Cryptography;
using System.Text;
using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Services
{
    public interface IAuthService
    {
        Task<TaiKhoan?> AuthenticateAsync(string username, string password);
        Task<NhanVien?> GetNhanVienByTaiKhoanAsync(int maTaiKhoan);
        string HashPassword(string password);
        bool VerifyPassword(string password, string hash);
    }

    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;

        public AuthService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TaiKhoan?> AuthenticateAsync(string username, string password)
        {
            try
            {
                Console.WriteLine($"[AuthService] AuthenticateAsync called for username='{username}'");

                var taiKhoan = await _context.TaiKhoans
                    .Include(tk => tk.VaiTro)
                    .Include(tk => tk.NhanVien)
                    .Include(tk => tk.KhachHang)
                    .FirstOrDefaultAsync(tk => tk.TenTK == username || tk.Email == username);

                if (taiKhoan == null)
                {
                    Console.WriteLine("[AuthService] User not found");
                    return null;
                }

                var computedHash = HashPassword(password);

                Console.WriteLine($"[AuthService] Stored hash   : {taiKhoan.MatKhau}");
                Console.WriteLine($"[AuthService] Computed hash : {computedHash}");

                if (!taiKhoan.MatKhau.Equals(computedHash, StringComparison.OrdinalIgnoreCase))
                {
                    if (!VerifyPassword(password, taiKhoan.MatKhau))
                    {
                        Console.WriteLine("[AuthService] Password verification failed");
                        return null;
                    }
                }

                Console.WriteLine("[AuthService] Authentication successful");
                return taiKhoan;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Auth error: {ex.Message}");
                Console.WriteLine($"Auth stack: {ex.StackTrace}");
                return null;
            }
        }

        public async Task<NhanVien?> GetNhanVienByTaiKhoanAsync(int maTaiKhoan)
        {
            return await _context.NhanViens
                .FirstOrDefaultAsync(nv => nv.MaTaiKhoan == maTaiKhoan);
        }

        public string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        public bool VerifyPassword(string password, string hash)
        {
            var hashOfInput = HashPassword(password);
            return hashOfInput.Equals(hash, StringComparison.OrdinalIgnoreCase);
        }
    }
}
