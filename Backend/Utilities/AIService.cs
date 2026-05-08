using System.Text.RegularExpressions;
using System.Text;
using System.Text.Json;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;

namespace BuildingMaterialAPI.Utilities
{
    public interface IAIService
    {
        bool ContainsBannedWords(string text);
        Task<bool> IsToxicAI(string text);
        Task<List<DeliveryBatch>> GetPoolingSuggestionsAI(List<PendingOrderDto> orders);
    }

    public class AIService : IAIService
    {
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;

        private static readonly List<string> BannedWords = new List<string>
        {
            "dm", "dmm", "vcl", "vkl", "cmn", "clgt", "me no", "cha no", "diu", "deo", "du", "ngu", "chui",
            "dcm", "vl", "cc", "loz", "lon", "buoi", "cac", "du", "ma no", "khon nan", "cho chet",
            "bitch", "fuck", "shit", "ass", "dick"
        };

        public AIService(IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _config = config;
            _httpClientFactory = httpClientFactory;
        }

        public bool ContainsBannedWords(string text)
        {
            if (string.IsNullOrEmpty(text)) return false;
            string normalized = RemoveDiacritics(text.ToLower());
            normalized = Regex.Replace(normalized, @"[^a-z0-9\s]", "");
            foreach (var word in BannedWords)
            {
                string pattern = @"\b" + Regex.Escape(word) + @"\b";
                if (Regex.IsMatch(normalized, pattern)) return true;
                if (word.Length >= 3 && normalized.Contains(word)) return true;
            }
            return false;
        }

        private string RemoveDiacritics(string text)
        {
            if (string.IsNullOrEmpty(text)) return text;
            string[] arr1 = new string[] { "aáàảãạâấầẩẫậăắằẳẵặ", "eéèẻẽẹêếềểễệ", "iíìỉĩị", "oóòỏõọôốồổỗộơớờởỡợ", "uúùủũụưứừửữự", "yýỳỷỹỵ", "dđ" };
            string[] arr2 = new string[] { "a", "e", "i", "o", "u", "y", "d" };
            for (int i = 0; i < arr1.Length; i++)
            {
                for (int j = 1; j < arr1[i].Length; j++)
                {
                    text = text.Replace(arr1[i][j], arr2[i][0]);
                    text = text.Replace(arr1[i][j].ToString().ToUpper(), arr2[i][0].ToString().ToUpper());
                }
            }
            return text;
        }

        public async Task<bool> IsToxicAI(string text)
        {
            var apiKey = _config["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey) || apiKey.Contains("YOUR_GEMINI")) return false;

            var model = _config["Gemini:Model"] ?? "gemini-1.5-flash";
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
            var prompt = $"Analyze the following comment for toxic content or profanity. Respond ONLY with 'TRUE' or 'FALSE'.\nComment: \"{text}\"";

            try {
                var response = await _httpClientFactory.CreateClient().PostAsJsonAsync(url, new { contents = new[] { new { parts = new[] { new { text = prompt } } } } });
                if (!response.IsSuccessStatusCode) return false;
                var res = await response.Content.ReadFromJsonAsync<JsonElement>();
                var textRes = res.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();
                return textRes?.Trim().ToUpper() == "TRUE";
            } catch { return false; }
        }

        public async Task<List<DeliveryBatch>> GetPoolingSuggestionsAI(List<PendingOrderDto> orders)
        {
            var apiKey = _config["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey) || apiKey.Contains("YOUR_GEMINI") || orders.Count == 0) return new List<DeliveryBatch>();

            var model = _config["Gemini:Model"] ?? "gemini-1.5-flash";
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

            var ordersJson = JsonSerializer.Serialize(orders);
            var prompt = @$"Bạn là chuyên gia điều phối vận tải. Hãy ghép các đơn hàng sau vào các chuyến xe (batch) tối ưu nhất dựa trên địa chỉ (cùng quận, cùng đường hoặc lộ trình gần nhau).
            Trả về kết quả dưới dạng JSON Array của các Batch object. Mỗi Batch gồm:
            - routeName: Tên lộ trình (Ví dụ: [Quận 7] - Tuyến Nguyễn Văn Linh)
            - orders: Danh sách các maHoaDon thuộc batch này.
            
            Danh sách đơn hàng:
            {ordersJson}
            
            Chỉ trả về duy nhất chuỗi JSON, không giải thích gì thêm.";

            try {
                var response = await _httpClientFactory.CreateClient().PostAsJsonAsync(url, new { contents = new[] { new { parts = new[] { new { text = prompt } } } } });
                if (!response.IsSuccessStatusCode) return new List<DeliveryBatch>();
                var res = await response.Content.ReadFromJsonAsync<JsonElement>();
                var textRes = res.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();
                
                // Extract JSON if AI wrapped it in markdown
                var cleanJson = Regex.Match(textRes ?? "", @"\[.*\]", RegexOptions.Singleline).Value;
                return JsonSerializer.Deserialize<List<DeliveryBatch>>(cleanJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<DeliveryBatch>();
            } catch { return new List<DeliveryBatch>(); }
        }
    }

    public class PendingOrderDto
    {
        public int maHoaDon { get; set; }
        public string maHD { get; set; }
        public string diaChi { get; set; }
        public string tenKhachHang { get; set; }
    }

    public class DeliveryBatch
    {
        public string routeName { get; set; }
        public List<int> orders { get; set; }
    }
}
