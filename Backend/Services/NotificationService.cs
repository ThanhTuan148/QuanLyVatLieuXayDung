using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Hubs;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.SignalR;

namespace BuildingMaterialAPI.Services
{
    public interface INotificationService
    {
        Task SendNotificationAsync(string title, string content, string type = "HeThong", string? userId = null, string? link = null);
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
                // Gửi riêng cho user đó qua group định danh
                await _hubContext.Clients.Group($"User_{userId}").SendAsync("ReceiveNotification", notification);
            }
        }
    }
}
