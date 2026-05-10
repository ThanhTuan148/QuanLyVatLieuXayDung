using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using BuildingMaterialAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Utilities
{
    public class DebtWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DebtWorker> _logger;

        public DebtWorker(IServiceProvider serviceProvider, ILogger<DebtWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Dịch vụ Quản lý Công nợ tự động đã khởi động.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                        var notifyService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                        await ProcessDebtReminders(context, emailService, notifyService);
                        await ProcessDebtInterests(context, notifyService);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi trong tiến trình xử lý công nợ tự động.");
                }

                // Chạy mỗi 6 tiếng một lần để kiểm tra
                await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
            }
        }

        private async Task ProcessDebtReminders(ApplicationDbContext context, IEmailService emailService, INotificationService notifyService)
        {
            var now = DateTime.UtcNow;
            
            // 1. Gửi Email nhắc nợ khi quá hạn 30 ngày (HanThanhToan)
            var overdueDebts = await context.CongNos
                .Include(c => c.KhachHang)
                .Include(c => c.HoaDon)
                .Where(c => c.LoaiCongNo == "Phải thu" && (c.SoTienConLai ?? 0) > 0 && c.HanThanhToan < now && c.NgayNhacNoEmail == null)
                .ToListAsync();

            foreach (var debt in overdueDebts)
            {
                try
                {
                    if (debt.KhachHang != null && !string.IsNullOrEmpty(debt.KhachHang.Email))
                    {
                        string subject = $"[NHẮC NỢ] Thông báo quá hạn thanh toán đơn hàng {debt.HoaDon?.MaHD}";
                        string body = $@"
                            <h3>Kính gửi ông/bà {debt.KhachHang.TenKH},</h3>
                            <p>Hệ thống ghi nhận khoản nợ cho đơn hàng <b>{debt.HoaDon?.MaHD}</b> của quý khách đã quá hạn thanh toán 30 ngày.</p>
                            <p>Số tiền còn lại cần thanh toán: <b>{debt.SoTienConLai:N0} VNĐ</b></p>
                            <p>Vui lòng tiến hành thanh toán trong vòng <b>5 ngày tới</b> để tránh phát sinh lãi phạt chậm thanh toán (5%).</p>
                            <p>Nếu quý khách đã thanh toán, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi để đối soát.</p>
                            <br/>
                            <p>Trân trọng,<br/>Cửa hàng Vật liệu Xây dựng</p>";
                        
                        await emailService.SendEmailAsync(debt.KhachHang.Email, subject, body);
                        debt.NgayNhacNoEmail = now;
                        debt.NgayCapNhat = now;
                        
                        // Gửi thông báo hệ thống cho khách hàng
                        await notifyService.SendNotificationAsync(
                            "Nhắc nợ quá hạn",
                            $"Đơn hàng {debt.HoaDon?.MaHD} đã quá hạn thanh toán. Vui lòng kiểm tra email và tất toán trong 5 ngày để tránh lãi phạt.",
                            "System",
                            debt.KhachHang.MaKhachHang.ToString(),
                            link: "/my-debts"
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Lỗi khi gửi email nhắc nợ cho mã CN: {debt.MaCN}");
                }
            }

            // 2. Thông báo nhắc nhở khi SẮP đến hạn (còn 3 ngày)
            var nearDueDebts = await context.CongNos
                .Include(c => c.KhachHang)
                .Include(c => c.HoaDon)
                .Where(c => c.LoaiCongNo == "Phải thu" && (c.SoTienConLai ?? 0) > 0 && c.HanThanhToan > now && c.HanThanhToan <= now.AddDays(3))
                .ToListAsync();

            foreach (var debt in nearDueDebts)
            {
                // Chỉ thông báo 1 lần khi sắp đến hạn (dùng Ghi chú để đánh dấu hoặc bỏ qua nếu đã thông báo gần đây)
                if (debt.KhachHang != null)
                {
                    await notifyService.SendNotificationAsync(
                        "Sắp đến hạn thanh toán",
                        $"Khoản nợ cho đơn hàng {debt.HoaDon?.MaHD} sẽ hết hạn vào ngày {debt.HanThanhToan?.ToString("dd/MM/yyyy")}. Quý khách vui lòng sắp xếp thanh toán.",
                        "System",
                        debt.KhachHang.MaKhachHang.ToString(),
                        link: "/my-debts"
                    );
                }
            }

            await context.SaveChangesAsync();
        }

        private async Task ProcessDebtInterests(ApplicationDbContext context, INotificationService notifyService)
        {
            var now = DateTime.UtcNow;

            // 3. Tính lãi phạt 5% nếu sau 5 ngày gửi mail vẫn chưa trả
            var penaltyDebts = await context.CongNos
                .Include(c => c.KhachHang)
                .Include(c => c.HoaDon)
                .Where(c => c.LoaiCongNo == "Phải thu" && (c.SoTienConLai ?? 0) > 0 && c.NgayNhacNoEmail != null && c.NgayNhacNoEmail.Value.AddDays(5) < now && c.LaiPhat == 0m)
                .ToListAsync();

            foreach (var debt in penaltyDebts)
            {
                decimal penalty = (debt.SoTienConLai ?? 0) * 0.05m;
                debt.LaiPhat = penalty;
                debt.SoTienNo += penalty;
                debt.SoTienConLai += penalty;
                debt.NgayCapNhat = now;
                debt.GhiChu = (debt.GhiChu ?? "") + $" [Hệ thống: Áp dụng lãi phạt 5% chậm thanh toán: +{penalty:N0}đ]";

                if (debt.KhachHang != null)
                {
                    await notifyService.SendNotificationAsync(
                        "Thông báo lãi phạt chậm trả",
                        $"Do quá hạn thanh toán 5 ngày kể từ ngày nhắc nhở, đơn hàng {debt.HoaDon?.MaHD} đã bị áp dụng lãi phạt 5% (+{penalty:N0}đ).",
                        "System",
                        debt.KhachHang.MaKhachHang.ToString(),
                        link: "/my-debts"
                    );
                }
            }

            await context.SaveChangesAsync();
        }
    }
}
