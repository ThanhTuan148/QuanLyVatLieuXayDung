using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly Services.INotificationService _notificationService;

        public NotificationController(ApplicationDbContext ctx, Services.INotificationService notificationService)
        {
            _ctx = ctx;
            _notificationService = notificationService;
        }

        // Lấy danh sách thông báo cho một người dùng cụ thể (hoặc toàn bộ)
        [HttpGet]
        public async Task<IActionResult> GetNotifications(string? userId)
        {
            var notifications = await _ctx.ThongBaos
                .Where(n => n.MaNguoiNhan == userId)
                .OrderByDescending(n => n.NgayTao)
                .Take(50) // Giới hạn 50 cái gần nhất
                .ToListAsync();

            return Ok(notifications);
        }

        // Đánh dấu đã đọc một thông báo
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _ctx.ThongBaos.FindAsync(id);
            if (notification == null) return NotFound();

            notification.DaDoc = true;
            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Đã đánh dấu đã đọc" });
        }

        // Đánh dấu tất cả là đã đọc
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead(string userId)
        {
            var unread = await _ctx.ThongBaos
                .Where(n => n.MaNguoiNhan == userId && !n.DaDoc)
                .ToListAsync();

            foreach (var n in unread) n.DaDoc = true;
            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Đã đánh dấu tất cả đã đọc", count = unread.Count });
        }

        // Tạo thông báo mới (Admin dùng)
        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] ThongBao notification)
        {
            await _notificationService.SendNotificationAsync(
                notification.TieuDe, 
                notification.NoiDung, 
                notification.LoaiThongBao ?? "HeThong", 
                notification.MaNguoiNhan, 
                notification.LienKet
            );
            return Ok(new { message = "Đã tạo và gửi thông báo" });
        }

        
        // Xóa thông báo cũ
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var n = await _ctx.ThongBaos.FindAsync(id);
            if (n == null) return NotFound();
            _ctx.ThongBaos.Remove(n);
            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Đã xóa thông báo" });
        }
    }
}
