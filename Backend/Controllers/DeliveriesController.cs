using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using BuildingMaterialAPI.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeliveriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAIService _ai;

        public DeliveriesController(ApplicationDbContext context, IAIService ai)
        {
            _context = context;
            _ai = ai;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDeliveries([FromQuery] int? maNhanVien = null)
        {
            var query = _context.PhieuGiaoHangs
                .Include(p => p.HoaDon)
                .Include(p => p.NhanVien)
                .AsQueryable();

            if (maNhanVien.HasValue && maNhanVien.Value > 0)
            {
                query = query.Where(p => p.MaNhanVien == maNhanVien.Value);
            }

            var pghList = await query
                .OrderByDescending(p => p.NgayTao)
                .Select(p => new
                {
                    maPhieuGH = p.MaPhieuGH,
                    maGH = p.MaGH,
                    nguoiGiao = p.NguoiGiao,
                    ngayGiao = p.NgayGiao,
                    ngayGiaoDuKien = p.NgayGiaoDuKien,
                    ngayGiaoThucTe = p.NgayGiaoThucTe,
                    diaChi = p.DiaChi,
                    trangThai = p.TrangThai,
                    ghiChu = p.GhiChu,
                    maHoaDon = p.MaHoaDon,
                    maHD = p.HoaDon != null ? p.HoaDon.MaHD : "N/A",
                    tongTienOrder = p.HoaDon != null ? p.HoaDon.TongTien : 0,
                    daThanhToanOrder = p.HoaDon != null ? (p.HoaDon.ThanhToan ?? 0) : 0,
                    maNhanVien = p.MaNhanVien,
                    tenNhanVien = p.NhanVien != null ? p.NhanVien.TenNV : "N/A"
                })
                .ToListAsync();

            return Ok(pghList);
        }

        [HttpPost]
        public async Task<ActionResult> CreateDelivery([FromBody] CreateDeliveryDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var pgh = new PhieuGiaoHang
                {
                    NguoiGiao = dto.NguoiGiao,
                    NgayGiao = dto.NgayGiao ?? DateTime.UtcNow,
                    NgayGiaoDuKien = dto.NgayGiaoDuKien,
                    DiaChi = dto.DiaChi,
                    TrangThai = dto.TrangThai ?? "Chờ giao",
                    GhiChu = dto.GhiChu,
                    MaHoaDon = dto.MaHoaDon,
                    MaNhanVien = dto.MaNhanVien,
                    NgayTao = DateTime.UtcNow,
                    NgayCapNhat = DateTime.UtcNow
                };

                _context.PhieuGiaoHangs.Add(pgh);
                await _context.SaveChangesAsync();

                if (dto.Items != null && dto.Items.Any())
                {
                    foreach (var item in dto.Items)
                    {
                        _context.CTPhieuGiaoHangs.Add(new CTPhieuGiaoHang
                        {
                            MaPhieuGH = pgh.MaPhieuGH,
                            MaSanPham = item.MaSanPham,
                            MaCTHD = item.MaCTHD,
                            SoLuongGiao = item.SoLuongGiao,
                            GhiChu = item.GhiChu,
                            TrangThai = item.TrangThai ?? "Đang giao",
                            NgayTao = DateTime.UtcNow
                        });
                    }
                    await _context.SaveChangesAsync();
                }

                // Update HoaDon status to Đang giao if it's currently Chờ xử lý or Đã xác nhận
                var hd = await _context.HoaDons.FindAsync(dto.MaHoaDon);
                if (hd != null && (hd.TrangThai == "Chờ xử lý" || hd.TrangThai == "Đã xác nhận"))
                {
                    hd.TrangThai = "Đang giao";
                    hd.NgayCapNhat = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();
                return CreatedAtAction(nameof(GetDeliveries), new { id = pgh.MaPhieuGH }, new { maPhieuGH = pgh.MaPhieuGH });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDelivery(int id, [FromBody] UpdateDeliveryDto dto)
        {
            var existing = await _context.PhieuGiaoHangs.Include(p => p.HoaDon).FirstOrDefaultAsync(p => p.MaPhieuGH == id);
            if (existing == null) return NotFound();

            existing.GhiChu = dto.GhiChu;
            existing.ViTriHienTai = dto.ViTriHienTai ?? existing.ViTriHienTai;
            existing.Lat = dto.Lat ?? existing.Lat;
            existing.Lng = dto.Lng ?? existing.Lng;
            
            if (dto.NgayGiaoThucTe.HasValue)
            {
                existing.NgayGiaoThucTe = dto.NgayGiaoThucTe.Value;
            }
            else if (dto.TrangThai == "Đã giao")
            {
                existing.NgayGiaoThucTe = DateTime.UtcNow;
            }
            
            existing.NgayCapNhat = DateTime.UtcNow;
            
            // Update individual items status if provided
            if (dto.Items != null && dto.Items.Any())
            {
                var itemIds = dto.Items.Select(x => x.MaCTGH).ToList();
                var itemsToUpdate = await _context.CTPhieuGiaoHangs
                    .Where(x => x.MaPhieuGH == id && itemIds.Contains(x.MaCTGH))
                    .ToListAsync();
                
                foreach (var itemUpdate in dto.Items)
                {
                    var item = itemsToUpdate.FirstOrDefault(x => x.MaCTGH == itemUpdate.MaCTGH);
                    if (item != null)
                    {
                        item.TrangThai = itemUpdate.TrangThai;
                        item.GhiChu = itemUpdate.GhiChu;
                    }
                }
            }

            // Update Order Status based on overall fulfillment
            if (existing.HoaDon != null)
            {
                var details = await _context.CTPhieuGiaoHangs
                    .Include(c => c.SanPham)
                    .Where(c => c.MaPhieuGH == id)
                    .ToListAsync();

                string deliveryInfo = string.Join(", ", details.Select(d => $"{d.SoLuongGiao} {d.SanPham?.TenSP}"));
                
                string logMessage = $"Phiếu giao {existing.MaGH} cập nhật sang '{dto.TrangThai}'.";
                if (dto.SoTienThu > 0)
                {
                    logMessage += $" Đã thu {dto.SoTienThu.Value:N0} VNĐ.";
                }
                logMessage += $" Địa chỉ: {existing.DiaChi}. Sản phẩm: {deliveryInfo}";

                // Log history for the trip update
                string oldPhieuStatus = existing.TrangThai;
                await _context.Database.ExecuteSqlRawAsync(
                    "INSERT INTO LICHSUHOADON (MaHoaDon, TrangThaiCu, TrangThaiMoi, NoiDungThayDoi, NgayTao) VALUES ({0}, {1}, {2}, {3}, {4})",
                    existing.MaHoaDon, existing.TrangThai, dto.TrangThai, logMessage, DateTime.UtcNow
                );

                existing.TrangThai = dto.TrangThai; // Update the trip status after logging

                // Payment Collection Logic (Internal update)
                if (dto.SoTienThu > 0)
                {
                    existing.SoTienThu = (existing.SoTienThu ?? 0) + dto.SoTienThu.Value;
                    if (existing.HoaDon != null)
                    {
                        existing.HoaDon.ThanhToan = (existing.HoaDon.ThanhToan ?? 0) + dto.SoTienThu.Value;

                        // Sync with CongNo
                        var congNo = await _context.CongNos.FirstOrDefaultAsync(cn => cn.MaHoaDon == existing.MaHoaDon);
                        if (congNo != null)
                        {
                            congNo.SoTienDaTra += dto.SoTienThu.Value;
                            congNo.SoTienConLai = congNo.SoTienNo - congNo.SoTienDaTra;
                            if (congNo.SoTienConLai <= 0)
                            {
                                congNo.TrangThai = "Đã thanh toán";
                            }
                            congNo.NgayCapNhat = DateTime.UtcNow;

                            // Create ChiTietTraNo for History in Debt System
                            var ctTraNo = new ChiTietTraNo
                            {
                                MaCongNo = congNo.MaCongNo,
                                MaHoaDon = existing.MaHoaDon,
                                NgayTT = DateTime.UtcNow,
                                SoTien = dto.SoTienThu.Value,
                                PTTT = "Tiền mặt (Thu khi giao hàng)",
                                GhiChu = $"Thu từ phiếu giao {existing.MaGH}",
                                TrangThai = "Thành công",
                                NgayTao = DateTime.UtcNow,
                                MaNhanVien = existing.MaNhanVien // Associated driver/staff
                            };
                            _context.ChiTietTraNos.Add(ctTraNo);
                        }
                    }
                }

                bool isReturnExchangeTrip = oldPhieuStatus.Contains("đổi") || oldPhieuStatus.Contains("thu hồi") || oldPhieuStatus.Contains("Đổi");

                if (isReturnExchangeTrip)
                {
                    if (dto.TrangThai == "Đang giao")
                    {
                        existing.HoaDon.TrangThai = "Đang giao hàng đổi/trả";
                    }
                    else if (dto.TrangThai == "Đã giao")
                    {
                        existing.HoaDon.TrangThai = "Đã đổi trả";
                        
                        var pdt = await _context.PhieuDoiTras
                            .Where(x => x.MaHoaDon == existing.MaHoaDon && (x.TrangThai.Contains("Duyệt") || x.TrangThai.Contains("xử lý")))
                            .OrderByDescending(x => x.NgayTao)
                            .FirstOrDefaultAsync();

                        if (pdt != null)
                        {
                            pdt.TrangThai = "Hoàn Tất";
                            pdt.TrangThaiNhapKho = "Đã nhập kho";
                            pdt.NgayCapNhat = DateTime.UtcNow;

                            var cts = await _context.CTPhieuDoiTras.Where(x => x.MaPhieuDT == pdt.MaPhieuDT).ToListAsync();
                            foreach(var ct in cts) {
                                if (ct.TrangThai == "Đã Duyệt") ct.TrangThai = "Hoàn Tất";
                            }
                        }
                    }
                }
                else
                {
                    var totalOrdered = await _context.CTHDs
                        .Where(ct => ct.MaHoaDon == existing.MaHoaDon)
                        .SumAsync(ct => ct.SoLuong);

                    var totalDelivered = await _context.CTPhieuGiaoHangs
                        .Where(c => c.PhieuGiaoHang.MaHoaDon == existing.MaHoaDon && c.PhieuGiaoHang.TrangThai == "Đã giao")
                        .SumAsync(c => (int?)c.SoLuongGiao) ?? 0;

                    if (totalDelivered >= totalOrdered)
                    {
                        string oldStatus = existing.HoaDon.TrangThai;
                        existing.HoaDon.TrangThai = "Hoàn thành";
                        existing.HoaDon.NgayGiao = DateTime.UtcNow;

                        await _context.Database.ExecuteSqlRawAsync(
                            "INSERT INTO LICHSUHOADON (MaHoaDon, TrangThaiCu, TrangThaiMoi, NoiDungThayDoi, NgayTao) VALUES ({0}, {1}, {2}, {3}, {4})",
                            existing.MaHoaDon, oldStatus, "Hoàn thành", "Đơn hàng đã được giao đủ số lượng và hoàn thành.", DateTime.UtcNow
                        );
                    }
                    else if (dto.TrangThai == "Đã giao" || dto.TrangThai == "Đang giao")
                    {
                        if (existing.HoaDon.TrangThai != "Hoàn thành" && existing.HoaDon.TrangThai != "Yêu cầu đổi/trả hàng" && existing.HoaDon.TrangThai != "Đang đổi trả")
                        {
                            existing.HoaDon.TrangThai = "Đang giao";
                        }
                    }
                }
                existing.HoaDon.NgayCapNhat = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/location")]
        public async Task<IActionResult> UpdateLocation(int id, [FromBody] UpdateLocationDto dto)
        {
            var p = await _context.PhieuGiaoHangs.FindAsync(id);
            if (p == null) return NotFound();

            p.ViTriHienTai = dto.ViTriHienTai;
            p.Lat = dto.Lat;
            p.Lng = dto.Lng;
            p.NgayCapNhat = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật vị trí thành công." });
        }

        public class UpdateLocationDto
        {
            public string? ViTriHienTai { get; set; }
            public decimal? Lat { get; set; }
            public decimal? Lng { get; set; }
        }

        public class UpdateDeliveryDto
        {
            public string TrangThai { get; set; }
            public string? GhiChu { get; set; }
            public DateTime? NgayGiaoThucTe { get; set; }
            public decimal? SoTienThu { get; set; }
            public string? ViTriHienTai { get; set; }
            public decimal? Lat { get; set; }
            public decimal? Lng { get; set; }
            public List<UpdateItemStatusDto>? Items { get; set; }
        }

    public class UpdateItemStatusDto
    {
        public int MaCTGH { get; set; }
        public string TrangThai { get; set; }
        public string? GhiChu { get; set; }
    }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDelivery(int id)
        {
            var pgh = await _context.PhieuGiaoHangs.FindAsync(id);
            if (pgh == null) return NotFound();

            _context.PhieuGiaoHangs.Remove(pgh);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDeliveryById(int id)
        {
            var p = await _context.PhieuGiaoHangs
                .AsNoTracking()
                .Include(p => p.NhanVien)
                .Include(p => p.HoaDon).ThenInclude(h => h.KhachHang)
                .Include(p => p.CTPhieuGiaoHangs).ThenInclude(ct => ct.SanPham)
                .FirstOrDefaultAsync(p => p.MaPhieuGH == id);

            if (p == null) return NotFound();

            return Ok(new
            {
                maPhieuGH = p.MaPhieuGH,
                maGH = p.MaGH,
                nguoiGiao = p.NguoiGiao ?? "N/A",
                ngayGiao = p.NgayGiao,
                ngayGiaoDuKien = p.NgayGiaoDuKien,
                ngayGiaoThucTe = p.NgayGiaoThucTe,
                diaChi = p.DiaChi ?? "N/A",
                trangThai = p.TrangThai ?? "Chờ giao",
                ghiChu = p.GhiChu ?? "",
                maHD = p.HoaDon?.MaHD ?? "N/A",
                maHoaDon = p.MaHoaDon,
                tenNhanVien = p.NhanVien?.TenNV ?? "N/A",
                tenKhachHang = p.HoaDon?.KhachHang?.TenKH ?? "Khách vãng lai",
                chiTiet = p.CTPhieuGiaoHangs?.Select(ct => new
                {
                    maCTGH = ct.MaCTGH,
                    maSanPham = ct.MaSanPham,
                    tenSanPham = ct.SanPham?.TenSP ?? "N/A",
                    soLuongGiao = ct.SoLuongGiao,
                    trangThai = ct.TrangThai ?? "Đang giao",
                    ghiChu = ct.GhiChu
                }).ToList()
            });
        }

        [HttpGet("BatchSuggestions")]
        public async Task<IActionResult> GetBatchSuggestions()
        {
            // 1. Fetch pending orders (Chờ xử lý, Đã xác nhận)
            var pendingOrders = await _context.HoaDons
                .Include(h => h.KhachHang)
                .Where(h => h.TrangThai == "Chờ xử lý" || h.TrangThai == "Đã xác nhận")
                .ToListAsync();

            if (!pendingOrders.Any())
                return Ok(new List<object>());

            // 2. Prepare data for AI
            var ordersForAI = pendingOrders.Select(o => new PendingOrderDto
            {
                maHoaDon = o.MaHoaDon,
                maHD = o.MaHD,
                diaChi = o.DiaChiGiaoHang ?? "",
                tenKhachHang = o.KhachHang?.TenKH ?? "Khách lẻ"
            }).ToList();

            // 3. Get suggestions from Gemini AI
            var aiBatches = await _ai.GetPoolingSuggestionsAI(ordersForAI);

            if (aiBatches == null || aiBatches.Count == 0)
            {
                // Fallback to simple logic if AI fails
                return Ok(new List<object> { new { batchId = 1, routeName = "Chưa phân loại", ordersCount = pendingOrders.Count, orders = ordersForAI } });
            }

            // 4. Map AI result back to full order data
            var result = aiBatches.Select((batch, index) => new
            {
                batchId = index + 1,
                routeName = batch.routeName,
                ordersCount = batch.orders.Count,
                orders = pendingOrders.Where(o => batch.orders.Contains(o.MaHoaDon)).Select(o => new {
                    maHoaDon = o.MaHoaDon,
                    maHD = o.MaHD,
                    tenKhachHang = o.KhachHang?.TenKH ?? "Khách lẻ",
                    diaChi = o.DiaChiGiaoHang,
                    ngayLap = o.NgayLap
                }).ToList()
            }).ToList();

            return Ok(result);
        }
    }

    public class CreateDeliveryDto
    {
        public string? NguoiGiao { get; set; }
        public DateTime? NgayGiao { get; set; }
        public DateTime? NgayGiaoDuKien { get; set; }
        public string? DiaChi { get; set; }
        public string? TrangThai { get; set; }
        public string? GhiChu { get; set; }
        public int MaHoaDon { get; set; }
        public int MaNhanVien { get; set; }
        public List<CTPhieuGiaoHangDto> Items { get; set; }
    }

    public class CTPhieuGiaoHangDto
    {
        public int MaSanPham { get; set; }
        public int? MaCTHD { get; set; }
        public int SoLuongGiao { get; set; }
        public string? TrangThai { get; set; }
        public string? GhiChu { get; set; }
    }
}
