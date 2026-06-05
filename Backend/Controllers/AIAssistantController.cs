using BuildingMaterialAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Net.Http.Headers;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json.Nodes;

namespace BuildingMaterialAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AIAssistantController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;

        public AIAssistantController(ApplicationDbContext db, IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _db = db;
            _config = config;
            _httpClientFactory = httpClientFactory;
        }

        public class ChatMessageDto
        {
            public string role { get; set; }
            public string content { get; set; }
        }

        public class ChatRequestDto
        {
            public List<ChatMessageDto> messages { get; set; }
            public int EmployeeId { get; set; }
            public string RoleName { get; set; }
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatRequestDto req)
        {
            try
            {
                // 1. Xác thực người dùng và Quyền
                string roleClaim = req.RoleName ?? "";
                if (string.IsNullOrEmpty(roleClaim))
                    return Unauthorized(new { message = "Không xác định được quyền hạn. Vui lòng đăng nhập lại." });

                int empId = req.EmployeeId;
                
                var employee = await _db.NhanViens.FirstOrDefaultAsync(x => x.MaNhanVien == empId);
                var modPerms = await _db.NhanVienModuleQuyens.Where(m => m.MaNhanVien == empId).ToListAsync();
                
                bool HasPermission(string module)
                {
                    string roleLower = roleClaim.ToLower();
                    if (roleLower.Contains("admin") || roleLower.Contains("quản trị") || roleLower.Contains("quản lý") || roleLower == "manager") return true;
                    var p = modPerms.FirstOrDefault(x => x.Module.ToLower() == module.ToLower());
                    if (p != null) return p.CoTheXem;
                    
                    // Fallback quyền mặc định theo role
                    if (roleLower.Contains("kho") && (module == "inventory" || module == "products" || module == "procurement")) return true;
                    if (roleLower.Contains("bán hàng") && (module == "orders" || module == "products" || module == "customers" || module == "promotions" || module == "deliveries")) return true;
                    if (roleLower.Contains("kế toán") && (module == "orders" || module == "debts" || module == "reports" || module == "dashboard" || module == "customers" || module == "suppliers")) return true;
                    if (roleLower.Contains("tài xế") && (module == "deliveries")) return true;
                    return false;
                }

                // 2. Thiết lập System Prompt và Tools
                string systemPrompt = $@"Bạn là Trợ lý AI thông minh của cửa hàng Vật Liệu Xây Dựng Thành Đạt.
Người dùng hiện tại: {employee?.TenNV ?? "Người dùng"} (Vai trò: {roleClaim}).

QUY TẮC QUAN TRỌNG:
1. Khi người dùng hỏi về sản phẩm (VD: 'SP 01', 'sản phẩm 01', 'xi măng'), hãy dùng TraCuuTonKho với từ khóa phù hợp (VD: 'SP001' hoặc 'xi măng').
2. Khi hỏi đơn hàng (VD: 'HD001', 'đơn hàng 1'), dùng TraCuuDonHang.
3. Khi hỏi khách hàng, nhà cung cấp, nhân viên - dùng tool tương ứng.
4. Khi hỏi báo cáo, doanh thu, tổng quan - dùng BaoCaoDoanhThu.
5. Khi hỏi nhập hàng, phiếu nhập - dùng TraCuuPhieuNhap.
6. Khi hỏi giao hàng, vận chuyển - dùng TraCuuGiaoHang.
7. Khi hỏi công nợ, nợ - dùng TraCuuCongNo.
8. Khi hỏi khuyến mãi, giảm giá - dùng TraCuuKhuyenMai.
9. Nếu người dùng viết tắt (VD: 'sp 01' = mã 'SP001', 'kh 01' = mã 'KH001', 'hd 01' = mã 'HD001'), hãy tự chuyển đổi sang mã đúng format rồi tra cứu.
10. Luôn trả lời bằng tiếng Việt, trình bày rõ ràng dễ đọc.
11. Nếu tool trả về lỗi quyền, hãy giải thích lịch sự rằng vai trò hiện tại không được phép xem dữ liệu này.";

                var tools = new JsonArray
                {
                    new JsonObject
                    {
                        ["type"] = "function",
                        ["function"] = new JsonObject
                        {
                            ["name"] = "TraCuuTonKho",
                            ["description"] = "Tra cứu số lượng tồn kho, giá bán của một sản phẩm bất kỳ.",
                            ["parameters"] = new JsonObject
                            {
                                ["type"] = "object",
                                ["properties"] = new JsonObject
                                {
                                    ["tuKhoa"] = new JsonObject { ["type"] = "string", ["description"] = "Tên sản phẩm hoặc mã sản phẩm (Ví dụ: Xi măng, SP001)" }
                                },
                                ["required"] = new JsonArray { "tuKhoa" }
                            }
                        }
                    },
                    new JsonObject
                    {
                        ["type"] = "function",
                        ["function"] = new JsonObject
                        {
                            ["name"] = "TraCuuDonHang",
                            ["description"] = "Tra cứu chi tiết một đơn hàng (nếu có mã) HOẶC danh sách đơn hàng theo ngày/tháng/năm.",
                            ["parameters"] = new JsonObject
                            {
                                ["type"] = "object",
                                ["properties"] = new JsonObject
                                {
                                    ["tuKhoa"] = new JsonObject { ["type"] = "string", ["description"] = "Mã đơn hàng (VD: HD001). Để trống nếu muốn liệt kê." },
                                    ["ngay"] = new JsonObject { ["type"] = "string", ["description"] = "Ngày cần xem (1-31)." },
                                    ["thang"] = new JsonObject { ["type"] = "string", ["description"] = "Tháng cần xem (1-12)." },
                                    ["nam"] = new JsonObject { ["type"] = "string", ["description"] = "Năm cần xem (VD: 2026)." }
                                },
                                ["required"] = new JsonArray()
                            }
                        }
                    },
                    new JsonObject
                    {
                        ["type"] = "function",
                        ["function"] = new JsonObject
                        {
                            ["name"] = "BaoCaoDoanhThu",
                            ["description"] = "Tra cứu báo cáo doanh thu, đơn hàng, khách hàng. Có thể lọc theo ngày/tháng/năm cụ thể.",
                            ["parameters"] = new JsonObject
                            {
                                ["type"] = "object",
                                ["properties"] = new JsonObject
                                {
                                    ["ngay"] = new JsonObject { ["type"] = "string", ["description"] = "Ngày cần xem (1-31). Để trống = tất cả ngày" },
                                    ["thang"] = new JsonObject { ["type"] = "string", ["description"] = "Tháng cần xem (1-12). Để trống = tất cả tháng" },
                                    ["nam"] = new JsonObject { ["type"] = "string", ["description"] = "Năm cần xem (VD: 2026). Để trống = năm hiện tại" }
                                },
                                ["required"] = new JsonArray()
                            }
                        }
                    },
                    new JsonObject
                    {
                        ["type"] = "function",
                        ["function"] = new JsonObject
                        {
                            ["name"] = "TraCuuKhachHang",
                            ["description"] = "Tra cứu thông tin khách hàng theo tên, mã KH, hoặc số điện thoại.",
                            ["parameters"] = new JsonObject
                            {
                                ["type"] = "object",
                                ["properties"] = new JsonObject
                                {
                                    ["tuKhoa"] = new JsonObject { ["type"] = "string", ["description"] = "Tên, mã hoặc SĐT khách hàng" }
                                },
                                ["required"] = new JsonArray { "tuKhoa" }
                            }
                        }
                    },
                    new JsonObject
                    {
                        ["type"] = "function",
                        ["function"] = new JsonObject
                        {
                            ["name"] = "TraCuuNhaCungCap",
                            ["description"] = "Tra cứu thông tin nhà cung cấp theo tên hoặc mã NCC.",
                            ["parameters"] = new JsonObject
                            {
                                ["type"] = "object",
                                ["properties"] = new JsonObject
                                {
                                    ["tuKhoa"] = new JsonObject { ["type"] = "string", ["description"] = "Tên hoặc mã nhà cung cấp" }
                                },
                                ["required"] = new JsonArray { "tuKhoa" }
                            }
                        }
                    },
                    new JsonObject
                    {
                        ["type"] = "function",
                        ["function"] = new JsonObject
                        {
                            ["name"] = "TraCuuPhieuNhap",
                            ["description"] = "Tra cứu phiếu nhập hàng theo mã (VD: PN001) HOẶC liệt kê theo ngày/tháng/năm.",
                            ["parameters"] = new JsonObject
                            {
                                ["type"] = "object",
                                ["properties"] = new JsonObject
                                {
                                    ["tuKhoa"] = new JsonObject { ["type"] = "string", ["description"] = "Mã phiếu nhập. Để trống nếu muốn liệt kê." },
                                    ["ngay"] = new JsonObject { ["type"] = "string", ["description"] = "Ngày cần xem (1-31)." },
                                    ["thang"] = new JsonObject { ["type"] = "string", ["description"] = "Tháng cần xem (1-12)." },
                                    ["nam"] = new JsonObject { ["type"] = "string", ["description"] = "Năm cần xem (VD: 2026)." }
                                },
                                ["required"] = new JsonArray()
                            }
                        }
                    },
                    new JsonObject
                    {
                        ["type"] = "function",
                        ["function"] = new JsonObject
                        {
                            ["name"] = "TraCuuCongNo",
                            ["description"] = "Tra cứu công nợ: tổng nợ, danh sách nợ quá hạn, nợ theo khách hàng hoặc nhà cung cấp.",
                            ["parameters"] = new JsonObject
                            {
                                ["type"] = "object",
                                ["properties"] = new JsonObject
                                {
                                    ["tuKhoa"] = new JsonObject { ["type"] = "string", ["description"] = "Tên khách hàng/NCC hoặc để trống để xem tổng quan" }
                                },
                                ["required"] = new JsonArray()
                            }
                        }
                    },
                    new JsonObject
                    {
                        ["type"] = "function",
                        ["function"] = new JsonObject
                        {
                            ["name"] = "TraCuuGiaoHang",
                            ["description"] = "Tra cứu phiếu giao hàng theo mã giao hàng HOẶC liệt kê theo ngày/tháng/năm.",
                            ["parameters"] = new JsonObject
                            {
                                ["type"] = "object",
                                ["properties"] = new JsonObject
                                {
                                    ["tuKhoa"] = new JsonObject { ["type"] = "string", ["description"] = "Mã giao hàng. Để trống nếu muốn liệt kê." },
                                    ["ngay"] = new JsonObject { ["type"] = "string", ["description"] = "Ngày cần xem (1-31)." },
                                    ["thang"] = new JsonObject { ["type"] = "string", ["description"] = "Tháng cần xem (1-12)." },
                                    ["nam"] = new JsonObject { ["type"] = "string", ["description"] = "Năm cần xem (VD: 2026)." }
                                },
                                ["required"] = new JsonArray()
                            }
                        }
                    },
                    new JsonObject
                    {
                        ["type"] = "function",
                        ["function"] = new JsonObject
                        {
                            ["name"] = "TraCuuKhuyenMai",
                            ["description"] = "Tra cứu chương trình khuyến mãi đang áp dụng hoặc theo tên.",
                            ["parameters"] = new JsonObject
                            {
                                ["type"] = "object",
                                ["properties"] = new JsonObject
                                {
                                    ["tuKhoa"] = new JsonObject { ["type"] = "string", ["description"] = "Tên khuyến mãi hoặc để trống xem tất cả đang hoạt động" }
                                },
                                ["required"] = new JsonArray()
                            }
                        }
                    },
                    new JsonObject
                    {
                        ["type"] = "function",
                        ["function"] = new JsonObject
                        {
                            ["name"] = "TraCuuNhanVien",
                            ["description"] = "Tra cứu thông tin nhân viên theo tên hoặc mã nhân viên.",
                            ["parameters"] = new JsonObject
                            {
                                ["type"] = "object",
                                ["properties"] = new JsonObject
                                {
                                    ["tuKhoa"] = new JsonObject { ["type"] = "string", ["description"] = "Tên hoặc mã nhân viên" }
                                },
                                ["required"] = new JsonArray { "tuKhoa" }
                            }
                        }
                    }
                };

                // 3. Chuẩn bị Messages cho Groq/OpenAI
                var messages = new JsonArray
                {
                    new JsonObject { ["role"] = "system", ["content"] = systemPrompt }
                };

                foreach (var m in req.messages)
                {
                    messages.Add(new JsonObject { ["role"] = m.role, ["content"] = m.content });
                }

                // 4. Gọi LLM lần 1
                var groqKey = _config["Groq:ApiKey"];
                if (string.IsNullOrEmpty(groqKey) || groqKey.Contains("YOUR_GROQ"))
                    return BadRequest(new { message = "Hệ thống AI chưa được cấu hình API Key." });

                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", groqKey);

                var requestBody = new JsonObject
                {
                    ["model"] = _config["Groq:Model"] ?? "llama-3.3-70b-versatile",
                    ["messages"] = messages,
                    ["tools"] = tools,
                    ["tool_choice"] = "auto",
                    ["temperature"] = 0.3
                };

                var response = await client.PostAsync("https://api.groq.com/openai/v1/chat/completions", new StringContent(requestBody.ToJsonString(), Encoding.UTF8, "application/json"));
                var resStr = await response.Content.ReadAsStringAsync();
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[Groq API Error 1]: {resStr}");
                    Console.WriteLine($"[Groq Request Body]: {requestBody.ToJsonString()}");
                    return StatusCode(500, new { message = "Lỗi khi gọi AI Provider.", details = resStr });
                }

                var resJson = JsonNode.Parse(resStr);
                var responseMessage = resJson["choices"][0]["message"];
                var toolCalls = responseMessage["tool_calls"]?.AsArray();

                // 5. Nếu AI muốn gọi hàm (Tool Calling)
                if (toolCalls != null && toolCalls.Count > 0)
                {
                    // Thêm tin nhắn của AI vào lịch sử
                    messages.Add(responseMessage.DeepClone());

                    foreach (var toolCall in toolCalls)
                    {
                        var callId = toolCall["id"]?.ToString();
                        var funcName = toolCall["function"]?["name"]?.ToString();
                        var funcArgsStr = toolCall["function"]?["arguments"]?.ToString() ?? "{}";
                        var funcArgs = JsonNode.Parse(funcArgsStr);

                        string toolResult = "";

                        // THỰC THI HÀM VÀ KIỂM TRA QUYỀN TẠI ĐÂY (RBAC)
                        if (funcName == "TraCuuTonKho")
                        {
                            if (!HasPermission("inventory") && !HasPermission("products"))
                            {
                                toolResult = JsonSerializer.Serialize(new { error = "Tài khoản của bạn không có quyền xem thông tin Sản phẩm / Tồn kho." });
                            }
                            else
                            {
                                string tuKhoa = funcArgs["tuKhoa"]?.ToString().ToLower() ?? "";
                                var prods = await _db.SanPhams.AsNoTracking()
                                    .Where(p => p.TenSP.ToLower().Contains(tuKhoa) || p.MaSP.ToLower().Contains(tuKhoa))
                                    .Take(5)
                                    .ToListAsync();

                                if (prods.Count == 0) toolResult = "Không tìm thấy sản phẩm nào khớp với từ khóa.";
                                else
                                {
                                    var resultList = new List<object>();
                                    foreach (var p in prods)
                                    {
                                        var tonKho = await _db.CTKhoHangs.Where(k => k.MaSanPham == p.MaSanPham).SumAsync(k => k.SoLuong);
                                        resultList.Add(new {
                                            MaSP = p.MaSP,
                                            TenSP = p.TenSP,
                                            GiaBan = p.GiaBan,
                                            TonKho = tonKho,
                                            DonViTinh = p.DonViTinh
                                        });
                                    }
                                    toolResult = JsonSerializer.Serialize(resultList);
                                }
                            }
                        }
                        else if (funcName == "TraCuuDonHang")
                        {
                            if (!HasPermission("orders"))
                            {
                                toolResult = JsonSerializer.Serialize(new { error = "Tài khoản của bạn không có quyền xem thông tin Đơn hàng." });
                            }
                            else
                            {
                                string tuKhoa = funcArgs["tuKhoa"]?.ToString().ToLower() ?? "";
                                int? ngay = funcArgs["ngay"] != null ? int.TryParse(funcArgs["ngay"].ToString(), out var d) ? d : (int?)null : null;
                                int? thang = funcArgs["thang"] != null ? int.TryParse(funcArgs["thang"].ToString(), out var m) ? m : (int?)null : null;
                                int? nam = funcArgs["nam"] != null ? int.TryParse(funcArgs["nam"].ToString(), out var y) ? y : (int?)null : null;

                                var query = _db.HoaDons.AsNoTracking().Include(h => h.KhachHang).Include(h => h.CTHDs).ThenInclude(ct => ct.SanPham).AsQueryable();

                                if (!string.IsNullOrEmpty(tuKhoa))
                                {
                                    query = query.Where(h => h.MaHD.ToLower().Contains(tuKhoa) || (h.SdtNguoiNhan != null && h.SdtNguoiNhan.Contains(tuKhoa)) || (h.TenNguoiNhan != null && h.TenNguoiNhan.ToLower().Contains(tuKhoa)));
                                }
                                
                                if (nam.HasValue) query = query.Where(h => h.NgayLap.Year == nam.Value);
                                if (thang.HasValue) query = query.Where(h => h.NgayLap.Month == thang.Value);
                                if (ngay.HasValue) query = query.Where(h => h.NgayLap.Day == ngay.Value);

                                var orders = await query.OrderByDescending(h => h.NgayLap).Take(10).ToListAsync();

                                if (orders.Count == 0) toolResult = "Không tìm thấy đơn hàng nào.";
                                else if (orders.Count == 1 && !string.IsNullOrEmpty(tuKhoa))
                                {
                                    var order = orders.First();
                                    var resultObj = new {
                                        MaDonHang = order.MaHD,
                                        NgayLap = order.NgayLap.ToString("dd/MM/yyyy HH:mm"),
                                        KhachHang = order.KhachHang?.TenKH ?? "Khách lẻ",
                                        TrangThai = order.TrangThai,
                                        TongTien = order.TongTien,
                                        DaThanhToan = order.ThanhToan,
                                        ChiTietSP = order.CTHDs.Select(ct => new {
                                            TenSP = ct.SanPham?.TenSP,
                                            SoLuong = ct.SoLuong,
                                            ThanhTien = ct.ThanhTien
                                        }).ToList()
                                    };
                                    toolResult = JsonSerializer.Serialize(resultObj);
                                }
                                else
                                {
                                    toolResult = JsonSerializer.Serialize(orders.Select(o => new { o.MaHD, NgayLap = o.NgayLap.ToString("dd/MM/yyyy HH:mm"), KhachHang = o.KhachHang?.TenKH ?? "Khách lẻ", o.TongTien, o.TrangThai }));
                                }
                            }
                        }
                        else if (funcName == "BaoCaoDoanhThu")
                        {
                            if (!HasPermission("reports") && !HasPermission("dashboard"))
                            {
                                toolResult = JsonSerializer.Serialize(new { error = "Tài khoản của bạn không có quyền xem Báo cáo doanh thu." });
                            }
                            else
                            {
                                int? ngay = funcArgs["ngay"] != null ? int.TryParse(funcArgs["ngay"].ToString(), out var d) ? d : (int?)null : null;
                                int? thang = funcArgs["thang"] != null ? int.TryParse(funcArgs["thang"].ToString(), out var t) ? t : (int?)null : null;
                                int nam = funcArgs["nam"] != null && int.TryParse(funcArgs["nam"].ToString(), out var n) ? n : DateTime.Now.Year;

                                var hoaDonQuery = _db.HoaDons.Where(h => h.TrangThai == "Hoàn thành");
                                var allDonQuery = _db.HoaDons.AsQueryable();

                                string tieuDe = "Tổng quan";
                                if (ngay.HasValue && thang.HasValue)
                                {
                                    hoaDonQuery = hoaDonQuery.Where(h => h.NgayLap.Year == nam && h.NgayLap.Month == thang.Value && h.NgayLap.Day == ngay.Value);
                                    allDonQuery = allDonQuery.Where(h => h.NgayLap.Year == nam && h.NgayLap.Month == thang.Value && h.NgayLap.Day == ngay.Value);
                                    tieuDe = $"Ngày {ngay}/{thang}/{nam}";
                                }
                                else if (thang.HasValue)
                                {
                                    hoaDonQuery = hoaDonQuery.Where(h => h.NgayLap.Year == nam && h.NgayLap.Month == thang.Value);
                                    allDonQuery = allDonQuery.Where(h => h.NgayLap.Year == nam && h.NgayLap.Month == thang.Value);
                                    tieuDe = $"Tháng {thang}/{nam}";
                                }
                                else
                                {
                                    hoaDonQuery = hoaDonQuery.Where(h => h.NgayLap.Year == nam);
                                    allDonQuery = allDonQuery.Where(h => h.NgayLap.Year == nam);
                                    tieuDe = $"Năm {nam}";
                                }

                                var tongDonHang = await allDonQuery.CountAsync();
                                var donHoanThanh = await hoaDonQuery.CountAsync();
                                var doanhThu = await hoaDonQuery.SumAsync(h => h.TongTien ?? 0);
                                var daThanhToan = await hoaDonQuery.SumAsync(h => h.ThanhToan ?? 0);

                                var resultObj = new {
                                    TieuDe = tieuDe,
                                    TongDonHang = tongDonHang,
                                    DonHoanThanh = donHoanThanh,
                                    TongDoanhThu = doanhThu,
                                    DaThanhToan = daThanhToan,
                                    TongSanPham = await _db.SanPhams.CountAsync(),
                                    TongKhachHang = await _db.KhachHangs.CountAsync(),
                                    TongCongNo = await _db.CongNos.Where(c => (c.SoTienConLai ?? 0) > 0).SumAsync(c => c.SoTienConLai ?? 0)
                                };
                                toolResult = JsonSerializer.Serialize(resultObj);
                            }
                        }
                        else if (funcName == "TraCuuKhachHang")
                        {
                            if (!HasPermission("customers")) { toolResult = JsonSerializer.Serialize(new { error = "Không có quyền xem Khách hàng." }); }
                            else
                            {
                                string kw = funcArgs["tuKhoa"]?.ToString().ToLower() ?? "";
                                var khs = await _db.KhachHangs.AsNoTracking()
                                    .Where(k => k.TenKH.ToLower().Contains(kw) || k.MaKH.ToLower().Contains(kw) || (k.Sdt != null && k.Sdt.Contains(kw)))
                                    .Take(5).ToListAsync();
                                if (khs.Count == 0) toolResult = "Không tìm thấy khách hàng nào.";
                                else toolResult = JsonSerializer.Serialize(khs.Select(k => new { k.MaKH, k.TenKH, k.Sdt, k.Email, k.DiaChi, k.HangThanhVien, k.TongChiTieu, k.LoaiKH }));
                            }
                        }
                        else if (funcName == "TraCuuNhaCungCap")
                        {
                            if (!HasPermission("suppliers")) { toolResult = JsonSerializer.Serialize(new { error = "Không có quyền xem Nhà cung cấp." }); }
                            else
                            {
                                string kw = funcArgs["tuKhoa"]?.ToString().ToLower() ?? "";
                                var nccs = await _db.NhaCungCaps.AsNoTracking()
                                    .Where(n => n.TenNCC.ToLower().Contains(kw) || n.MaNCC.ToLower().Contains(kw))
                                    .Take(5).ToListAsync();
                                if (nccs.Count == 0) toolResult = "Không tìm thấy nhà cung cấp nào.";
                                else toolResult = JsonSerializer.Serialize(nccs.Select(n => new { n.MaNCC, n.TenNCC, n.Sdt, n.Email, n.DiaChi, n.ThanhPho, n.NguoiLienHe }));
                            }
                        }
                        else if (funcName == "TraCuuPhieuNhap")
                        {
                            if (!HasPermission("procurement")) { toolResult = JsonSerializer.Serialize(new { error = "Không có quyền xem Nhập hàng." }); }
                            else
                            {
                                string tuKhoa = funcArgs["tuKhoa"]?.ToString().ToLower() ?? "";
                                int? ngay = funcArgs["ngay"] != null ? int.TryParse(funcArgs["ngay"].ToString(), out var d) ? d : (int?)null : null;
                                int? thang = funcArgs["thang"] != null ? int.TryParse(funcArgs["thang"].ToString(), out var m) ? m : (int?)null : null;
                                int? nam = funcArgs["nam"] != null ? int.TryParse(funcArgs["nam"].ToString(), out var y) ? y : (int?)null : null;

                                var query = _db.PhieuNhaps.AsNoTracking().Include(p => p.NhaCungCap).Include(p => p.NhanVien).Include(p => p.CTPNs).ThenInclude(ct => ct.SanPham).AsQueryable();
                                
                                if (!string.IsNullOrEmpty(tuKhoa)) query = query.Where(p => p.MaPN.ToLower().Contains(tuKhoa));
                                if (nam.HasValue) query = query.Where(p => p.NgayNhap.Year == nam.Value);
                                if (thang.HasValue) query = query.Where(p => p.NgayNhap.Month == thang.Value);
                                if (ngay.HasValue) query = query.Where(p => p.NgayNhap.Day == ngay.Value);

                                var pns = await query.OrderByDescending(p => p.NgayNhap).Take(10).ToListAsync();
                                if (pns.Count == 0) toolResult = "Không tìm thấy phiếu nhập nào.";
                                else if (pns.Count == 1 && !string.IsNullOrEmpty(tuKhoa))
                                {
                                    var p = pns.First();
                                    toolResult = JsonSerializer.Serialize(new { p.MaPN, NgayNhap = p.NgayNhap.ToString("dd/MM/yyyy HH:mm"), NCC = p.NhaCungCap?.TenNCC, NhanVien = p.NhanVien?.TenNV, p.TongTien, p.TrangThai, ChiTiet = p.CTPNs.Select(ct => new { TenSP = ct.SanPham?.TenSP, ct.SoLuong, ct.DonGia }) });
                                }
                                else 
                                {
                                    toolResult = JsonSerializer.Serialize(pns.Select(p => new { p.MaPN, NgayNhap = p.NgayNhap.ToString("dd/MM/yyyy"), NCC = p.NhaCungCap?.TenNCC, p.TongTien, p.TrangThai }));
                                }
                            }
                        }
                        else if (funcName == "TraCuuCongNo")
                        {
                            if (!HasPermission("debts")) { toolResult = JsonSerializer.Serialize(new { error = "Không có quyền xem Công nợ." }); }
                            else
                            {
                                string kw = funcArgs["tuKhoa"]?.ToString().ToLower() ?? "";
                                var query = _db.CongNos.AsNoTracking().Include(c => c.KhachHang).Include(c => c.NhaCungCap).Where(c => (c.SoTienConLai ?? 0) > 0);
                                if (!string.IsNullOrEmpty(kw)) query = query.Where(c => (c.KhachHang != null && c.KhachHang.TenKH.ToLower().Contains(kw)) || (c.NhaCungCap != null && c.NhaCungCap.TenNCC.ToLower().Contains(kw)));
                                var cns = await query.OrderByDescending(c => c.SoTienConLai).Take(10).ToListAsync();
                                var tongPhaiThu = await _db.CongNos.Where(c => c.LoaiCongNo == "Phải thu" && (c.SoTienConLai ?? 0) > 0).SumAsync(c => c.SoTienConLai ?? 0);
                                var tongPhaiTra = await _db.CongNos.Where(c => c.LoaiCongNo == "Phải trả" && (c.SoTienConLai ?? 0) > 0).SumAsync(c => c.SoTienConLai ?? 0);
                                toolResult = JsonSerializer.Serialize(new { TongPhaiThu = tongPhaiThu, TongPhaiTra = tongPhaiTra, DanhSach = cns.Select(c => new { c.MaCN, c.LoaiCongNo, DoiTac = c.KhachHang?.TenKH ?? c.NhaCungCap?.TenNCC ?? "N/A", c.SoTienNo, c.SoTienDaTra, c.SoTienConLai, HanTT = c.HanThanhToan?.ToString("dd/MM/yyyy"), c.TrangThai }) });
                            }
                        }
                        else if (funcName == "TraCuuGiaoHang")
                        {
                            if (!HasPermission("deliveries")) { toolResult = JsonSerializer.Serialize(new { error = "Không có quyền xem Giao hàng." }); }
                            else
                            {
                                string tuKhoa = funcArgs["tuKhoa"]?.ToString().ToLower() ?? "";
                                int? ngay = funcArgs["ngay"] != null ? int.TryParse(funcArgs["ngay"].ToString(), out var d) ? d : (int?)null : null;
                                int? thang = funcArgs["thang"] != null ? int.TryParse(funcArgs["thang"].ToString(), out var m) ? m : (int?)null : null;
                                int? nam = funcArgs["nam"] != null ? int.TryParse(funcArgs["nam"].ToString(), out var y) ? y : (int?)null : null;

                                var query = _db.PhieuGiaoHangs.AsNoTracking().Include(g => g.HoaDon).ThenInclude(h => h.KhachHang).Include(g => g.NhanVien).AsQueryable();
                                
                                if (!string.IsNullOrEmpty(tuKhoa)) query = query.Where(g => g.MaGH.ToLower().Contains(tuKhoa));
                                if (nam.HasValue) query = query.Where(g => g.NgayGiao.Year == nam.Value);
                                if (thang.HasValue) query = query.Where(g => g.NgayGiao.Month == thang.Value);
                                if (ngay.HasValue) query = query.Where(g => g.NgayGiao.Day == ngay.Value);

                                var ghs = await query.OrderByDescending(g => g.NgayGiao).Take(10).ToListAsync();
                                if (ghs.Count == 0) toolResult = "Không tìm thấy phiếu giao hàng nào.";
                                else toolResult = JsonSerializer.Serialize(ghs.Select(g => new { g.MaGH, NgayGiao = g.NgayGiao.ToString("dd/MM/yyyy HH:mm"), g.NguoiGiao, TaiXe = g.NhanVien?.TenNV, KhachHang = g.HoaDon?.KhachHang?.TenKH, g.DiaChi, g.TrangThai }));
                            }
                        }
                        else if (funcName == "TraCuuKhuyenMai")
                        {
                            if (!HasPermission("promotions")) { toolResult = JsonSerializer.Serialize(new { error = "Không có quyền xem Khuyến mãi." }); }
                            else
                            {
                                string kw = funcArgs["tuKhoa"]?.ToString().ToLower() ?? "";
                                var query = _db.KhuyenMais.AsNoTracking().AsQueryable();
                                if (!string.IsNullOrEmpty(kw)) query = query.Where(k => k.TenKM.ToLower().Contains(kw));
                                else query = query.Where(k => k.TrangThai && k.ThoiGianKetThuc >= DateTime.Now);
                                var kms = await query.Take(5).ToListAsync();
                                if (kms.Count == 0) toolResult = "Không tìm thấy khuyến mãi nào.";
                                else toolResult = JsonSerializer.Serialize(kms.Select(k => new { k.MaKM, k.TenKM, k.LoaiKM, k.LoaiGiamGia, k.GiaTriGiam, k.GiamToiDa, k.DonHangToiThieu, BatDau = k.ThoiGianBatDau.ToString("dd/MM/yyyy"), KetThuc = k.ThoiGianKetThuc.ToString("dd/MM/yyyy"), k.SoLuongToiDa, k.SoLuongDaDung, k.TrangThai }));
                            }
                        }
                        else if (funcName == "TraCuuNhanVien")
                        {
                            if (!HasPermission("employees")) { toolResult = JsonSerializer.Serialize(new { error = "Không có quyền xem Nhân viên." }); }
                            else
                            {
                                string kw = funcArgs["tuKhoa"]?.ToString().ToLower() ?? "";
                                var nvs = await _db.NhanViens.AsNoTracking()
                                    .Where(n => n.TenNV.ToLower().Contains(kw) || n.MaNV.ToLower().Contains(kw))
                                    .Take(5).ToListAsync();
                                if (nvs.Count == 0) toolResult = "Không tìm thấy nhân viên nào.";
                                else toolResult = JsonSerializer.Serialize(nvs.Select(n => new { n.MaNV, n.TenNV, n.Sdt, n.Email, n.DiaChi, n.TrangThai }));
                            }
                        }
                        else
                        {
                            toolResult = "Công cụ không tồn tại.";
                        }

                        // Gửi kết quả hàm lại cho AI
                        messages.Add(new JsonObject
                        {
                            ["role"] = "tool",
                            ["tool_call_id"] = callId,
                            ["name"] = funcName,
                            ["content"] = toolResult
                        });
                    }

                    // Gọi LLM lần 2 với kết quả của tool
                    var requestBody2 = new JsonObject
                    {
                        ["model"] = _config["Groq:Model"] ?? "llama-3.3-70b-versatile",
                        ["messages"] = JsonNode.Parse(messages.ToJsonString()),
                        ["temperature"] = 0.3
                    };

                    var response2 = await client.PostAsync("https://api.groq.com/openai/v1/chat/completions", new StringContent(requestBody2.ToJsonString(), Encoding.UTF8, "application/json"));
                    var resStr2 = await response2.Content.ReadAsStringAsync();
                    
                    if (response2.IsSuccessStatusCode)
                    {
                        var resJson2 = JsonNode.Parse(resStr2);
                        string finalReply = resJson2["choices"][0]["message"]["content"]?.ToString();
                        return Ok(new { reply = finalReply });
                    }
                    else
                    {
                        return StatusCode(500, new { message = "Lỗi khi gọi AI Provider lần 2.", details = resStr2 });
                    }
                }

                // Nếu AI không gọi hàm, chỉ trả về text bình thường
                string reply = responseMessage["content"]?.ToString() ?? "Trợ lý không có phản hồi.";
                return Ok(new { reply = reply });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AIAssistant Error] {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new { message = "Lỗi xử lý tại máy chủ AI.", details = ex.Message });
            }
        }
    }
}
