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
    public interface ICensorService
    {
        bool ContainsBannedWords(string text);
        Task<bool> IsToxicAI(string text);
    }

    public class CensorService : ICensorService
    {
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;

        private static readonly List<string> BannedWords = new List<string>
        {
            "dm", "dmm", "vcl", "vkl", "cmn", "clgt", "me no", "cha no", "diu", "deo", "du", "ngu", "chui",
            "dcm", "vl", "cc", "loz", "lon", "buoi", "cac", "du", "ma no", "khon nan", "cho chet",
            "bitch", "fuck", "shit", "ass", "dick"
        };

        public CensorService(IConfiguration config, IHttpClientFactory httpClientFactory)
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
            if (string.IsNullOrEmpty(apiKey) || apiKey == "YOUR_GEMINI_API_KEY_HERE")
                return false;

            var model = _config["Gemini:Model"] ?? "gemini-1.5-flash";
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

            var prompt = $"Analyze the following comment and determine if it contains profanity, hate speech, or offensive content. Respond with ONLY 'TRUE' if it is toxic, or 'FALSE' if it is safe.\n\nComment: \"{text}\"";

            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                }
            };

            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.PostAsJsonAsync(url, requestBody);
                if (!response.IsSuccessStatusCode) return false;

                var json = await response.Content.ReadAsStringAsync();
                var result = JsonDocument.Parse(json);
                var aiResponse = result.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString()?.Trim().ToUpper();

                return aiResponse == "TRUE";
            }
            catch
            {
                return false; // Fail safe
            }
        }
    }
}
