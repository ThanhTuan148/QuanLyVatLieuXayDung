using BuildingMaterialAPI.Data;
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
        public async Task<IActionResult> CreateBackup()
        {
            try
            {
                string dbName = _ctx.Database.GetDbConnection().Database;
                string fileName = $"Backup_{dbName}_{DateTime.Now:yyyyMMdd_HHmmss}.bak";
                string filePath = Path.Combine(_backupFolder, fileName);
                
                // Construct the SQL Command
                string sql = $"BACKUP DATABASE [{dbName}] TO DISK = '{filePath}'";

                await _ctx.Database.ExecuteSqlRawAsync(sql);

                return Ok(new { message = "Tạo bản sao lưu thành công", fileName = fileName });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi sao lưu dữ liệu: " + ex.InnerException?.Message ?? ex.Message });
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
    }
}
