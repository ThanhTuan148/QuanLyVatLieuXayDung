using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/vat-invoice")]
    public class VatInvoiceController : ControllerBase
    {
        private readonly IVatInvoiceService _invoiceService;
        private readonly ApplicationDbContext _ctx;

        public VatInvoiceController(IVatInvoiceService invoiceService, ApplicationDbContext ctx)
        {
            _invoiceService = invoiceService;
            _ctx = ctx;
        }

        /// <summary>
        /// Kiểm tra xem đơn hàng có yêu cầu xuất hóa đơn GTGT không
        /// </summary>
        [HttpGet("{orderId}/check")]
        public async Task<IActionResult> Check(int orderId)
        {
            var hd = await _ctx.HoaDons.FindAsync(orderId);
            if (hd == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });

            return Ok(new
            {
                yeuCauVat = hd.YeuCauVat,
                vatType = hd.VatType,
                vatEmail = hd.VatEmail,
                vatCompanyName = hd.VatCompanyName,
                vatTaxId = hd.VatTaxId,
                vatBuyerName = hd.VatBuyerName,
                trangThai = hd.TrangThai,
                canExport = hd.YeuCauVat && hd.TrangThai != null && hd.TrangThai.Contains("Hoàn thành")
            });
        }

        /// <summary>
        /// Tải file PDF hóa đơn GTGT
        /// </summary>
        [HttpGet("{orderId}/download")]
        public async Task<IActionResult> Download(int orderId)
        {
            try
            {
                var hd = await _ctx.HoaDons.FindAsync(orderId);
                if (hd == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });
                if (!hd.YeuCauVat) return BadRequest(new { message = "Đơn hàng này không có yêu cầu xuất hóa đơn GTGT." });

                byte[] pdfBytes = await _invoiceService.GeneratePdfAsync(orderId);

                string fileName = $"HoaDon_GTGT_{hd.MaHD}_{DateTime.Now:yyyyMMdd}.pdf";
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Gửi email hóa đơn GTGT cho khách hàng
        /// </summary>
        [HttpPost("{orderId}/send-email")]
        public async Task<IActionResult> SendEmail(int orderId)
        {
            try
            {
                var hd = await _ctx.HoaDons.FindAsync(orderId);
                if (hd == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });
                if (!hd.YeuCauVat) return BadRequest(new { message = "Đơn hàng này không có yêu cầu xuất hóa đơn GTGT." });

                if (string.IsNullOrEmpty(hd.VatEmail))
                    return BadRequest(new { message = "Không có địa chỉ email để gửi hóa đơn. Vui lòng cập nhật email trong thông tin hóa đơn." });

                await _invoiceService.SendInvoiceEmailAsync(orderId);

                return Ok(new { message = $"Đã gửi hóa đơn GTGT thành công đến {hd.VatEmail}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Gửi email thất bại: " + ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách tất cả đơn hàng có yêu cầu hóa đơn GTGT (cho trang admin)
        /// </summary>
        [HttpGet("list")]
        public async Task<IActionResult> GetVatOrders()
        {
            var orders = await _ctx.HoaDons
                .Include(h => h.KhachHang)
                .Where(h => h.YeuCauVat)
                .OrderByDescending(h => h.NgayLap)
                .Select(h => new
                {
                    maHoaDon = h.MaHoaDon,
                    maHD = h.MaHD,
                    ngayLap = h.NgayLap,
                    tenKhachHang = h.KhachHang != null ? h.KhachHang.TenKH : "Khách lẻ",
                    tongTien = h.TongTien,
                    trangThai = h.TrangThai,
                    vatType = h.VatType,
                    vatEmail = h.VatEmail,
                    vatCompanyName = h.VatCompanyName,
                    vatTaxId = h.VatTaxId,
                    vatBuyerName = h.VatBuyerName,
                    canExport = h.TrangThai != null && h.TrangThai.Contains("Hoàn thành")
                })
                .ToListAsync();

            return Ok(orders);
        }
    }
}
