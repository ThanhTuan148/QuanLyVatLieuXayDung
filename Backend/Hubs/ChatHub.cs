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
        private readonly Utilities.IAIService _aiService;

        public ChatHub(ApplicationDbContext ctx, IConfiguration config, Utilities.IAIService aiService)
        {
            _ctx = ctx;
            _config = config;
            _aiService = aiService;
        }

        public async Task JoinChat(string customerId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Customer_{customerId}");
        }

        public async Task SendMessage(string customerId, string message, string senderRole, int? staffId = null)
        {
            try
            {
                var now = System.DateTime.Now;
                
                // Map legacy "Customer" role to "Customer_AI" or "Customer_Staff"
                string mappedRole = senderRole;
                if (senderRole == "Customer")
                {
                    // Default legacy to AI Mode
                    mappedRole = "Customer_AI";
                }

                // Insert message
                var chatMsgObj = new ChatMessage
                {
                    CustomerId = customerId,
                    SenderRole = mappedRole,
                    StaffId = staffId,
                    Message = message,
                    Timestamp = now,
                    IsRead = false
                };

                _ctx.ChatMessages.Add(chatMsgObj);
                await _ctx.SaveChangesAsync();

                var chatMsg = new {
                    id = chatMsgObj.Id, customerId, message, senderRole = mappedRole, staffId,
                    timestamp = now, isRead = false
                };

                // Send back to the customer group
                await Clients.Group($"Customer_{customerId}").SendAsync("ReceiveMessage", chatMsg);

                // --- AI CHATBOT ROUTE ---
                if (mappedRole == "Customer_AI")
                {
                    // Generate AI Response
                    string aiResponse = await _aiService.GetChatResponse(message, customerId);
                    var aiTimestamp = System.DateTime.Now;

                    var aiMsgObj = new ChatMessage
                    {
                        CustomerId = customerId,
                        SenderRole = "AI Assistant",
                        StaffId = null,
                        Message = aiResponse,
                        Timestamp = aiTimestamp,
                        IsRead = false
                    };

                    _ctx.ChatMessages.Add(aiMsgObj);
                    await _ctx.SaveChangesAsync();

                    var aiMsg = new {
                        id = aiMsgObj.Id, customerId, message = aiResponse, senderRole = "AI Assistant",
                        staffId = (int?)null, timestamp = aiTimestamp, isRead = false
                    };
                    
                    // Small delay to feel more natural
                    await Task.Delay(500);
                    await Clients.Group($"Customer_{customerId}").SendAsync("ReceiveMessage", aiMsg);
                    // Do NOT notify Staff group of AI chats!
                }
                // --- HUMAN STAFF ROUTE ---
                else if (mappedRole == "Customer_Staff")
                {
                    // Notify Staff group of new human chat message
                    await Clients.Group("Staff").SendAsync("NewChatMessage", chatMsg);

                    // Check if first human message
                    bool isFirstHumanMsg = !await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(
                        _ctx.ChatMessages, 
                        m => m.CustomerId == customerId && m.SenderRole == "Customer_Staff" && m.Id != chatMsgObj.Id
                    );

                    if (isFirstHumanMsg)
                    {
                        var greeting = "Xin chào! Yêu cầu hỗ trợ của bạn đã được chuyển đến nhân viên tư vấn. Nhân viên của VLXD Thành Đạt sẽ phản hồi bạn ngay lập tức.";
                        var greetingTime = now.AddSeconds(1);

                        var autoReplyObj = new ChatMessage
                        {
                            CustomerId = customerId,
                            SenderRole = "Staff",
                            StaffId = null,
                            Message = greeting,
                            Timestamp = greetingTime,
                            IsRead = false
                        };

                        _ctx.ChatMessages.Add(autoReplyObj);
                        await _ctx.SaveChangesAsync();

                        var autoReply = new {
                            id = autoReplyObj.Id, customerId, message = greeting, senderRole = "Staff",
                            staffId = (int?)null, timestamp = greetingTime, isRead = false
                        };

                        await Clients.Group($"Customer_{customerId}").SendAsync("ReceiveMessage", autoReply);
                        await Clients.Group("Staff").SendAsync("NewChatMessage", autoReply);
                    }
                }
                // --- STAFF RESPONSE ROUTE ---
                else if (mappedRole == "Staff")
                {
                    // Notify Staff group to synchronize all opened staff chat windows
                    await Clients.Group("Staff").SendAsync("NewChatMessage", chatMsg);
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

