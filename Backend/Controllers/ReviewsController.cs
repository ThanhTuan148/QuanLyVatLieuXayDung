using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using BuildingMaterialAPI.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/reviews")]
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAIService _ai;

        public ReviewsController(ApplicationDbContext context, IAIService ai)
        {
            _context = context;
            _ai = ai;
        }

        // GET: api/reviews/product/{productId}
        [HttpGet("product/{productId}")]
        public async Task<ActionResult<object>> GetProductReviews(int productId)
        {
            var reviews = await _context.DanhGias
                .Include(r => r.KhachHang)
                .Where(r => r.MaSanPham == productId && r.TrangThai == true)
                .OrderByDescending(r => r.NgayTao)
                .Select(r => new
                {
                    r.MaDanhGia,
                    r.SoSao,
                    r.NoiDung,
                    r.HinhAnh,
                    r.Video,
                    r.NgayTao,
                    TenKhachHang = r.KhachHang.TenKH,
                    AnhDaiDien = r.KhachHang.AnhDaiDien
                })
                .ToListAsync();

            var averageRating = reviews.Any() ? Math.Round(reviews.Average(r => r.SoSao), 1) : 0;
            var totalCount = reviews.Count;

            return Ok(new
            {
                averageRating,
                totalCount,
                reviews
            });
        }

        // GET: api/reviews/check-status
        [HttpGet("check-status")]
        public async Task<ActionResult> CheckReviewStatus(int productId, int customerId, int orderId)
        {
            var review = await _context.DanhGias
                .FirstOrDefaultAsync(r => r.MaSanPham == productId && r.MaKhachHang == customerId && r.MaHoaDon == orderId);

            return Ok(new
            {
                hasReviewed = review != null,
                reviewData = review != null ? new {
                    maDanhGia = review.MaDanhGia,
                    soSao = review.SoSao,
                    noiDung = review.NoiDung,
                    hinhAnh = review.HinhAnh,
                    video = review.Video
                } : null
            });
        }

        // POST: api/reviews
        [HttpPost]
        public async Task<ActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            if (_ai.ContainsBannedWords(dto.NoiDung) || await _ai.IsToxicAI(dto.NoiDung))
                return BadRequest("Nội dung đánh giá chứa từ ngữ không phù hợp.");

            var hasBought = await _context.CTHDs
                .AnyAsync(ct => ct.MaHoaDon == dto.MaHoaDon 
                    && ct.MaSanPham == dto.MaSanPham 
                    && ct.HoaDon.MaKhachHang == dto.MaKhachHang 
                    && (ct.HoaDon.TrangThai == "Hoàn thành" || ct.HoaDon.TrangThai == "hoàn thành"));

            if (!hasBought)
                return BadRequest("Bạn chỉ có thể đánh giá những sản phẩm đã mua thành công.");

            var existing = await _context.DanhGias
                .AnyAsync(r => r.MaHoaDon == dto.MaHoaDon && r.MaSanPham == dto.MaSanPham && r.MaKhachHang == dto.MaKhachHang);
            
            if (existing)
                return BadRequest("Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi.");

            var review = new DanhGia
            {
                MaSanPham = dto.MaSanPham,
                MaKhachHang = dto.MaKhachHang,
                MaHoaDon = dto.MaHoaDon,
                SoSao = dto.SoSao,
                NoiDung = dto.NoiDung,
                HinhAnh = dto.HinhAnh,
                Video = dto.Video,
                TrangThai = true,
                NgayTao = DateTime.UtcNow
            };

            _context.DanhGias.Add(review);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đánh giá thành công!", maDanhGia = review.MaDanhGia });
        }

        // PUT: api/reviews/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateReview(int id, [FromBody] CreateReviewDto dto)
        {
            var review = await _context.DanhGias.FindAsync(id);
            if (review == null) return NotFound("Không tìm thấy đánh giá.");

            if (_ai.ContainsBannedWords(dto.NoiDung) || await _ai.IsToxicAI(dto.NoiDung))
                return BadRequest("Nội dung đánh giá chứa từ ngữ không phù hợp.");

            review.SoSao = dto.SoSao;
            review.NoiDung = dto.NoiDung;
            review.HinhAnh = dto.HinhAnh;
            review.Video = dto.Video;
            
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật đánh giá thành công!" });
        }

        // DELETE: api/reviews/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteReview(int id)
        {
            var review = await _context.DanhGias.FindAsync(id);
            if (review == null) return NotFound("Không tìm thấy đánh giá.");

            _context.DanhGias.Remove(review); // Hard delete for customer's own review if requested
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa đánh giá thành công." });
        }
    }

    public class CreateReviewDto
    {
        public int MaSanPham { get; set; }
        public int MaKhachHang { get; set; }
        public int MaHoaDon { get; set; }
        public int SoSao { get; set; }
        public string? NoiDung { get; set; }
        public string? HinhAnh { get; set; }
        public string? Video { get; set; }
    }
}
