using Microsoft.AspNetCore.Mvc;
using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using BuildingMaterialAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly IEmailService _emailService;

        public ContactController(ApplicationDbContext ctx, IEmailService emailService)
        {
            _ctx = ctx;
            _emailService = emailService;
        }

        // POST: api/Contact
        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] ContactMessage msg)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            msg.CreatedAt = DateTime.Now;
            msg.IsRead = false;

            _ctx.ContactMessages.Add(msg);
            await _ctx.SaveChangesAsync();

            return Ok(new { message = "Gửi tin nhắn thành công!" });
        }

        // GET: api/Contact
        [HttpGet]
        public async Task<IActionResult> GetMessages()
        {
            var msgs = await _ctx.ContactMessages
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
            return Ok(msgs);
        }

        // PATCH: api/Contact/{id}/read
        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var msg = await _ctx.ContactMessages.FindAsync(id);
            if (msg == null) return NotFound();

            msg.IsRead = true;
            await _ctx.SaveChangesAsync();

            return Ok(new { message = "Đã đánh dấu là đã đọc." });
        }
        
        // POST: api/Contact/{id}/reply
        [HttpPost("{id}/reply")]
        public async Task<IActionResult> ReplyMessage(int id, [FromBody] string replyContent)
        {
            var msg = await _ctx.ContactMessages.FindAsync(id);
            if (msg == null) return NotFound();

            msg.ReplyMessage = replyContent;
            msg.RepliedAt = DateTime.Now;
            msg.IsRead = true; // Mark as read when replied

            await _ctx.SaveChangesAsync();

            return Ok(new { message = "Đã lưu tin nhắn phản hồi." });
        }

        // POST: api/Contact/{id}/send-email
        [HttpPost("{id}/send-email")]
        public async Task<IActionResult> SendEmailReply(int id)
        {
            var msg = await _ctx.ContactMessages.FindAsync(id);
            if (msg == null) return NotFound();
            if (string.IsNullOrEmpty(msg.ReplyMessage)) return BadRequest("Vui lòng nhập nội dung phản hồi trước khi gửi email.");

            try
            {
                string subject = $"Phản hồi từ Cửa hàng VLXD Thành Đạt: {msg.Subject}";
                string body = $@"
                    <h3>Xin chào {msg.Name},</h3>
                    <p>Cảm ơn bạn đã liên hệ với chúng tôi.</p>
                    <p><strong>Nội dung câu hỏi của bạn:</strong></p>
                    <blockquote style='background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc;'>{msg.Message}</blockquote>
                    <p><strong>Phản hồi từ cửa hàng:</strong></p>
                    <div style='padding: 10px; border: 1px solid #e68c55; border-radius: 5px;'>
                        {msg.ReplyMessage.Replace("\n", "<br/>")}
                    </div>
                    <br/>
                    <p>Trân trọng,<br/>Cửa hàng Vật liệu xây dựng Thành Đạt</p>
                ";

                await _emailService.SendEmailAsync(msg.Email, subject, body);
                return Ok(new { message = "Đã gửi email phản hồi thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi gửi email: {ex.Message}");
            }
        }

        // DELETE: api/Contact/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            var msg = await _ctx.ContactMessages.FindAsync(id);
            if (msg == null) return NotFound();

            _ctx.ContactMessages.Remove(msg);
            await _ctx.SaveChangesAsync();

            return Ok(new { message = "Đã xóa tin nhắn." });
        }
    }
}
