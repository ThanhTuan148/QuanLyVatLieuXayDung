using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/inventory")]
    public class InventoryController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public InventoryController(ApplicationDbContext ctx) { _ctx = ctx; }

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _ctx.CTKhoHangs
                .Include(c => c.KhoHang)
                .Include(c => c.SanPham)
                .Select(c => new
                {
                    maCTKho = c.MaCTKho, maKhoHang = c.MaKhoHang,
                    tenKho = c.KhoHang != null ? c.KhoHang.TenKho : "",
                    loaiKho = c.KhoHang != null ? c.KhoHang.LoaiKho : "Kho Khác",
                    maSanPham = c.MaSanPham,
                    tenSP = c.SanPham != null ? c.SanPham.TenSP : "",
                    soLuong = c.SoLuong, soLuongNhap = c.SoLuongNhap, soLuongTon = c.SoLuongTon,
                    viTri = c.ViTri, ngayNhapCuoi = c.NgayNhapCuoi,
                    mucTonToiThieu = c.SanPham != null ? c.SanPham.MucTonToiThieu : 0,
                    isGift = c.SanPham != null && c.SanPham.IsGift == true
                }).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var c = await _ctx.CTKhoHangs.FindAsync(id);
            return c == null ? NotFound() : Ok(c);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CTKhoHangDto dto)
        {
            if (dto == null) return BadRequest();
            var ct = new CTKhoHang
            {
                MaKhoHang = dto.MaKhoHang, MaSanPham = dto.MaSanPham,
                SoLuong = dto.SoLuong, SoLuongNhap = dto.SoLuongNhap, SoLuongTon = dto.SoLuongTon,
                ViTri = dto.ViTri, NgayNhapCuoi = dto.NgayNhapCuoi ?? DateTime.UtcNow,
                NgayCapNhat = DateTime.UtcNow,
            };
            _ctx.CTKhoHangs.Add(ct);
            try { await _ctx.SaveChangesAsync(); return Ok(ct); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message }); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CTKhoHangDto dto)
        {
            var ct = await _ctx.CTKhoHangs.FindAsync(id);
            if (ct == null) return NotFound();
            ct.MaKhoHang = dto.MaKhoHang; ct.MaSanPham = dto.MaSanPham;
            ct.SoLuong = dto.SoLuong; ct.SoLuongNhap = dto.SoLuongNhap; ct.SoLuongTon = dto.SoLuongTon;
            ct.ViTri = dto.ViTri;
            if (dto.NgayNhapCuoi.HasValue) ct.NgayNhapCuoi = dto.NgayNhapCuoi.Value;
            ct.NgayCapNhat = DateTime.UtcNow;
            try { await _ctx.SaveChangesAsync(); return Ok(ct); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message }); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ct = await _ctx.CTKhoHangs.FindAsync(id);
            if (ct == null) return NotFound();
            _ctx.CTKhoHangs.Remove(ct);
            await _ctx.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("warehouses")]
        public async Task<IActionResult> GetWarehouses()
        {
            var list = await _ctx.KhoHangs
                .Select(k => new { k.MaKhoHang, k.MaKho, k.TenKho, k.LoaiKho, k.DiaChi })
                .ToListAsync();
            return Ok(list);
        }

        [HttpPost("warehouses")]
        public async Task<IActionResult> CreateWarehouse([FromBody] KhoHang kho)
        {
            kho.NgayTao = DateTime.UtcNow;
            kho.NgayCapNhat = DateTime.UtcNow;
            _ctx.KhoHangs.Add(kho);
            await _ctx.SaveChangesAsync();
            return Ok(kho);
        }
        [HttpGet("{productId}/import-history")]
        public async Task<IActionResult> GetImportHistory(int productId)
        {
            var history = await _ctx.CTPNs
                .Include(c => c.PhieuNhap)
                .ThenInclude(p => p.NhaCungCap)
                .Where(c => c.MaSanPham == productId && c.SoLuongDaNhan > 0)
                .OrderByDescending(c => c.PhieuNhap.NgayNhap)
                .Select(c => new {
                    maPhieuNhap = c.PhieuNhap.MaPN,
                    ngayNhap = c.PhieuNhap.NgayNhap,
                    tenNhaCungCap = c.PhieuNhap.NhaCungCap != null ? c.PhieuNhap.NhaCungCap.TenNCC : "Khác",
                    soLuongNhan = c.SoLuongDaNhan,
                    donGia = c.DonGia,
                    thanhTien = (decimal)c.SoLuongDaNhan * c.DonGia
                })
                .ToListAsync();
            return Ok(history);
        }
    }

    public class CTKhoHangDto
    {
        public int MaKhoHang { get; set; }
        public int MaSanPham { get; set; }
        public int SoLuong { get; set; }
        public int SoLuongNhap { get; set; }
        public int SoLuongTon { get; set; }
        public string? ViTri { get; set; }
        public DateTime? NgayNhapCuoi { get; set; }
    }
}
