using Microsoft.AspNetCore.SignalR;
using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Hubs
{
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _ctx;
        private readonly IConfiguration _config;

        public ChatHub(ApplicationDbContext ctx, IConfiguration config)
        {
            _ctx = ctx;
            _config = config;
        }

        private string GetConn() => _config.GetConnectionString("DefaultConnection") ?? "";

        public async Task JoinChat(string customerId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Customer_{customerId}");
        }

        public async Task SendMessage(string customerId, string message, string senderRole, int? staffId = null)
        {
            try
            {
                var now = System.DateTime.Now;
                int newId = 0;
                bool isFirstMessage = false;

                using (var conn = new SqlConnection(GetConn()))
                {
                    await conn.OpenAsync();

                    // Check if first message
                    using (var cmd = new SqlCommand("SELECT COUNT(*) FROM [ChatMessages] WHERE [CustomerId] = @cid", conn))
                    {
                        cmd.Parameters.AddWithValue("@cid", customerId);
                        int count = (int)await cmd.ExecuteScalarAsync();
                        isFirstMessage = count == 0;
                    }

                    // Insert message
                    using (var cmd = new SqlCommand(@"
                        INSERT INTO [ChatMessages] ([CustomerId],[SenderRole],[StaffId],[Message],[Timestamp],[IsRead])
                        OUTPUT INSERTED.Id
                        VALUES (@cid, @role, @staffId, @msg, @ts, 0)", conn))
                    {
                        cmd.Parameters.AddWithValue("@cid", customerId);
                        cmd.Parameters.AddWithValue("@role", senderRole);
                        cmd.Parameters.AddWithValue("@staffId", (object?)staffId ?? System.DBNull.Value);
                        cmd.Parameters.AddWithValue("@msg", message);
                        cmd.Parameters.AddWithValue("@ts", now);
                        newId = (int)await cmd.ExecuteScalarAsync();
                    }
                }

                var chatMsg = new {
                    id = newId, customerId, message, senderRole, staffId,
                    timestamp = now, isRead = false
                };

                await Clients.Group($"Customer_{customerId}").SendAsync("ReceiveMessage", chatMsg);
                await Clients.Group("Staff").SendAsync("NewChatMessage", chatMsg);

                // Auto-reply for first message
                if (isFirstMessage && senderRole == "Customer")
                {
                    var replyMsg = "Chào bạn! Vui lòng chờ ít phút, nhân viên sẽ trả lời bạn ngay.";
                    var replyNow = now.AddSeconds(1);
                    int replyId = 0;

                    using (var conn = new SqlConnection(GetConn()))
                    {
                        await conn.OpenAsync();
                        using (var cmd = new SqlCommand(@"
                            INSERT INTO [ChatMessages] ([CustomerId],[SenderRole],[StaffId],[Message],[Timestamp],[IsRead])
                            OUTPUT INSERTED.Id
                            VALUES (@cid, 'Staff', NULL, @msg, @ts, 0)", conn))
                        {
                            cmd.Parameters.AddWithValue("@cid", customerId);
                            cmd.Parameters.AddWithValue("@msg", replyMsg);
                            cmd.Parameters.AddWithValue("@ts", replyNow);
                            replyId = (int)await cmd.ExecuteScalarAsync();
                        }
                    }

                    var autoReply = new {
                        id = replyId, customerId, message = replyMsg, senderRole = "Staff",
                        staffId = (int?)null, timestamp = replyNow, isRead = false
                    };
                    await Clients.Group($"Customer_{customerId}").SendAsync("ReceiveMessage", autoReply);
                }
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"[ChatHub Error] {ex.Message}");
                if (ex.InnerException != null) System.Console.WriteLine($"[Inner] {ex.InnerException.Message}");
                throw;
            }
        }

        public async Task JoinStaffGroup()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Staff");
        }
    }
}

