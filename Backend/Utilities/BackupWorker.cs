using BuildingMaterialAPI.Data;
using Microsoft.EntityFrameworkCore;
using System.Data;
using Microsoft.Data.SqlClient;

namespace BuildingMaterialAPI.Utilities
{
    public class BackupWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BackupWorker> _logger;
        private DateTime _lastDailyBackup = DateTime.MinValue;
        private int _changeThreshold = 50; // Threshold for frequent backup
        private DateTime _lastActivityBackup = DateTime.MinValue;

        public BackupWorker(IServiceProvider serviceProvider, ILogger<BackupWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Dịch vụ Sao lưu tự động đã khởi động.");
            _lastActivityBackup = DateTime.Now; // Delay first activity backup check to avoid database query during cold start


            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.Now;

                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
                        
                        // 1. Daily Backup at 20:00
                        if (now.Hour == 20 && _lastDailyBackup.Date != now.Date)
                        {
                            bool isWeekend = now.DayOfWeek == DayOfWeek.Saturday || now.DayOfWeek == DayOfWeek.Sunday;
                            await PerformBackup(context, env, isWeekend ? "Full_Weekend" : "Daily_20h");
                            _lastDailyBackup = now;
                        }

                        // 2. Activity-based Backup (Continuous)
                        // Check changes in last hour (using LichSuHoaDon as a proxy for activity)
                        if ((now - _lastActivityBackup).TotalMinutes >= 60)
                        {
                            var oneHourAgo = now.AddHours(-1);
                            int changeCount = await context.LichSuHoaDons.CountAsync(l => l.NgayTao >= oneHourAgo);
                            
                            if (changeCount >= _changeThreshold)
                            {
                                await PerformBackup(context, env, $"HighActivity_{changeCount}_changes");
                                _lastActivityBackup = now;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi trong tiến trình sao lưu tự động.");
                }

                // Check every minute
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private async Task PerformBackup(ApplicationDbContext ctx, IWebHostEnvironment env, string type)
        {
            try
            {
                string backupFolder = Path.Combine(env.ContentRootPath, "Backups");
                if (!Directory.Exists(backupFolder)) Directory.CreateDirectory(backupFolder);

                string dbName = ctx.Database.GetDbConnection().Database;
                string fileName = $"{type}_{dbName}_{DateTime.Now:yyyyMMdd_HHmmss}.bak";
                string filePath = Path.Combine(backupFolder, fileName);

                string sql = $"BACKUP DATABASE [{dbName}] TO DISK = '{filePath}'";
                await ctx.Database.ExecuteSqlRawAsync(sql);
                
                _logger.LogInformation($"[Backup {type}] Thành công: {fileName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[Backup {type}] Thất bại.");
            }
        }
    }
}
