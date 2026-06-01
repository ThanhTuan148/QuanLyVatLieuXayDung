using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Hubs;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Services
{
    public interface INotificationService
    {
        Task SendNotificationAsync(string title, string content, string type = "HeThong", string? userId = null, string? link = null);
        Task SendToRoleAsync(string roleName, string title, string content, string type = "HeThong", string? link = null);
        Task SendToPermissionAsync(string moduleKey, string title, string content, string type = "HeThong", string? link = null);
    }

    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _ctx;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(ApplicationDbContext ctx, IHubContext<NotificationHub> hubContext)
        {
            _ctx = ctx;
            _hubContext = hubContext;
        }

        public async Task SendNotificationAsync(string title, string content, string type = "HeThong", string? userId = null, string? link = null)
        {
            var notification = new ThongBao
            {
                TieuDe = title,
                NoiDung = content,
                LoaiThongBao = type,
                MaNguoiNhan = userId,
                LienKet = link,
                NgayTao = DateTime.Now,
                DaDoc = false
            };

            _ctx.ThongBaos.Add(notification);
            await _ctx.SaveChangesAsync();

            // Gửi qua SignalR theo đối tượng
            if (string.IsNullOrEmpty(userId))
            {
                // Thông báo chung cho nhân viên/hệ thống
                await _hubContext.Clients.Group("Staff").SendAsync("ReceiveNotification", notification);
            }
            else
            {
                // Gửi riêng cho user đó qua group định danh (Sử dụng MaTaiKhoan làm key)
                await _hubContext.Clients.Group($"User_{userId}").SendAsync("ReceiveNotification", notification);
            }
        }

        public async Task SendToRoleAsync(string roleName, string title, string content, string type = "HeThong", string? link = null)
        {
            var targetUserIds = await _ctx.TaiKhoans
                .Include(t => t.VaiTro)
                .Where(t => t.VaiTro.TenVT.Contains(roleName) && t.TrangThai)
                .Select(t => t.MaTaiKhoan.ToString())
                .ToListAsync();

            foreach (var uid in targetUserIds)
            {
                await SendNotificationAsync(title, content, type, uid, link);
            }
        }

        public async Task SendToPermissionAsync(string moduleKey, string title, string content, string type = "HeThong", string? link = null)
        {
            // Ánh xạ từ moduleKey của frontend sang các mã quyền (MaQ) trong database
            var permissionCodes = moduleKey switch
            {
                "employees" => new[] { "Q01" },
                "products" or "categories" or "promotions" or "flashsales" => new[] { "Q02", "Q10" },
                "orders" => new[] { "Q03", "Q11" },
                "inventory" or "suppliers" => new[] { "Q04" },
                "deliveries" => new[] { "Q05" },
                "customers" => new[] { "Q06" },
                "reports" => new[] { "Q07", "Q08" },
                "settings" => new[] { "Q09" },
                _ => Array.Empty<string>()
            };

            // 1. Lấy các vai trò có quyền xem module này thông qua bảng PHANQUYEN
            var roleIds = await _ctx.PhanQuyens
                .Include(p => p.Quyen)
                .Where(p => permissionCodes.Contains(p.Quyen.MaQ))
                .Select(p => p.MaVaiTro)
                .Distinct()
                .ToListAsync();

            // 2. Lấy danh sách tài khoản thuộc các vai trò đó (từ DB)
            var accountIdsByRole = await _ctx.TaiKhoans
                .Where(t => roleIds.Contains(t.MaVaiTro) && t.TrangThai)
                .Select(t => t.MaTaiKhoan.ToString())
                .ToListAsync();

            // 2.5 FALLBACK: Thêm các tài khoản dựa trên tên Vai Trò (giống logic AuthController)
            var allAccounts = await _ctx.TaiKhoans.Include(t => t.VaiTro).Where(t => t.TrangThai).ToListAsync();
            var fallbackAccountIds = new List<string>();
            foreach(var tk in allAccounts)
            {
                var roleName = tk.VaiTro?.TenVT?.ToLower() ?? "";
                bool isManager = roleName.Contains("quản lý") || roleName == "manager";
                bool isSales = roleName.Contains("bán hàng") || roleName == "sales";
                bool isWarehouse = roleName.Contains("kho") || roleName == "warehouse";
                bool isDriver = roleName.Contains("tài xế") || roleName == "driver";
                bool isAdmin = roleName.Contains("admin") || roleName.Contains("quản trị");

                bool canView = false;
                switch (moduleKey.ToLower())
                {
                    case "orders":
                        if (isManager || isSales) canView = true;
                        break;
                    case "products":
                        if (isManager || isSales || isWarehouse) canView = true;
                        break;
                    case "inventory":
                    case "stock_orders":
                    case "returns":
                        if (isManager || isWarehouse) canView = true;
                        break;
                    case "deliveries":
                        if (isManager || isDriver) canView = true;
                        break;
                    case "customers":
                    case "employees":
                        if (isAdmin || isManager || (moduleKey.ToLower() == "customers" && isSales)) canView = true;
                        break;
                    case "promotions":
                        if (isManager || isSales) canView = true;
                        break;
                    default:
                        if (isManager) canView = true;
                        break;
                }

                if (canView)
                {
                    fallbackAccountIds.Add(tk.MaTaiKhoan.ToString());
                }
            }

            // 3. Lấy danh sách tài khoản có ghi đè quyền cụ thể trong NHANVIEN_MODULE_QUYEN
            var accountIdsByOverride = await _ctx.NhanVienModuleQuyens
                .Include(nmq => nmq.NhanVien)
                .Where(nmq => nmq.Module == moduleKey && nmq.CoTheXem)
                .Select(nmq => nmq.NhanVien.MaTaiKhoan.HasValue ? nmq.NhanVien.MaTaiKhoan.Value.ToString() : null)
                .Where(id => id != null)
                .ToListAsync();

            // Kết hợp và gửi thông báo
            var targetUserIds = accountIdsByRole
                .Union(accountIdsByOverride!)
                .Union(fallbackAccountIds)
                .Distinct()
                .ToList();

            foreach (var uid in targetUserIds)
            {
                await SendNotificationAsync(title, content, type, uid, link);
            }
        }
    }
}
