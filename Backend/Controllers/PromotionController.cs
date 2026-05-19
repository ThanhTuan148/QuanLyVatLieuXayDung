using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/promotions")]
    public class PromotionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public PromotionController(ApplicationDbContext context) { _context = context; }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? loai)
        {
            var query = _context.KhuyenMais
                .Include(km => km.KhuyenMaiDoiTuongs)
                    .ThenInclude(kdt => kdt.SanPham)
                        .ThenInclude(sp => sp.CTKhoHangs)
                .Include(km => km.KhuyenMaiDoiTuongs)
                    .ThenInclude(kdt => kdt.LoaiSanPham)
                .AsQueryable();

            if (!string.IsNullOrEmpty(loai))
            {
                query = query.Where(km => km.LoaiKM == loai);
            }

            var items = await query.OrderByDescending(km => km.NgayTao).ToListAsync();

            var result = items.Select(km => new
            {
                maKhuyenMai = km.MaKhuyenMai,
                maKM = km.MaKM,
                loaiKM = km.LoaiKM,
                tenKM = km.TenKM,
                moTa = km.MoTa,
                maApDung = km.MaApDung,
                loaiGiamGia = km.LoaiGiamGia,
                giaTriGiam = km.GiaTriGiam,
                giamToiDa = km.GiamToiDa,
                donHangToiThieu = km.DonHangToiThieu,
                thoiGianBatDau = km.ThoiGianBatDau,
                thoiGianKetThuc = km.ThoiGianKetThuc,
                soLuongToiDa = km.SoLuongToiDa,
                soLuongDaDung = km.SoLuongDaDung,
                trangThai = km.TrangThai,
                hangThanhVien = km.HangThanhVien,
                hinhAnh = km.HinhAnh,
                targets = (km.KhuyenMaiDoiTuongs ?? new List<KhuyenMaiDoiTuong>()).Select(kdt => new
                {
                    maSanPham = kdt.MaSanPham,
                    tenSanPham = kdt.SanPham?.TenSP,
                    hinhAnh = kdt.SanPham?.HinhAnh,
                    giaBan = kdt.SanPham?.GiaBan ?? 0,
                    maLoaiSP = kdt.MaLoaiSP,
                    tenLoaiSP = kdt.LoaiSanPham?.TenLoai,
                    giaKhuyenMai = kdt.GiaKhuyenMai,
                    soLuongBanDau = kdt.SoLuongKhuyenMai ?? 100,
                    daBan = kdt.SoLuongDaBan,
                    soLuongTon = kdt.SanPham?.CTKhoHangs?.Sum(k => (int?)k.SoLuong) ?? 0
                }).ToList()

            }).ToList();

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var item = await _context.KhuyenMais
                .Include(km => km.KhuyenMaiDoiTuongs)
                .FirstOrDefaultAsync(km => km.MaKhuyenMai == id);
            return item == null ? NotFound() : Ok(item);
        }

        [HttpGet("check-voucher/{code}")]
        public async Task<IActionResult> CheckVoucher(string code, [FromQuery] decimal orderTotal = 0)
        {
            var now = DateTime.Now;
            var voucher = await _context.KhuyenMais
                .FirstOrDefaultAsync(km => km.MaApDung == code && 
                                          km.TrangThai && 
                                          km.LoaiKM == "Coupon" &&
                                          km.ThoiGianBatDau <= now && 
                                          km.ThoiGianKetThuc >= now);

            if (voucher == null) return BadRequest(new { message = "Mã giảm giá không tồn tại hoặc đã hết hạn." });
            
            if (voucher.SoLuongToiDa.HasValue && voucher.SoLuongDaDung >= voucher.SoLuongToiDa)
                return BadRequest(new { message = "Mã giảm giá đã hết lượt sử dụng." });

            if (orderTotal < voucher.DonHangToiThieu)
                return BadRequest(new { message = $"Đơn hàng tối thiểu phải từ {voucher.DonHangToiThieu:N0}đ để sử dụng mã này." });

            return Ok(new
            {
                maKhuyenMai = voucher.MaKhuyenMai,
                tenKM = voucher.TenKM,
                loaiGiamGia = voucher.LoaiGiamGia,
                giaTriGiam = voucher.GiaTriGiam,
                giamToiDa = voucher.GiamToiDa
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] KhuyenMaiDto dto)
        {
            if (dto == null) return BadRequest("Dữ liệu không hợp lệ");

            var km = new KhuyenMai
            {
                LoaiKM = dto.LoaiKM ?? "SanPham",
                TenKM = dto.TenKM ?? "Chương trình mới",
                MoTa = dto.MoTa,
                MaApDung = string.IsNullOrWhiteSpace(dto.MaApDung) ? null : dto.MaApDung.Trim(),
                LoaiGiamGia = dto.LoaiGiamGia ?? "PhanTram",

                GiaTriGiam = dto.GiaTriGiam,
                GiamToiDa = dto.GiamToiDa,
                DonHangToiThieu = dto.DonHangToiThieu,
                ThoiGianBatDau = dto.ThoiGianBatDau ?? DateTime.Now,
                ThoiGianKetThuc = dto.ThoiGianKetThuc ?? DateTime.Now.AddDays(30),
                SoLuongToiDa = dto.SoLuongToiDa,
                TrangThai = dto.TrangThai ?? true,
                HangThanhVien = dto.HangThanhVien,
                HinhAnh = dto.HinhAnh,
                NgayTao = DateTime.Now,
                NgayCapNhat = DateTime.Now
            };

            if (dto.DoiTuongs != null && dto.DoiTuongs.Any())
            {
                foreach (var dt in dto.DoiTuongs)
                {
                    km.KhuyenMaiDoiTuongs.Add(new KhuyenMaiDoiTuong
                    {
                        MaSanPham = dt.MaSanPham,
                        MaLoaiSP = dt.MaLoaiSP,
                        GiaKhuyenMai = dt.GiaKhuyenMai,
                        SoLuongKhuyenMai = dt.SoLuong,
                        SoLuongDaBan = 0
                    });
                }
            }

            try
            {
                _context.KhuyenMais.Add(km);
                await _context.SaveChangesAsync();

                return Ok(new 
                { 
                    maKhuyenMai = km.MaKhuyenMai, 
                    maKM = km.MaKM,
                    tenKM = km.TenKM, 
                    loaiKM = km.LoaiKM,
                    trangThai = km.TrangThai
                });
            }
            catch (DbUpdateException ex)
            {
                if (ex.InnerException != null && ex.InnerException.Message.Contains("UIX_MaApDung_Not_Null"))
                {
                    return BadRequest(new { message = "Mã code này đã được sử dụng. Vui lòng nhập mã khác!" });
                }
                return StatusCode(500, new { message = "Lỗi SQL khi lưu khuyến mãi.", details = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PromotionController] Create Error: {ex}");
                return StatusCode(500, new { message = "Lỗi hệ thống khi lưu khuyến mãi.", details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] KhuyenMaiDto dto)
        {
            var km = await _context.KhuyenMais
                .Include(k => k.KhuyenMaiDoiTuongs)
                .FirstOrDefaultAsync(k => k.MaKhuyenMai == id);
            if (km == null) return NotFound();

            km.LoaiKM = dto.LoaiKM ?? km.LoaiKM;
            km.TenKM = dto.TenKM ?? km.TenKM;
            km.MoTa = dto.MoTa;
            km.MaApDung = string.IsNullOrWhiteSpace(dto.MaApDung) ? null : dto.MaApDung.Trim();
            km.LoaiGiamGia = dto.LoaiGiamGia ?? km.LoaiGiamGia;

            km.GiaTriGiam = dto.GiaTriGiam;
            km.GiamToiDa = dto.GiamToiDa;
            km.DonHangToiThieu = dto.DonHangToiThieu;
            if (dto.ThoiGianBatDau.HasValue) km.ThoiGianBatDau = dto.ThoiGianBatDau.Value;
            if (dto.ThoiGianKetThuc.HasValue) km.ThoiGianKetThuc = dto.ThoiGianKetThuc.Value;
            km.SoLuongToiDa = dto.SoLuongToiDa;
            km.TrangThai = dto.TrangThai ?? km.TrangThai;
            km.HangThanhVien = dto.HangThanhVien;
            km.HinhAnh = dto.HinhAnh;
            km.NgayCapNhat = DateTime.Now;

            try
            {
                // Update targets
                _context.KhuyenMaiDoiTuongs.RemoveRange(km.KhuyenMaiDoiTuongs);
                if (dto.DoiTuongs != null)
                {
                    foreach (var dt in dto.DoiTuongs)
                    {
                        km.KhuyenMaiDoiTuongs.Add(new KhuyenMaiDoiTuong
                        {
                            MaSanPham = dt.MaSanPham,
                            MaLoaiSP = dt.MaLoaiSP,
                            GiaKhuyenMai = dt.GiaKhuyenMai,
                            SoLuongKhuyenMai = dt.SoLuong,
                            SoLuongDaBan = 0
                        });
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new 
                { 
                    maKhuyenMai = km.MaKhuyenMai, 
                    maKM = km.MaKM,
                    tenKM = km.TenKM, 
                    loaiKM = km.LoaiKM,
                    trangThai = km.TrangThai
                });
            }
            catch (DbUpdateException ex)
            {
                if (ex.InnerException != null && ex.InnerException.Message.Contains("UIX_MaApDung_Not_Null"))
                {
                    return BadRequest(new { message = "Mã code này đã được sử dụng. Vui lòng nhập mã khác!" });
                }
                return StatusCode(500, new { message = "Lỗi SQL khi cập nhật khuyến mãi.", details = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống khi cập nhật khuyến mãi.", details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var km = await _context.KhuyenMais.FindAsync(id);
            if (km == null) return NotFound();
            _context.KhuyenMais.Remove(km);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class KhuyenMaiDto
    {
        public string? LoaiKM { get; set; }
        public string? TenKM { get; set; }
        public string? MoTa { get; set; }
        public string? MaApDung { get; set; }
        public string? LoaiGiamGia { get; set; }
        public decimal GiaTriGiam { get; set; }
        public decimal? GiamToiDa { get; set; }
        public decimal DonHangToiThieu { get; set; }
        public DateTime? ThoiGianBatDau { get; set; }
        public DateTime? ThoiGianKetThuc { get; set; }
        public int? SoLuongToiDa { get; set; }
        public bool? TrangThai { get; set; }
        public string? HangThanhVien { get; set; }
        public string? HinhAnh { get; set; }
        public List<KhuyenMaiDoiTuongDto>? DoiTuongs { get; set; }
    }

    public class KhuyenMaiDoiTuongDto
    {
        public int? MaSanPham { get; set; }
        public int? MaLoaiSP { get; set; }
        public decimal? GiaKhuyenMai { get; set; }
        public int? SoLuong { get; set; }
    }
}

