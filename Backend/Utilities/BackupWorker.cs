using BuildingMaterialAPI.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace BuildingMaterialAPI.Utilities
{
    /// <summary>
    /// Cấu hình lịch sao lưu tự động:
    /// - Thứ 2 đến Thứ 6: Differential Backup (chỉ sao lưu phần thay đổi)
    /// - Chủ Nhật: Full Backup (sao lưu toàn bộ)
    /// - Thứ 7: Không sao lưu tự động
    /// </summary>
    public class BackupScheduleConfig
    {
        public bool Enabled { get; set; } = true;

        // Giờ sao lưu Differential (Thứ 2 - Thứ 6)
        public int DiffHour { get; set; } = 20;
        public int DiffMinute { get; set; } = 0;

        // Giờ sao lưu Full (Chủ Nhật)
        public int FullHour { get; set; } = 2;
        public int FullMinute { get; set; } = 0;

        public DateTime? LastDiffBackup { get; set; }
        public DateTime? LastFullBackup { get; set; }
    }

    public class BackupWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BackupWorker> _logger;
        private static readonly string _configFileName = "backup_schedule.json";

        public BackupWorker(IServiceProvider serviceProvider, ILogger<BackupWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public static BackupScheduleConfig ReadConfig(string contentRootPath)
        {
            var filePath = Path.Combine(contentRootPath, _configFileName);
            if (File.Exists(filePath))
            {
                try
                {
                    var json = File.ReadAllText(filePath);
                    return JsonSerializer.Deserialize<BackupScheduleConfig>(json) ?? new BackupScheduleConfig();
                }
                catch
                {
                    return new BackupScheduleConfig();
                }
            }
            var defaultConfig = new BackupScheduleConfig();
            SaveConfig(contentRootPath, defaultConfig);
            return defaultConfig;
        }

        public static void SaveConfig(string contentRootPath, BackupScheduleConfig config)
        {
            var filePath = Path.Combine(contentRootPath, _configFileName);
            var json = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(filePath, json);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Dịch vụ Sao lưu tự động đã khởi động.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
                        var config = ReadConfig(env.ContentRootPath);

                        if (config.Enabled)
                        {
                            var now = DateTime.Now;
                            var dayOfWeek = now.DayOfWeek; // Sunday=0, Monday=1, ..., Saturday=6

                            // ── CHỦ NHẬT: Full Backup ──
                            if (dayOfWeek == DayOfWeek.Sunday)
                            {
                                if (now.Hour == config.FullHour && now.Minute >= config.FullMinute && now.Minute < config.FullMinute + 2)
                                {
                                    if (config.LastFullBackup == null || config.LastFullBackup.Value.Date != now.Date)
                                    {
                                        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                                        await PerformBackup(context, env, "Auto_Full_Sunday", "full");

                                        config.LastFullBackup = now;
                                        SaveConfig(env.ContentRootPath, config);
                                    }
                                }
                            }
                            // ── THỨ 2 - THỨ 7: Differential Backup ──
                            else if (dayOfWeek >= DayOfWeek.Monday && dayOfWeek <= DayOfWeek.Saturday)
                            {
                                if (now.Hour == config.DiffHour && now.Minute >= config.DiffMinute && now.Minute < config.DiffMinute + 2)
                                {
                                    if (config.LastDiffBackup == null || config.LastDiffBackup.Value.Date != now.Date)
                                    {
                                        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                                        await PerformBackup(context, env, $"Auto_Diff_{now.DayOfWeek}", "differential");

                                        config.LastDiffBackup = now;
                                        SaveConfig(env.ContentRootPath, config);
                                    }
                                }
                            }
                            // ── (Không còn ngày nào bỏ trống) ──
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi trong tiến trình sao lưu tự động.");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private async Task PerformBackup(ApplicationDbContext ctx, IWebHostEnvironment env, string type, string backupType = "full")
        {
            try
            {
                string backupFolder = Path.Combine(env.ContentRootPath, "Backups");
                if (!Directory.Exists(backupFolder)) Directory.CreateDirectory(backupFolder);

                string dbName = ctx.Database.GetDbConnection().Database;
                string fileName = $"{type}_{dbName}_{DateTime.Now:yyyyMMdd_HHmmss}.bak";
                string filePath = Path.Combine(backupFolder, fileName);

                string diffClause = backupType == "differential" ? " WITH DIFFERENTIAL" : "";
                string sql = $"BACKUP DATABASE [{dbName}] TO DISK = '{filePath}'{diffClause}";
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
