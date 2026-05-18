using BuildingMaterialAPI.Utilities;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BuildingMaterialAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AIController : ControllerBase
    {
        private readonly IAIService _ai;

        public AIController(IAIService ai)
        {
            _ai = ai;
        }

        [HttpGet("demand-forecast")]
        public async Task<IActionResult> GetDemandForecast()
        {
            var res = await _ai.GetDemandForecastAI();
            return Ok(res);
        }

        [HttpPost("route-optimization")]
        public async Task<IActionResult> OptimizeRoutes([FromBody] List<string> addresses)
        {
            var res = await _ai.GetRouteOptimizationAI(addresses);
            return Ok(res);
        }

        [HttpPost("ocr-invoice")]
        public async Task<IActionResult> ScanInvoiceOcr([FromBody] OcrRequestDto dto)
        {
            var res = await _ai.ScanInvoiceOcrAI(dto.Base64Image ?? "");
            return Ok(res);
        }

        [HttpGet("sentiment-analysis")]
        public async Task<IActionResult> GetCustomerSentiment()
        {
            var res = await _ai.GetCustomerSentimentAI();
            return Ok(res);
        }
    }

    public class OcrRequestDto
    {
        public string? Base64Image { get; set; }
    }
}
