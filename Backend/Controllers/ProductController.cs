using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/products")]
    public class ProductController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly Services.INotificationService _notificationService;

        public ProductController(ApplicationDbContext ctx, Services.INotificationService notificationService) 
        { 
            _ctx = ctx; 
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? hang = null)
        {
            var now = DateTime.Now;

            // Lấy tất cả các chương trình khuyến mãi đang hoạt động (gồm cả Giá sốc và KM sản phẩm)
            var activePromos = await _ctx.KhuyenMais
                .Include(km => km.KhuyenMaiDoiTuongs)
                .Where(km => km.TrangThai && km.ThoiGianBatDau <= now && km.ThoiGianKetThuc >= now)
                .ToListAsync();


            var products = await _ctx.SanPhams
                .Include(p => p.LoaiSanPham)
                .Include(p => p.NhaCungCapSanPhams).ThenInclude(n => n.NhaCungCap)
                .Include(p => p.CTKhoHangs)
                .Where(p => p.TrangThai == true)
                .ToListAsync();

            var result = products.Select(p =>
            {
                // Tìm các khuyến mãi áp dụng cho sản phẩm này
                var productPromos = activePromos
                    .Where(km => km.KhuyenMaiDoiTuongs.Any(dt => dt.MaSanPham == p.MaSanPham || (dt.MaLoaiSP != null && dt.MaLoaiSP == p.MaLoaiSP)))
                    .ToList();

                // Ưu tiên 1: Giá sốc (FlashSale)
                var flashPromo = productPromos.FirstOrDefault(km => km.LoaiKM == "GiaSoc");
                var flashDetail = flashPromo?.KhuyenMaiDoiTuongs.FirstOrDefault(dt => dt.MaSanPham == p.MaSanPham);
                
                // Ưu tiên 2: Khuyến mãi sản phẩm / Thành viên
                var bestPromo = productPromos
                    .Where(km => km.LoaiKM == "SanPham" || km.LoaiKM == "ThanhVien")
                    .OrderByDescending(km => km.HangThanhVien == (Request.Headers.ContainsKey("X-Member-Rank") ? Request.Headers["X-Member-Rank"].ToString() : "Mới") ? 1 : 0) 
                    .ThenByDescending(km => km.LoaiGiamGia == "PhanTram" ? km.GiaTriGiam : 0) 
                    .FirstOrDefault();

                decimal giaSauKhuyenMai = p.GiaBan;
                string loaiGia = "GiaGoc";
                decimal? phanTramGiam = null;

                if (flashDetail != null && flashDetail.GiaKhuyenMai.HasValue)
                {
                    giaSauKhuyenMai = flashDetail.GiaKhuyenMai.Value;
                    phanTramGiam = p.GiaBan > 0 ? Math.Round((p.GiaBan - giaSauKhuyenMai) / p.GiaBan * 100, 0) : 0;
                    loaiGia = "FlashSale";
                }
                else if (bestPromo != null)
                {
                    if (bestPromo.LoaiGiamGia == "PhanTram")
                    {
                        giaSauKhuyenMai = p.GiaBan * (1 - bestPromo.GiaTriGiam / 100);
                        phanTramGiam = bestPromo.GiaTriGiam;
                    }
                    else if (bestPromo.LoaiGiamGia == "SoTien")
                    {
                        giaSauKhuyenMai = Math.Max(0, p.GiaBan - bestPromo.GiaTriGiam);
                        phanTramGiam = p.GiaBan > 0 ? Math.Round((bestPromo.GiaTriGiam / p.GiaBan) * 100, 0) : 0;
                    }
                    loaiGia = "KhuyenMai";
                }

                return new
                {
                    maSanPham = p.MaSanPham, maSP = p.MaSP, tenSP = p.TenSP,
                    moTa = p.MoTa, hinhAnh = p.HinhAnh,
                    anhPhu = string.IsNullOrEmpty(p.AnhPhu)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(p.AnhPhu) ?? new List<string>(),
                    donViTinh = p.DonViTinh,
                    giaBan = p.GiaBan,
                    giaSauKhuyenMai = Math.Round(giaSauKhuyenMai, 0),
                    phanTramGiam,
                    loaiGia,
                    hangApDung = bestPromo?.HangThanhVien,

                    giaNhap = p.GiaNhap, mucTonToiThieu = p.MucTonToiThieu,
                    ghiChu = p.GhiChu, maLoaiSP = p.MaLoaiSP,
                    thuongHieu = p.ThuongHieu, xuatXu = p.XuatXu,
                    tenLoai = p.LoaiSanPham != null ? p.LoaiSanPham.TenLoai : "",
                    trangThai = p.TrangThai, ngayTao = p.NgayTao,
                    trongLuong = p.TrongLuong,
                    donViTrongLuong = p.DonViTrongLuong,
                    kichThuoc = p.KichThuoc,
                    isGift = p.IsGift == true,
                    
                    nhaCungCaps = p.NhaCungCapSanPhams.Select(n => new {
                        maNCC = n.MaNCC,
                        tenNCC = n.NhaCungCap?.TenNCC,
                        giaCungCap = n.GiaCungCap
                    }).ToList(),
                    soLuongTon = p.CTKhoHangs.Sum(k => k.SoLuongTon)
                };
            });

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var p = await _ctx.SanPhams
                .Include(p => p.LoaiSanPham)
                .Include(p => p.NhaCungCapSanPhams).ThenInclude(n => n.NhaCungCap)
                .Include(p => p.CTKhoHangs)
                .FirstOrDefaultAsync(x => x.MaSanPham == id);

            if (p == null) return NotFound();

            var res = new
            {
                maSanPham = p.MaSanPham,
                maSP = p.MaSP,
                tenSP = p.TenSP,
                moTa = p.MoTa,
                hinhAnh = p.HinhAnh,
                anhPhu = string.IsNullOrEmpty(p.AnhPhu)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(p.AnhPhu) ?? new List<string>(),
                donViTinh = p.DonViTinh,
                giaBan = p.GiaBan,
                giaNhap = p.GiaNhap,
                mucTonToiThieu = p.MucTonToiThieu,
                ghiChu = p.GhiChu,
                maLoaiSP = p.MaLoaiSP,
                thuongHieu = p.ThuongHieu,
                xuatXu = p.XuatXu,
                tenLoai = p.LoaiSanPham?.TenLoai ?? "",
                trangThai = p.TrangThai,
                soLuongTon = p.CTKhoHangs.Sum(k => k.SoLuongTon),
                trongLuong = p.TrongLuong,
                donViTrongLuong = p.DonViTrongLuong,
                kichThuoc = p.KichThuoc,
                isGift = p.IsGift
            };

            return Ok(res);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SanPhamDto dto)
        {
            if (dto == null) return BadRequest("Dữ liệu không hợp lệ");
            var sp = new SanPham
            {
                TenSP = dto.TenSP ?? "", MoTa = dto.MoTa,
                HinhAnh = dto.HinhAnh, AnhPhu = dto.AnhPhu, DonViTinh = dto.DonViTinh,
                GiaBan = dto.GiaBan, GiaNhap = dto.GiaNhap, ThuongHieu = dto.ThuongHieu, XuatXu = dto.XuatXu,
                MaLoaiSP = dto.MaLoaiSP > 0 ? dto.MaLoaiSP : 1,
                MucTonToiThieu = dto.MucTonToiThieu, GhiChu = dto.GhiChu,
                TrangThai = dto.TrangThai, NgayTao = DateTime.UtcNow, NgayCapNhat = DateTime.UtcNow,
                TrongLuong = dto.TrongLuong, DonViTrongLuong = dto.DonViTrongLuong ?? "kg",
                KichThuoc = dto.KichThuoc, IsGift = dto.IsGift
            };
            _ctx.SanPhams.Add(sp);
            await _ctx.SaveChangesAsync();

            // Lưu danh sách nhà cung cấp
            if (dto.MaNhaCungCaps != null && dto.MaNhaCungCaps.Any())
            {
                foreach (var nccId in dto.MaNhaCungCaps)
                {
                    _ctx.NhaCungCapSanPhams.Add(new NhaCungCapSanPham
                    {
                        MaNCC = nccId,
                        MaSanPham = sp.MaSanPham,
                        GiaCungCap = sp.GiaNhap ?? 0,
                        NgayCapNhat = DateTime.UtcNow
                    });
                }
                await _ctx.SaveChangesAsync();
            }

            // 2. Tự động "Khai báo kho" cho sản phẩm mới (Tồn kho = 0)
            var defaultWarehouse = await _ctx.KhoHangs.FirstOrDefaultAsync();
            int warehouseId = defaultWarehouse?.MaKhoHang ?? 1;

            var initialStock = new CTKhoHang
            {
                MaKhoHang = warehouseId,
                MaSanPham = sp.MaSanPham,
                SoLuong = 0,
                SoLuongNhap = 0,
                SoLuongTon = 0,
                ViTri = "Chưa xếp kệ",
                NgayCapNhat = DateTime.UtcNow
            };
            _ctx.CTKhoHangs.Add(initialStock);
            await _ctx.SaveChangesAsync();

            return Ok(sp);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] SanPhamDto dto)
        {
            var sp = await _ctx.SanPhams.FindAsync(id);
            if (sp == null) return NotFound();

            // Ghi lịch sử nếu giá thay đổi
            if (dto.GiaBan != sp.GiaBan || dto.GiaNhap != sp.GiaNhap)
            {
                _ctx.LichSuGias.Add(new LichSuGia
                {
                    MaSanPham = id,
                    GiaBanCu = sp.GiaBan,
                    GiaBanMoi = dto.GiaBan,
                    GiaNhapCu = sp.GiaNhap,
                    GiaNhapMoi = dto.GiaNhap,
                    NguonThayDoi = "Cập nhật sản phẩm",
                    NgayThayDoi = DateTime.UtcNow
                });

                // Gửi thông báo hệ thống
                await _notificationService.SendNotificationAsync(
                    "Biến động giá sản phẩm",
                    $"Sản phẩm {sp.TenSP} vừa thay đổi giá bán thành {dto.GiaBan:N0}đ.",
                    "HeThong",
                    link: "/price-history"
                );
            }

            sp.TenSP = dto.TenSP ?? sp.TenSP;
            sp.MoTa = dto.MoTa; sp.HinhAnh = dto.HinhAnh; sp.AnhPhu = dto.AnhPhu; sp.DonViTinh = dto.DonViTinh;
            sp.GiaBan = dto.GiaBan; sp.GiaNhap = dto.GiaNhap; sp.ThuongHieu = dto.ThuongHieu; sp.XuatXu = dto.XuatXu;
            sp.MaLoaiSP = dto.MaLoaiSP > 0 ? dto.MaLoaiSP : sp.MaLoaiSP;
            sp.MucTonToiThieu = dto.MucTonToiThieu; sp.GhiChu = dto.GhiChu;
            sp.TrangThai = dto.TrangThai; sp.NgayCapNhat = DateTime.UtcNow;
            sp.TrongLuong = dto.TrongLuong; sp.DonViTrongLuong = dto.DonViTrongLuong ?? "kg";
            sp.KichThuoc = dto.KichThuoc; sp.IsGift = dto.IsGift;

            // Đồng bộ danh sách nhà cung cấp
            if (dto.MaNhaCungCaps != null)
            {
                var existing = await _ctx.NhaCungCapSanPhams.Where(x => x.MaSanPham == id).ToListAsync();
                _ctx.NhaCungCapSanPhams.RemoveRange(existing);

                foreach (var nccId in dto.MaNhaCungCaps)
                {
                    _ctx.NhaCungCapSanPhams.Add(new NhaCungCapSanPham
                    {
                        MaNCC = nccId,
                        MaSanPham = id,
                        GiaCungCap = sp.GiaNhap ?? 0,
                        NgayCapNhat = DateTime.UtcNow
                    });
                }
            }

            await _ctx.SaveChangesAsync();

            return Ok(sp);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var p = await _ctx.SanPhams.FindAsync(id);
            if (p == null) return NotFound();
            
            // Soft Delete: Chuyển trạng thái về false để ẩn khỏi UI nhưng giữ lịch sử
            p.TrangThai = false;
            p.NgayCapNhat = DateTime.UtcNow;
            
            await _ctx.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("export")]
        public async Task<IActionResult> Export()
        {
            var list = await _ctx.SanPhams.Include(p => p.LoaiSanPham).ToListAsync();
            using var package = new OfficeOpenXml.ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("SanPham");
            worksheet.Cells[1, 1].Value = "Id (Bỏ qua khi import mới)";
            worksheet.Cells[1, 2].Value = "Tên Sản Phẩm";
            worksheet.Cells[1, 3].Value = "Mô Tả";
            worksheet.Cells[1, 4].Value = "Hình Ảnh URL";
            worksheet.Cells[1, 5].Value = "Ảnh Phụ(JSON)";
            worksheet.Cells[1, 6].Value = "ĐVT";
            worksheet.Cells[1, 7].Value = "Giá Bán";
            worksheet.Cells[1, 8].Value = "Giá Nhập";
            worksheet.Cells[1, 9].Value = "Mã Loại SP (ID)";
            worksheet.Cells[1, 10].Value = "Mức Tồn Tối Thiểu";
            worksheet.Cells[1, 11].Value = "Ghi Chú";
            worksheet.Cells[1, 12].Value = "Trạng Thái (1/0)";
            worksheet.Cells[1, 13].Value = "Thương Hiệu";
            worksheet.Cells[1, 14].Value = "Xuất Xứ";
            worksheet.Cells[1, 15].Value = "Số Lượng Tồn Ban Đầu";
            worksheet.Cells[1, 16].Value = "Vị Trí Lưu Kho (VD: Kệ A)";
            worksheet.Cells["A1:P1"].Style.Font.Bold = true;

            for (int i = 0; i < list.Count; i++)
            {
                var item = list[i];
                worksheet.Cells[i + 2, 1].Value = item.MaSanPham;
                worksheet.Cells[i + 2, 2].Value = item.TenSP;
                worksheet.Cells[i + 2, 3].Value = item.MoTa;
                worksheet.Cells[i + 2, 4].Value = item.HinhAnh;
                worksheet.Cells[i + 2, 5].Value = item.AnhPhu;
                worksheet.Cells[i + 2, 6].Value = item.DonViTinh;
                worksheet.Cells[i + 2, 7].Value = item.GiaBan;
                worksheet.Cells[i + 2, 8].Value = item.GiaNhap;
                worksheet.Cells[i + 2, 9].Value = item.MaLoaiSP;
                worksheet.Cells[i + 2, 10].Value = item.MucTonToiThieu;
                worksheet.Cells[i + 2, 11].Value = item.GhiChu;
                worksheet.Cells[i + 2, 12].Value = item.TrangThai ? 1 : 0;
                worksheet.Cells[i + 2, 13].Value = item.ThuongHieu;
                worksheet.Cells[i + 2, 14].Value = item.XuatXu;
            }

            var stream = new MemoryStream();
            package.SaveAs(stream);
            stream.Position = 0;
            return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"SanPham_{DateTime.Now:yyyyMMddHHmmss}.xlsx");
        }

        [HttpPost("import")]
        public async Task<IActionResult> Import(IFormFile file)
        {
            try 
            {
                if (file == null || file.Length <= 0) return BadRequest("No file");
                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);
                using var package = new OfficeOpenXml.ExcelPackage(stream);
                var worksheet = package.Workbook.Worksheets.FirstOrDefault();
                if (worksheet == null) return BadRequest("No worksheet");

                var rowCount = worksheet.Dimension?.Rows ?? 0;
                int inserted = 0;
                int updated = 0;
                int skipped = 0;
                int stockInitialized = 0;
                var itemsToInitStock = new List<(SanPham sp, int qty, string location)>();

            for (int row = 2; row <= rowCount; row++)
            {
                var idStr = worksheet.Cells[row, 1].Value?.ToString();
                var ten = worksheet.Cells[row, 2].Value?.ToString();
                var moTa = worksheet.Cells[row, 3].Value?.ToString();
                var hinhAnh = worksheet.Cells[row, 4].Value?.ToString();
                var anhPhu = worksheet.Cells[row, 5].Value?.ToString();
                var dvt = worksheet.Cells[row, 6].Value?.ToString();
                decimal.TryParse(worksheet.Cells[row, 7].Value?.ToString(), out decimal giaBan);
                decimal.TryParse(worksheet.Cells[row, 8].Value?.ToString(), out decimal giaNhap);
                int.TryParse(worksheet.Cells[row, 9].Value?.ToString(), out int maLoaiSP);
                int.TryParse(worksheet.Cells[row, 10].Value?.ToString(), out int mucTonToiThieu);
                var ghiChu = worksheet.Cells[row, 11].Value?.ToString();
                var ttStr = worksheet.Cells[row, 12].Value?.ToString();
                var thuongHieuStr = worksheet.Cells[row, 13].Value?.ToString();
                var xuatXuStr = worksheet.Cells[row, 14].Value?.ToString();
                int.TryParse(worksheet.Cells[row, 15].Value?.ToString(), out int slTonBanDau);
                var viTriK = worksheet.Cells[row, 16].Value?.ToString();

                if (string.IsNullOrWhiteSpace(ten)) {
                    skipped++;
                    continue;
                }
                
                bool trangThai = ttStr == "1" || ttStr?.ToLower() == "true";

                if (int.TryParse(idStr, out int id) && id > 0)
                {
                    var existing = await _ctx.SanPhams.FindAsync(id);
                    if (existing != null)
                    {
                        existing.TenSP = ten; existing.MoTa = moTa; existing.HinhAnh = hinhAnh;
                        existing.AnhPhu = anhPhu; existing.DonViTinh = dvt;
                        existing.GiaBan = giaBan; existing.GiaNhap = giaNhap;
                        existing.ThuongHieu = thuongHieuStr; existing.XuatXu = xuatXuStr;
                        existing.MaLoaiSP = maLoaiSP > 0 ? maLoaiSP : existing.MaLoaiSP;
                        existing.MucTonToiThieu = mucTonToiThieu; existing.GhiChu = ghiChu;
                        existing.TrangThai = trangThai; existing.NgayCapNhat = DateTime.UtcNow;
                        updated++;
                        if (slTonBanDau > 0) itemsToInitStock.Add((existing, slTonBanDau, viTriK ?? ""));
                    }
                    else 
                    {
                        skipped++;
                    }
                }
                else
                {
                    var newSp = new SanPham
                    {
                        TenSP = ten, MoTa = moTa, HinhAnh = hinhAnh, AnhPhu = anhPhu,
                        DonViTinh = dvt, GiaBan = giaBan, GiaNhap = giaNhap,
                        ThuongHieu = thuongHieuStr, XuatXu = xuatXuStr,
                        MaLoaiSP = maLoaiSP > 0 ? maLoaiSP : 1, // Fallback to 1 if missing
                        MucTonToiThieu = mucTonToiThieu, GhiChu = ghiChu,
                        TrangThai = trangThai, NgayTao = DateTime.UtcNow, NgayCapNhat = DateTime.UtcNow
                    };
                    _ctx.SanPhams.Add(newSp);
                    inserted++;
                    if (slTonBanDau > 0) itemsToInitStock.Add((newSp, slTonBanDau, viTriK ?? ""));
                }
            }
            await _ctx.SaveChangesAsync();

            if (itemsToInitStock.Any())
            {
                var ncc = await _ctx.NhaCungCaps.FirstOrDefaultAsync();
                var khod = await _ctx.KhoHangs.FirstOrDefaultAsync();
                if (ncc == null) ncc = new NhaCungCap { TenNCC = "Nhà Cung Cấp Mặc Định", TrangThai = true, NgayTao=DateTime.UtcNow, NgayCapNhat=DateTime.UtcNow };
                if (khod == null) khod = new KhoHang { TenKho = "Kho Mặc Định", TrangThai = true, NgayTao=DateTime.UtcNow, NgayCapNhat=DateTime.UtcNow };
                
                if (ncc.MaNhaCungCap == 0) _ctx.NhaCungCaps.Add(ncc);
                if (khod.MaKhoHang == 0) _ctx.KhoHangs.Add(khod);
                if (ncc.MaNhaCungCap == 0 || khod.MaKhoHang == 0) await _ctx.SaveChangesAsync();

                var nv = await _ctx.NhanViens.FirstOrDefaultAsync();
                int nvId = nv?.MaNhanVien ?? 1;

                var pn = new PhieuNhap
                {
                    NgayNhap = DateTime.UtcNow,
                    NgayGiaoHang = DateTime.UtcNow,
                    TongTien = 0,
                    ThanhToan = 0,
                    TrangThai = "Đã Nhập Kho",
                    GhiChu = "Khởi tạo tồn kho đầu kỳ từ file Excel",
                    MaNhaCungCap = ncc.MaNhaCungCap,
                    MaNhanVien = nvId, // Get existing employee
                    NgayTao = DateTime.UtcNow,
                    NgayCapNhat = DateTime.UtcNow
                };
                _ctx.PhieuNhaps.Add(pn);
                await _ctx.SaveChangesAsync();
                
                decimal tongTien = 0;
                foreach (var item in itemsToInitStock)
                {
                    var exists = await _ctx.CTKhoHangs.AnyAsync(k => k.MaSanPham == item.sp.MaSanPham && k.MaKhoHang == khod.MaKhoHang);
                    if (!exists) 
                    {
                        var donGia = item.sp.GiaNhap ?? item.sp.GiaBan;
                        var ctpn = new CTPN {
                            MaPhieuNhap = pn.MaPhieuNhap,
                            MaSanPham = item.sp.MaSanPham,
                            SoLuong = item.qty,
                            DonGia = donGia,
                            ThanhTien = item.qty * donGia,
                            SoLuongDaNhan = item.qty,
                            NgayTao = DateTime.UtcNow
                        };
                        _ctx.CTPNs.Add(ctpn);

                        var ctkho = new CTKhoHang {
                            MaKhoHang = khod.MaKhoHang,
                            MaSanPham = item.sp.MaSanPham,
                            SoLuong = item.qty,
                            SoLuongNhap = item.qty,
                            SoLuongTon = item.qty,
                            ViTri = item.location,
                            NgayNhapCuoi = DateTime.UtcNow,
                            NgayCapNhat = DateTime.UtcNow
                        };
                        _ctx.CTKhoHangs.Add(ctkho);
                        tongTien += ctpn.ThanhTien ?? 0;
                        stockInitialized++;
                    }
                }
                pn.TongTien = tongTien;
                pn.ThanhToan = tongTien;
                await _ctx.SaveChangesAsync();
            }

            return Ok(new { message = $"Nhập Excel thành công! \nThêm mới: {inserted} \nCập nhật: {updated} \nBỏ qua ID lỗi: {skipped} \nKhởi tạo tồn kho gốc cho: {stockInitialized} mặt hàng." });
            }
            catch (Exception ex)
            {
                return Ok(new { message = $"LỖI DB: {ex.InnerException?.Message ?? ex.Message}" });
            }
        }
    }

    public class SanPhamDto
    {
        public string? MaSP { get; set; }
        public string? TenSP { get; set; }
        public string? MoTa { get; set; }
        public string? HinhAnh { get; set; }
        public string? AnhPhu { get; set; }
        public string? DonViTinh { get; set; }
        public decimal GiaBan { get; set; }
        public decimal? GiaNhap { get; set; }
        public int MaLoaiSP { get; set; }
        public int MucTonToiThieu { get; set; }
        public string? ThuongHieu { get; set; }
        public string? XuatXu { get; set; }
        public List<int>? MaNhaCungCaps { get; set; }
        public string? GhiChu { get; set; }
        public bool TrangThai { get; set; } = true;
        public decimal? TrongLuong { get; set; }
        public string? DonViTrongLuong { get; set; }
        public string? KichThuoc { get; set; }
        public bool IsGift { get; set; }
    }
}
