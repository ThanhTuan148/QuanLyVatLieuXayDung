using Microsoft.AspNetCore.Mvc;
using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BuildingMaterialAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly Utilities.IAIService _ai;

        public ChatController(ApplicationDbContext ctx, Utilities.IAIService ai)
        {
            _ctx = ctx;
            _ai = ai;
        }

        public class EstimateRequest
        {
            public string Purpose { get; set; }
            public decimal Area { get; set; }
        }

        // POST: api/Chat/estimate
        [HttpPost("estimate")]
        public async Task<IActionResult> EstimateMaterials([FromBody] EstimateRequest req)
        {
            if (string.IsNullOrEmpty(req.Purpose))
            {
                return BadRequest(new { Message = "Vui lòng nhập mục đích hoặc hạng mục cần xây dựng." });
            }

            string userPrompt = $"Tôi muốn ước tính vật tư cho hạng mục sau:\n- Mục đích xây dựng: {req.Purpose}\n- Quy mô (diện tích/thể tích): {req.Area} đơn vị.\n\nHãy phân tích định mức chi tiết, hiển thị công thức tính khoa học và trả về khối hành động [ESTIMATE_ACTION: ...] chứa các mã sản phẩm thực tế SP001-SP009 như hướng dẫn của hệ thống.";
            
            try
            {
                var aiResponse = await _ai.GetChatResponse(userPrompt);
                return Ok(new { Response = aiResponse });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống khi gọi AI ước tính.", Detail = ex.Message });
            }
        }

        // GET: api/Chat/history/{customerId}
        [HttpGet("history/{customerId}")]
        public async Task<IActionResult> GetChatHistory(string customerId)
        {
            var history = await _ctx.ChatMessages
                .Where(m => m.CustomerId == customerId)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();
            return Ok(history);
        }

        // GET: api/Chat/customers
        [HttpGet("customers")]
        public async Task<IActionResult> GetActiveChatCustomers()
        {
            var customerIds = await _ctx.ChatMessages
                .Where(m => m.SenderRole == "Customer_Staff" || m.SenderRole == "Staff")
                .Select(m => m.CustomerId)
                .Distinct()
                .ToListAsync();

            var result = new List<object>();
            foreach (var id in customerIds)
            {
                if (int.TryParse(id, out int intId))
                {
                    var k = await _ctx.KhachHangs.FirstOrDefaultAsync(x => x.MaKhachHang == intId);
                    if (k != null)
                    {
                        result.Add(new {
                            MaKhachHang = id,
                            TenKH = k.TenKH,
                            AnhDaiDien = k.AnhDaiDien,
                            LastMessage = await _ctx.ChatMessages
                                .Where(m => m.CustomerId == id)
                                .OrderByDescending(m => m.Timestamp)
                                .FirstOrDefaultAsync()
                        });
                        continue;
                    }
                }
                
                // Guest
                result.Add(new {
                    MaKhachHang = id,
                    TenKH = "Khách lạ (" + (id.Length > 4 ? id.Substring(id.Length - 4) : id) + ")",
                    AnhDaiDien = "",
                    LastMessage = await _ctx.ChatMessages
                        .Where(m => m.CustomerId == id)
                        .OrderByDescending(m => m.Timestamp)
                        .FirstOrDefaultAsync()
                });
            }

            return Ok(result.OrderByDescending(x => (x as dynamic).LastMessage?.Timestamp));
        }

        // PATCH: api/Chat/read/{customerId}
        [HttpPatch("read/{customerId}")]
        public async Task<IActionResult> MarkAsRead(string customerId, [FromQuery] string role)
        {
            var messages = await _ctx.ChatMessages
                .Where(m => m.CustomerId == customerId && m.SenderRole != role && !m.IsRead)
                .ToListAsync();

            foreach (var m in messages) m.IsRead = true;
            await _ctx.SaveChangesAsync();

            return Ok();
        }
    }
}
