using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BackupController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly string _backupFolder;
        private readonly IWebHostEnvironment _env;

        public BackupController(ApplicationDbContext ctx, IWebHostEnvironment env)
        {
            _ctx = ctx;
            _env = env;
            // Define backup folder inside the backend directory
            _backupFolder = Path.Combine(_env.ContentRootPath, "Backups");
            if (!Directory.Exists(_backupFolder))
            {
                Directory.CreateDirectory(_backupFolder);
            }
        }

        [HttpGet]
        public IActionResult GetBackups()
        {
            try
            {
                var files = Directory.GetFiles(_backupFolder, "*.bak")
                    .Select(f => new FileInfo(f))
                    .OrderByDescending(f => f.CreationTime)
                    .Select(f => new
                    {
                        FileName = f.Name,
                        FileSize = Math.Round(f.Length / 1024.0 / 1024.0, 2) + " MB", // size in MB
                        CreatedAt = f.CreationTime
                    })
                    .ToList();

                return Ok(files);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi đọc thư mục backup: " + ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateBackup([FromQuery] string type = "full")
        {
            try
            {
                string dbName = _ctx.Database.GetDbConnection().Database;
                string typeLabel = type == "differential" ? "Diff" : "Full";
                string fileName = $"Backup_{typeLabel}_{dbName}_{DateTime.Now:yyyyMMdd_HHmmss}.bak";
                string filePath = Path.Combine(_backupFolder, fileName);
                
                // Construct the SQL Command
                string diffClause = type == "differential" ? " WITH DIFFERENTIAL" : "";
                string sql = $"BACKUP DATABASE [{dbName}] TO DISK = '{filePath}'{diffClause}";

                await _ctx.Database.ExecuteSqlRawAsync(sql);

                string msgText = type == "differential" 
                    ? "Tạo bản sao lưu Differential thành công (chỉ phần thay đổi)" 
                    : "Tạo bản sao lưu Full thành công";
                return Ok(new { message = msgText, fileName = fileName });
            }
            catch (Exception ex)
            {
                string hint = type == "differential" 
                    ? " Lưu ý: Differential Backup yêu cầu phải có ít nhất một bản Full Backup trước đó." 
                    : "";
                return StatusCode(500, new { message = "Lỗi khi sao lưu dữ liệu: " + (ex.InnerException?.Message ?? ex.Message) + hint });
            }
        }

        [HttpPost("{fileName}/restore")]
        public async Task<IActionResult> RestoreBackup(string fileName)
        {
            try
            {
                string filePath = Path.Combine(_backupFolder, fileName);
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(new { message = "Không tìm thấy file sao lưu này!" });
                }

                string connString = _ctx.Database.GetDbConnection().ConnectionString;
                var builder = new SqlConnectionStringBuilder(connString);
                string dbName = builder.InitialCatalog;
                
                // To restore, we must connect to 'master' database and drop single connections
                builder.InitialCatalog = "master";
                string masterConnString = builder.ConnectionString;

                using (var conn = new SqlConnection(masterConnString))
                {
                    await conn.OpenAsync();
                    
                    // Force close all other connections to the database to be restored
                    string killConnectionsSql = $"ALTER DATABASE [{dbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;";
                    using (var cmdKill = new SqlCommand(killConnectionsSql, conn))
                    {
                        await cmdKill.ExecuteNonQueryAsync();
                    }

                    // Restore the database
                    string restoreSql = $"RESTORE DATABASE [{dbName}] FROM DISK = '{filePath}' WITH REPLACE;";
                    using (var cmdRestore = new SqlCommand(restoreSql, conn))
                    {
                        // Increase timeout for large restorations
                        cmdRestore.CommandTimeout = 300; 
                        await cmdRestore.ExecuteNonQueryAsync();
                    }

                    // Put the database back into multi_user mode
                    string multiUserSql = $"ALTER DATABASE [{dbName}] SET MULTI_USER;";
                    using (var cmdMulti = new SqlCommand(multiUserSql, conn))
                    {
                        await cmdMulti.ExecuteNonQueryAsync();
                    }
                }

                return Ok(new { message = "Khôi phục dữ liệu thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi phục hồi dữ liệu: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }

        [HttpDelete("{fileName}")]
        public IActionResult DeleteBackup(string fileName)
        {
            try
            {
                string filePath = Path.Combine(_backupFolder, fileName);
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    return Ok(new { message = "Đã xóa bản sao lưu" });
                }
                return NotFound(new { message = "Không tìm thấy file!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi xóa file: " + ex.Message });
            }
        }

        // ───────── LỊCH SAO LƯU TỰ ĐỘNG ─────────

        [HttpGet("schedule")]
        public IActionResult GetSchedule()
        {
            try
            {
                var config = BackupWorker.ReadConfig(_env.ContentRootPath);
                return Ok(config);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi đọc cấu hình lịch sao lưu: " + ex.Message });
            }
        }

        [HttpPut("schedule")]
        public IActionResult UpdateSchedule([FromBody] BackupScheduleConfig config)
        {
            try
            {
                if (config == null) return BadRequest(new { message = "Dữ liệu không hợp lệ." });
                if (config.DiffHour < 0 || config.DiffHour > 23) return BadRequest(new { message = "Giờ Diff phải từ 0 đến 23." });
                if (config.DiffMinute < 0 || config.DiffMinute > 59) return BadRequest(new { message = "Phút Diff phải từ 0 đến 59." });
                if (config.FullHour < 0 || config.FullHour > 23) return BadRequest(new { message = "Giờ Full phải từ 0 đến 23." });
                if (config.FullMinute < 0 || config.FullMinute > 59) return BadRequest(new { message = "Phút Full phải từ 0 đến 59." });

                // Giữ lại thời gian sao lưu gần nhất từ file hiện tại
                var existing = BackupWorker.ReadConfig(_env.ContentRootPath);
                config.LastDiffBackup = existing.LastDiffBackup;
                config.LastFullBackup = existing.LastFullBackup;

                BackupWorker.SaveConfig(_env.ContentRootPath, config);
                return Ok(new { message = "Đã cập nhật lịch sao lưu tự động thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi cập nhật lịch sao lưu: " + ex.Message });
            }
        }
    }
}
