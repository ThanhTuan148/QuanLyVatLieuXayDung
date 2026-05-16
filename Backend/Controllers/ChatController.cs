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

        public ChatController(ApplicationDbContext ctx)
        {
            _ctx = ctx;
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
