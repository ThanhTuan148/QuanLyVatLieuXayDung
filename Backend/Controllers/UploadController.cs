using Microsoft.AspNetCore.Mvc;

namespace BuildingMaterialAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost("image")]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            return await HandleUpload(file, "products");
        }

        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
        {
            return await HandleUpload(file, "avatars");
        }

        [HttpPost("signature")]
        public async Task<IActionResult> UploadSignature([FromForm] IFormFile file)
        {
            return await HandleUpload(file, "signatures");
        }

        private async Task<IActionResult> HandleUpload(IFormFile file, string folder)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Không có file được chọn" });

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                return BadRequest(new { message = "Chỉ hỗ trợ file ảnh (jpg, png, gif, webp)" });

            // Max 5MB
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "File ảnh không được vượt quá 5MB" });

            // Generate unique filename
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid()}{ext}";
            
            var uploadPath = Path.Combine(_env.WebRootPath, "images", folder);
            Directory.CreateDirectory(uploadPath);
            
            var filePath = Path.Combine(uploadPath, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return the relative URL and local path info
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var imageUrl = $"{baseUrl}/images/{folder}/{fileName}";
            var relativePath = $"/images/{folder}/{fileName}";

            return Ok(new { imageUrl, relativePath, fileName });
        }

        [HttpDelete("image/{fileName}")]
        public IActionResult DeleteImage(string fileName)
        {
            var filePath = Path.Combine(_env.WebRootPath, "images", "products", fileName);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
                return Ok(new { message = "Đã xóa ảnh" });
            }
            return NotFound(new { message = "Không tìm thấy file" });
        }
    }
}
