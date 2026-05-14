using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.IO;

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
                    ngayNhapCuoi = c.NgayNhapCuoi,
                    mucTonToiThieu = c.SanPham != null ? c.SanPham.MucTonToiThieu : 0,
                    isGift = c.SanPham != null && c.SanPham.IsGift == true
                }).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var c = await _ctx.CTKhoHangs
                .Include(x => x.SanPham)
                .Include(x => x.KhoHang)
                .FirstOrDefaultAsync(x => x.MaCTKho == id);

            if (c == null) return NotFound();

            return Ok(new
            {
                maCTKho = c.MaCTKho,
                maKhoHang = c.MaKhoHang,
                tenKho = c.KhoHang != null ? c.KhoHang.TenKho : "",
                loaiKho = c.KhoHang != null ? c.KhoHang.LoaiKho : "Kho Khác",
                maSanPham = c.MaSanPham,
                tenSP = c.SanPham != null ? c.SanPham.TenSP : "",
                soLuong = c.SoLuong,
                soLuongNhap = c.SoLuongNhap,
                soLuongTon = c.SoLuongTon,
                ngayNhapCuoi = c.NgayNhapCuoi,
                mucTonToiThieu = c.SanPham != null ? c.SanPham.MucTonToiThieu : 0,
                isGift = c.SanPham != null && c.SanPham.IsGift == true
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CTKhoHangDto dto)
        {
            // Kiểm tra trùng lặp (Kho, Sản phẩm)
            var exists = await _ctx.CTKhoHangs.AnyAsync(x => x.MaKhoHang == dto.MaKhoHang && x.MaSanPham == dto.MaSanPham);
            if (exists) return BadRequest(new { message = "Sản phẩm này đã có bản ghi tồn kho trong kho này rồi. Vui lòng chọn kho khác hoặc chỉnh sửa bản ghi hiện có." });

            var ct = new CTKhoHang
            {
                MaKhoHang = dto.MaKhoHang, MaSanPham = dto.MaSanPham,
                SoLuong = dto.SoLuong, SoLuongNhap = dto.SoLuongNhap, SoLuongTon = dto.SoLuongTon,
                NgayNhapCuoi = dto.NgayNhapCuoi ?? DateTime.UtcNow,
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
            // Kiểm tra trùng lặp (Kho, Sản phẩm) - loại trừ bản ghi hiện tại
            var duplicate = await _ctx.CTKhoHangs.AnyAsync(x => x.MaKhoHang == dto.MaKhoHang && x.MaSanPham == dto.MaSanPham && x.MaCTKho != id);
            if (duplicate) return BadRequest(new { message = "Sản phẩm này đã tồn tại trong kho bạn vừa chọn. Bạn không thể chuyển mặt hàng sang kho này vì sẽ gây trùng lặp dữ liệu." });

            ct.MaKhoHang = dto.MaKhoHang; ct.MaSanPham = dto.MaSanPham;
            ct.SoLuong = dto.SoLuong; ct.SoLuongNhap = dto.SoLuongNhap; ct.SoLuongTon = dto.SoLuongTon;
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
                .Select(k => new { k.MaKhoHang, k.MaKho, k.TenKho, k.LoaiKho, k.DiaChi, k.GhiChu })
                .ToListAsync();
            return Ok(list);
        }

        [HttpPost("warehouses")]
        public async Task<IActionResult> CreateWarehouse([FromBody] WarehouseDto dto)
        {
            if (dto == null) return BadRequest("Dữ liệu không hợp lệ");
            
            var kho = new KhoHang
            {
                TenKho = dto.TenKho,
                LoaiKho = dto.LoaiKho,
                DiaChi = dto.DiaChi,
                GhiChu = dto.GhiChu,
                NgayTao = DateTime.UtcNow,
                NgayCapNhat = DateTime.UtcNow,
                TrangThai = true
            };

            _ctx.KhoHangs.Add(kho);
            await _ctx.SaveChangesAsync();
            return Ok(kho);
        }

        [HttpPut("warehouses/{id}")]
        public async Task<IActionResult> UpdateWarehouse(int id, [FromBody] WarehouseDto dto)
        {
            var kho = await _ctx.KhoHangs.FindAsync(id);
            if (kho == null) return NotFound();

            kho.TenKho = dto.TenKho;
            kho.LoaiKho = dto.LoaiKho;
            kho.DiaChi = dto.DiaChi;
            kho.GhiChu = dto.GhiChu;
            kho.NgayCapNhat = DateTime.UtcNow;

            await _ctx.SaveChangesAsync();
            return Ok(kho);
        }

        [HttpDelete("warehouses/{id}")]
        public async Task<IActionResult> DeleteWarehouse(int id)
        {
            var kho = await _ctx.KhoHangs.FindAsync(id);
            if (kho == null) return NotFound();

            // Kiểm tra xem kho có đang chứa hàng không
            var hasInventory = await _ctx.CTKhoHangs.AnyAsync(c => c.MaKhoHang == id);
            if (hasInventory) return BadRequest("Không thể xóa kho đang chứa hàng hóa. Vui lòng chuyển hàng hoặc xóa dữ liệu tồn kho trước.");

            _ctx.KhoHangs.Remove(kho);
            await _ctx.SaveChangesAsync();
            return NoContent();
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
                    idPhieuNhap = c.MaPhieuNhap,
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

        [HttpGet("outbound")]
        public async Task<IActionResult> GetOutbound()
        {
            var list = await _ctx.PhieuXuatKhos
                .Include(p => p.PhieuGiaoHang)
                .Include(p => p.HoaDon)
                .Include(p => p.NhanVien)
                .Include(p => p.ChiTiet).ThenInclude(ct => ct.SanPham)
                .Include(p => p.ChiTiet).ThenInclude(ct => ct.KhoHang)
                .OrderByDescending(p => p.NgayXuat)
                .Select(p => new {
                    maPhieuXK = p.MaPhieuXK,
                    maXK = p.MaXK,
                    ngayXuat = p.NgayXuat,
                    nguoiXuat = p.NguoiXuat,
                    ghiChu = p.GhiChu,
                    maGH = p.PhieuGiaoHang != null ? p.PhieuGiaoHang.MaGH : "N/A",
                    maHD = p.HoaDon != null ? p.HoaDon.MaHD : "N/A",
                    tenNhanVien = p.NhanVien != null ? p.NhanVien.TenNV : "Hệ thống",
                    trangThai = p.TrangThai ?? "Chờ duyệt",
                    maNguoiDuyet = p.MaNguoiDuyet,
                    ngayDuyet = p.NgayDuyet,
                    chiTiet = p.ChiTiet.Select(ct => new {
                        tenSanPham = ct.SanPham != null ? ct.SanPham.TenSP : "N/A",
                        soLuong = ct.SoLuong,
                        tenKho = ct.KhoHang != null ? ct.KhoHang.TenKho : "N/A",
                        donGiaVon = ct.DonGiaVon
                    })
                })
                .ToListAsync();
            return Ok(list);
        }
        [HttpPost("init-inventory-tables")]
        public async Task<IActionResult> InitInventoryTables()
        {
            try
            {
                await _ctx.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PHIEUXUATKHO')
                    BEGIN
                        CREATE TABLE PHIEUXUATKHO (
                            MaPhieuXK INT PRIMARY KEY IDENTITY(1,1),
                            MaXK AS ('PXK' + RIGHT('000000' + CAST(MaPhieuXK AS VARCHAR(6)), 6)) PERSISTED,
                            NgayXuat DATETIME NOT NULL,
                            NguoiXuat NVARCHAR(255),
                            GhiChu NVARCHAR(MAX),
                            MaPhieuGH INT NULL,
                            MaHoaDon INT NULL,
                            MaNhanVien INT NULL,
                            MaNguoiDuyet INT NULL,
                            NgayDuyet DATETIME NULL,
                            ChuKyNguoiLap NVARCHAR(MAX) NULL,
                            ChuKyQuanLy NVARCHAR(MAX) NULL,
                            MaNguoiXuatKho INT NULL,
                            ChuKyNguoiXuatKho NVARCHAR(MAX) NULL,
                            TrangThai NVARCHAR(50) DEFAULT N'Chờ duyệt',
                            NgayTao DATETIME DEFAULT GETUTCDATE()
                        );
                    END
                    ELSE
                    BEGIN
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PHIEUXUATKHO') AND name = 'MaNguoiDuyet')
                            ALTER TABLE PHIEUXUATKHO ADD MaNguoiDuyet INT NULL;
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PHIEUXUATKHO') AND name = 'NgayDuyet')
                            ALTER TABLE PHIEUXUATKHO ADD NgayDuyet DATETIME NULL;
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PHIEUXUATKHO') AND name = 'ChuKyNguoiLap')
                            ALTER TABLE PHIEUXUATKHO ADD ChuKyNguoiLap NVARCHAR(MAX) NULL;
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PHIEUXUATKHO') AND name = 'ChuKyQuanLy')
                            ALTER TABLE PHIEUXUATKHO ADD ChuKyQuanLy NVARCHAR(MAX) NULL;
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PHIEUXUATKHO') AND name = 'MaNguoiXuatKho')
                            ALTER TABLE PHIEUXUATKHO ADD MaNguoiXuatKho INT NULL;
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PHIEUXUATKHO') AND name = 'ChuKyNguoiXuatKho')
                            ALTER TABLE PHIEUXUATKHO ADD ChuKyNguoiXuatKho NVARCHAR(MAX) NULL;
                        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PHIEUXUATKHO') AND name = 'TrangThai')
                            ALTER TABLE PHIEUXUATKHO ADD TrangThai NVARCHAR(50) DEFAULT N'Chờ xuất';
                    END

                    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CTPHIEUXUATKHO' and xtype='U')
                    BEGIN
                        CREATE TABLE CTPHIEUXUATKHO (
                            MaCTXK INT IDENTITY(1,1) PRIMARY KEY,
                            MaPhieuXK INT NOT NULL,
                            MaSanPham INT NOT NULL,
                            SoLuong INT NOT NULL,
                            MaKho INT NULL,
                            DonGiaVon DECIMAL(18,0) DEFAULT 0,
                            CONSTRAINT FK_CTPXK_PhieuXK FOREIGN KEY (MaPhieuXK) REFERENCES PHIEUXUATKHO(MaPhieuXK),
                            CONSTRAINT FK_CTPXK_SanPham FOREIGN KEY (MaSanPham) REFERENCES SANPHAM(MaSanPham)
                        );
                    END
                ");
                return Ok(new { message = "Khởi tạo các bảng kho thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khởi tạo: " + ex.Message });
            }
        }

        [HttpPost("sync-old-outbound")]
        public async Task<IActionResult> SyncOldOutbound()
        {
            // Auto-init tables first to ensure columns exist
            await InitInventoryTables();

            using var transaction = await _ctx.Database.BeginTransactionAsync();
            try
            {
                // Find a default manager to assign to old records
                var defaultManager = await _ctx.NhanViens
                    .Include(n => n.TaiKhoan)
                    .ThenInclude(t => t.VaiTro)
                    .FirstOrDefaultAsync(n => n.TaiKhoan != null && (n.TaiKhoan.VaiTro.TenVT == "Quản lý" || n.TaiKhoan.VaiTro.TenVT == "Giám đốc"));

                // Fix existing records with NULL status
                if (defaultManager != null)
                {
                    await _ctx.Database.ExecuteSqlRawAsync(
                        "UPDATE PHIEUXUATKHO SET TrangThai = N'Đã duyệt', MaNguoiDuyet = {0}, ChuKyQuanLy = {1} WHERE TrangThai IS NULL OR MaNguoiDuyet IS NULL", 
                        defaultManager.MaNhanVien, defaultManager.ChuKy ?? (object)DBNull.Value);
                }
                else
                {
                    await _ctx.Database.ExecuteSqlRawAsync("UPDATE PHIEUXUATKHO SET TrangThai = N'Đã duyệt' WHERE TrangThai IS NULL");
                }

                int count = 0;

                // 1. Sync from existing Delivery Notes (PhieuGiaoHang)
                var pghs = await _ctx.PhieuGiaoHangs
                    .Include(p => p.CTPhieuGiaoHangs)
                    .Where(p => !_ctx.PhieuXuatKhos.Any(px => px.MaPhieuGH == p.MaPhieuGH))
                    .ToListAsync();

                foreach (var p in pghs)
                {
                    var creator = await _ctx.NhanViens.FindAsync(p.MaNhanVien);
                    var pxk = new PhieuXuatKho
                    {
                        MaPhieuGH = p.MaPhieuGH,
                        MaHoaDon = p.MaHoaDon,
                        MaNhanVien = p.MaNhanVien,
                        NgayXuat = p.NgayGiaoThucTe ?? p.NgayTao,
                        NgayTao = DateTime.UtcNow,
                        NguoiXuat = "Hệ thống (Đồng bộ dữ liệu cũ)",
                        GhiChu = $"Đồng bộ từ Phiếu giao {p.MaGH}",
                        ChuKyNguoiLap = creator?.ChuKy,
                        TrangThai = "Đã duyệt",
                        MaNguoiDuyet = defaultManager?.MaNhanVien,
                        ChuKyQuanLy = defaultManager?.ChuKy,
                        NgayDuyet = p.NgayGiaoThucTe ?? p.NgayTao
                    };
                    _ctx.PhieuXuatKhos.Add(pxk);
                    await _ctx.SaveChangesAsync();

                    foreach (var ct in p.CTPhieuGiaoHangs)
                    {
                        var sp = await _ctx.SanPhams.FindAsync(ct.MaSanPham);
                        var kho = await _ctx.CTKhoHangs.FirstOrDefaultAsync(k => k.MaSanPham == ct.MaSanPham);
                        _ctx.CTPhieuXuatKhos.Add(new CTPhieuXuatKho
                        {
                            MaPhieuXK = pxk.MaPhieuXK,
                            MaSanPham = ct.MaSanPham,
                            SoLuong = ct.SoLuongGiao,
                            MaKho = kho?.MaKhoHang ?? 1,
                            DonGiaVon = sp?.GiaNhap ?? 0
                        });
                    }
                    count++;
                }

                // 2. Sync from completed direct orders (HoaDon Hoàn thành, no PhieuGiaoHang)
                var hds = await _ctx.HoaDons
                    .Include(h => h.CTHDs)
                    .Where(h => h.TrangThai == "Hoàn thành")
                    .Where(h => !_ctx.PhieuGiaoHangs.Any(p => p.MaHoaDon == h.MaHoaDon))
                    .Where(h => !_ctx.PhieuXuatKhos.Any(px => px.MaHoaDon == h.MaHoaDon))
                    .ToListAsync();

                foreach (var h in hds)
                {
                    var creator = await _ctx.NhanViens.FindAsync(h.MaNhanVien);
                    var pxk = new PhieuXuatKho
                    {
                        MaHoaDon = h.MaHoaDon,
                        MaNhanVien = h.MaNhanVien,
                        NgayXuat = h.NgayGiao ?? h.NgayLap,
                        NgayTao = DateTime.UtcNow,
                        NguoiXuat = "Hệ thống (Đồng bộ dữ liệu cũ)",
                        GhiChu = $"Đồng bộ từ Đơn hàng trực tiếp {h.MaHD}",
                        ChuKyNguoiLap = creator?.ChuKy,
                        TrangThai = "Đã duyệt",
                        MaNguoiDuyet = defaultManager?.MaNhanVien,
                        ChuKyQuanLy = defaultManager?.ChuKy,
                        NgayDuyet = h.NgayGiao ?? h.NgayLap
                    };
                    _ctx.PhieuXuatKhos.Add(pxk);
                    await _ctx.SaveChangesAsync();

                    foreach (var ct in h.CTHDs)
                    {
                        var sp = await _ctx.SanPhams.FindAsync(ct.MaSanPham);
                        var kho = await _ctx.CTKhoHangs.FirstOrDefaultAsync(k => k.MaSanPham == ct.MaSanPham);
                        _ctx.CTPhieuXuatKhos.Add(new CTPhieuXuatKho
                        {
                            MaPhieuXK = pxk.MaPhieuXK,
                            MaSanPham = ct.MaSanPham,
                            SoLuong = ct.SoLuong,
                            MaKho = kho?.MaKhoHang ?? 1,
                            DonGiaVon = sp?.GiaNhap ?? 0
                        });
                    }
                    count++;
                }

                // 3. Optional: Fix existing 0 cost items
                var zeroCosts = await _ctx.CTPhieuXuatKhos
                    .Where(x => x.DonGiaVon == 0)
                    .Include(x => x.SanPham)
                    .ToListAsync();
                foreach (var z in zeroCosts)
                {
                    if (z.SanPham != null && z.SanPham.GiaNhap > 0)
                    {
                        z.DonGiaVon = z.SanPham.GiaNhap;
                    }
                }

                await _ctx.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = $"Đã đồng bộ thành công {count} phiếu và cập nhật lại giá vốn cho các mặt hàng cũ.", count });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi đồng bộ: " + ex.Message });
            }
        }

        [HttpPost("sync-old-inbound")]
        public async Task<IActionResult> SyncOldInbound()
        {
            using var transaction = await _ctx.Database.BeginTransactionAsync();
            try
            {
                int count = 0;
                // Tìm các phiếu nhập đã hoàn thành/đã nhập kho nhưng có thể chưa được cộng vào CTKhoHang
                // (Thường là các phiếu cũ hoặc được import từ Excel)
                var pns = await _ctx.PhieuNhaps
                    .Include(p => p.CTPNs)
                    .Where(p => p.TrangThai == "Hoàn Thành" || p.TrangThai == "Đã Nhập Kho")
                    .ToListAsync();

                foreach (var p in pns)
                {
                    // Kiểm tra xem phiếu này đã từng được "Nghiệm thu" (cộng kho) qua log chưa
                    bool alreadyReceived = await _ctx.LichSuPhieuNhaps.AnyAsync(l => l.MaPhieuNhap == p.MaPhieuNhap && l.NoiDungThayDoi.Contains("nghiệm thu"));
                    
                    // Nếu là phiếu import từ Excel (có ghi chú đặc thù) thì cũng coi như đã xong
                    if (p.GhiChu != null && p.GhiChu.Contains("Khởi tạo tồn kho đầu kỳ")) alreadyReceived = true;

                    if (!alreadyReceived)
                    {
                        foreach (var ct in p.CTPNs)
                        {
                            int maKhoTarget = ct.MaKhoHang ?? 1;
                            var kho = await _ctx.CTKhoHangs.FirstOrDefaultAsync(k => k.MaSanPham == ct.MaSanPham && k.MaKhoHang == maKhoTarget)
                                      ?? _ctx.CTKhoHangs.Local.FirstOrDefault(k => k.MaSanPham == ct.MaSanPham && k.MaKhoHang == maKhoTarget);
                            int slNhan = ct.SoLuongDaNhan > 0 ? ct.SoLuongDaNhan : ct.SoLuong;
                            
                            if (kho != null)
                            {
                                kho.SoLuong += slNhan;
                                kho.SoLuongTon += slNhan;
                                kho.SoLuongNhap += slNhan;
                                kho.NgayNhapCuoi = p.NgayNhap;
                            }
                            else
                            {
                                _ctx.CTKhoHangs.Add(new CTKhoHang {
                                    MaKhoHang = maKhoTarget,
                                    MaSanPham = ct.MaSanPham,
                                    SoLuong = slNhan,
                                    SoLuongTon = slNhan,
                                    SoLuongNhap = slNhan,
                                    NgayNhapCuoi = p.NgayNhap,
                                    NgayCapNhat = DateTime.UtcNow
                                });
                            }
                        }
                        
                        // Đảm bảo MaNhanVien hợp lệ để tránh lỗi FK trong LichSu
                        int? execId = p.MaNhanVien > 0 ? p.MaNhanVien : null;
                        if (execId == null) {
                            var firstManager = await _ctx.NhanViens.FirstOrDefaultAsync();
                            execId = firstManager?.MaNhanVien;
                        }

                        // Đánh dấu log để không sync lại lần sau
                        _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap {
                            MaPhieuNhap = p.MaPhieuNhap,
                            TrangThaiCu = p.TrangThai,
                            TrangThaiMoi = p.TrangThai,
                            NoiDungThayDoi = "Hệ thống đồng bộ dữ liệu tồn kho từ phiếu cũ.",
                            MaNguoiThucHien = execId,
                            NgayThayDoi = DateTime.UtcNow
                        });
                        count++;
                    }
                }

                await _ctx.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = $"Đã đồng bộ tồn kho thành công cho {count} phiếu nhập cũ.", count });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                var msg = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, new { message = "Lỗi đồng bộ nhập kho: " + msg });
            }
        }

        public class OutboundActionRequest
        {
            public int managerId { get; set; }
        }

        [HttpPost("{id}/confirm-export")]
        public async Task<IActionResult> ConfirmExport(int id, [FromBody] OutboundActionRequest body)
        {
            var p = await _ctx.PhieuXuatKhos.FindAsync(id);
            if (p == null) return NotFound();

            int managerId = body?.managerId ?? 0;
            var staff = await _ctx.NhanViens.FindAsync(managerId);
            if (staff == null) return BadRequest("Nhân viên không tồn tại");

            string oldStatus = p.TrangThai;
            p.TrangThai = "Chờ nhận"; 
            p.MaNguoiXuatKho = staff.MaNhanVien;
            p.ChuKyNguoiXuatKho = staff.ChuKy;
            
            _ctx.LichSuPhieuXuatKhos.Add(new LichSuPhieuXuatKho
            {
                MaPhieuXK = id,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = "Chờ nhận",
                NoiDungThayDoi = $"Thủ kho {staff.TenNV} xác nhận đã soạn hàng xong.",
                MaNguoiThucHien = staff.MaNhanVien,
                NgayTao = DateTime.UtcNow
            });

            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Thủ kho đã xuất hàng. Đang chờ tài xế xác nhận nhận hàng." });
        }

        [HttpPost("{id}/confirm-receipt")]
        public async Task<IActionResult> ConfirmReceipt(int id, [FromBody] ConfirmReceiptDto body)
        {
            var p = await _ctx.PhieuXuatKhos
                .Include(x => x.ChiTiet).ThenInclude(c => c.SanPham)
                .Include(x => x.PhieuGiaoHang)
                    .ThenInclude(gh => gh.CTPhieuGiaoHangs)
                .FirstOrDefaultAsync(x => x.MaPhieuXK == id);
            
            if (p == null) return NotFound();

            int driverId = body.ManagerId;
            var driver = await _ctx.NhanViens.FindAsync(driverId);
            if (driver == null) return BadRequest("Tài xế không tồn tại");

            bool isFull = true;
            string shortageNote = "";

            if (body.Items != null && body.Items.Any())
            {
                foreach (var item in body.Items)
                {
                    var ctxk = p.ChiTiet.FirstOrDefault(x => x.MaSanPham == item.MaSanPham);
                    if (ctxk != null)
                    {
                        ctxk.SoLuongThucNhan = item.SoLuongNhan;
                        ctxk.GhiChu = item.GhiChu;

                        if (item.SoLuongNhan < ctxk.SoLuong)
                        {
                            isFull = false;
                            shortageNote += $"Thiếu {ctxk.SanPham?.TenSP ?? "SP"}: {ctxk.SoLuong - item.SoLuongNhan}; ";
                        }
                    }
                }
            }

            string oldStatus = p.TrangThai;
            p.TrangThai = isFull ? "Đã xuất" : "Đã xuất (Thiếu hàng)";
            p.MaNguoiNhan = driverId;
            p.ChuKyNguoiNhan = driver.ChuKy;

            _ctx.LichSuPhieuXuatKhos.Add(new LichSuPhieuXuatKho
            {
                MaPhieuXK = id,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = p.TrangThai,
                NoiDungThayDoi = isFull ? $"Tài xế {driver.TenNV} xác nhận nhận đủ hàng." : $"Tài xế {driver.TenNV} xác nhận nhận thiếu hàng. {shortageNote}",
                MaNguoiThucHien = driver.MaNhanVien,
                NgayTao = DateTime.UtcNow
            });

            if (p.PhieuGiaoHang != null)
            {
                p.PhieuGiaoHang.TrangThai = isFull ? "Đang giao" : "Đang giao (Thiếu hàng)";
                p.PhieuGiaoHang.NgayCapNhat = DateTime.UtcNow;

                if (p.PhieuGiaoHang.CTPhieuGiaoHangs != null)
                {
                    foreach (var item in p.PhieuGiaoHang.CTPhieuGiaoHangs)
                    {
                        var receiptItem = body.Items?.FirstOrDefault(x => x.MaSanPham == item.MaSanPham);
                        if (receiptItem != null)
                        {
                            if (receiptItem.SoLuongNhan >= item.SoLuongGiao)
                                item.TrangThai = "Đang giao";
                            else if (receiptItem.SoLuongNhan > 0)
                                item.TrangThai = "Đang giao (Thiếu)";
                            else
                                item.TrangThai = "Chờ giao (Thiếu)";
                        }
                    }
                }

                // Cập nhật trạng thái Hóa đơn
                var hd = await _ctx.HoaDons.FindAsync(p.MaHoaDon);
                if (hd != null)
                {
                    hd.TrangThai = isFull ? "Đang giao" : "Đang giao (Thiếu hàng)";
                    hd.NgayCapNhat = DateTime.UtcNow;
                }
            }

            await _ctx.SaveChangesAsync();
            return Ok(new { 
                message = isFull ? "Đã nhận hàng đầy đủ. Đang đi giao." : "Xác nhận nhận hàng một phần. " + shortageNote,
                isFull = isFull
            });
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveOutbound(int id, [FromBody] OutboundActionRequest body)
        {
            var p = await _ctx.PhieuXuatKhos.FindAsync(id);
            if (p == null) return NotFound();

            int managerId = body?.managerId ?? 0;
            var manager = await _ctx.NhanViens.FindAsync(managerId);
            if (manager == null) return BadRequest("Quản lý không tồn tại.");

            string oldStatus = p.TrangThai;
            p.MaNguoiDuyet = managerId;
            p.NgayDuyet = DateTime.UtcNow;
            p.ChuKyQuanLy = manager.ChuKy;
            p.TrangThai = "Đã duyệt"; 

            _ctx.LichSuPhieuXuatKhos.Add(new LichSuPhieuXuatKho
            {
                MaPhieuXK = id,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = "Đã duyệt",
                NoiDungThayDoi = $"Quản lý {manager.TenNV} đã phê duyệt và ký số.",
                MaNguoiThucHien = manager.MaNhanVien,
                NgayTao = DateTime.UtcNow
            });

            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Đã phê duyệt và ký số phiếu xuất kho thành công." });
        }

        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetHistory(int id)
        {
            var history = await _ctx.LichSuPhieuXuatKhos
                .Where(h => h.MaPhieuXK == id)
                .Include(h => h.NhanVien)
                .OrderByDescending(h => h.NgayTao)
                .Select(h => new
                {
                    maLichSu = h.MaLichSu,
                    trangThaiCu = h.TrangThaiCu,
                    trangThaiMoi = h.TrangThaiMoi,
                    noiDungThayDoi = h.NoiDungThayDoi,
                    ngayTao = h.NgayTao,
                    tenNhanVien = h.NhanVien != null ? h.NhanVien.TenNV : "Hệ thống"
                })
                .ToListAsync();
            return Ok(history);
        }


        [HttpGet("export/{id}/pdf")]
        public async Task<IActionResult> ExportPdf(int id)
        {
            var p = await _ctx.PhieuXuatKhos
                .Include(x => x.PhieuGiaoHang)
                .Include(x => x.HoaDon)
                .Include(x => x.NhanVien)
                .Include(x => x.ChiTiet).ThenInclude(c => c.SanPham)
                .Include(x => x.ChiTiet).ThenInclude(c => c.KhoHang)
                .FirstOrDefaultAsync(x => x.MaPhieuXK == id);

            if (p == null) return NotFound();

            var pdf = GenerateOutboundDocument(p);

            var stream = new MemoryStream();
            pdf.GeneratePdf(stream);
            stream.Position = 0;
            return File(stream, "application/pdf", $"PhieuXuatKho_{p.MaXK}.pdf");
        }

        private QuestPDF.Infrastructure.IDocument GenerateOutboundDocument(PhieuXuatKho p)
        {
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
            return QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(QuestPDF.Helpers.PageSizes.A4);
                    page.Margin(1.5f, QuestPDF.Infrastructure.Unit.Centimetre);
                    page.PageColor(QuestPDF.Helpers.Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

                    // 1. Header
                    page.Header().Column(col =>
                    {
                        col.Item().Text("CỬA HÀNG VẬT LIỆU XÂY DỰNG THÀNH ĐẠT").FontSize(16).Bold().FontColor(QuestPDF.Helpers.Colors.Orange.Medium);
                        col.Item().Text("Địa chỉ: 829 Lạc Long Quân, Phường Bảy Hiền, Quận Tân Bình, Tp. Hồ Chí Minh");
                        col.Item().PaddingTop(15).AlignCenter().Text("PHIẾU XUẤT KHO").FontSize(20).ExtraBold();
                    });

                    // 2. Info Section
                    page.Content().PaddingVertical(10).Column(col =>
                    {
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text(t => { t.Span("Mã phiếu: ").Bold(); t.Span(p.MaXK); });
                                c.Item().Text(t => { t.Span("Ngày xuất: ").Bold(); t.Span(p.NgayXuat.ToString("dd/MM/yyyy HH:mm")); });
                                c.Item().Text(t => { t.Span("Người xuất: ").Bold(); t.Span(p.NguoiXuat ?? "Hệ thống"); });
                                c.Item().Text(t => { t.Span("Nhân viên thực hiện: ").Bold(); t.Span(p.NhanVien?.TenNV ?? "N/A"); });
                            });

                            row.ConstantItem(150).Column(c =>
                            {
                                if (p.PhieuGiaoHang != null)
                                    c.Item().Text(t => { t.Span("Mã giao hàng: ").Bold(); t.Span(p.PhieuGiaoHang.MaGH); });
                                if (p.HoaDon != null)
                                    c.Item().Text(t => { t.Span("Mã hóa đơn: ").Bold(); t.Span(p.HoaDon.MaHD); });
                            });
                        });

                        col.Item().PaddingTop(5).Text(t => { t.Span("Ghi chú: ").Bold(); t.Span(p.GhiChu ?? ""); });

                        // 3. Table
                        col.Item().PaddingTop(15).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(30);  // STT
                                columns.RelativeColumn();    // Tên sản phẩm
                                columns.ConstantColumn(60);  // Kho xuất
                                columns.ConstantColumn(50);  // Đơn vị
                                columns.ConstantColumn(60);  // Số lượng
                            });

                            table.Header(header =>
                            {
                                header.Cell().Element(HeaderStyle).Text("STT");
                                header.Cell().Element(HeaderStyle).Text("Tên sản phẩm");
                                header.Cell().Element(HeaderStyle).Text("Kho xuất");
                                header.Cell().Element(HeaderStyle).Text("ĐVT");
                                header.Cell().Element(HeaderStyle).AlignRight().Text("SL");

                                static QuestPDF.Infrastructure.IContainer HeaderStyle(QuestPDF.Infrastructure.IContainer container) 
                                    => container.Border(1).Background(QuestPDF.Helpers.Colors.Grey.Lighten4).PaddingVertical(5).AlignCenter().AlignMiddle().DefaultTextStyle(x => x.Bold().FontSize(10));
                            });

                            int i = 1;
                            decimal totalCost = 0;
                            foreach (var item in p.ChiTiet)
                            {
                                decimal rowCost = (item.DonGiaVon ?? 0) * item.SoLuong;
                                totalCost += rowCost;

                                table.Cell().Element(CellStyle).AlignCenter().Text(i++.ToString());
                                table.Cell().Element(CellStyle).Text(item.SanPham?.TenSP ?? "N/A");
                                table.Cell().Element(CellStyle).AlignCenter().Text(item.KhoHang?.TenKho ?? "N/A");
                                table.Cell().Element(CellStyle).AlignCenter().Text(item.SanPham?.DonViTinh ?? "");
                                table.Cell().Element(CellStyle).AlignRight().Text(item.SoLuong.ToString());

                                static QuestPDF.Infrastructure.IContainer CellStyle(QuestPDF.Infrastructure.IContainer container) 
                                    => container.Border(1).PaddingHorizontal(5).PaddingVertical(3).AlignMiddle();
                            }
                        });

                        // 4. Signatures
                        col.Item().PaddingTop(30).Row(row =>
                        {
                            // CỘT 1: TÀI XẾ (NGƯỜI NHẬN HÀNG)
                            row.RelativeItem().AlignCenter().Column(c =>
                            {
                                c.Item().Text("Tài xế nhận hàng").Bold();
                                c.Item().Text("(Ký khi nhận hàng)").FontSize(9).Italic();
                                
                                var driverSig = p.ChuKyNguoiNhan;
                                
                                if (!string.IsNullOrEmpty(driverSig))
                                {
                                    try {
                                        var fileName = Path.GetFileName(driverSig.TrimStart('/'));
                                        var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", driverSig.TrimStart('/'));
                                        if (!System.IO.File.Exists(path)) path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "signatures", fileName);
                                        if (!System.IO.File.Exists(path)) path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "signatures", fileName);

                                        if (System.IO.File.Exists(path))
                                            c.Item().PaddingTop(5).MaxHeight(50).Image(path);
                                        else
                                            c.Item().PaddingTop(10).Text(p.MaNguoiNhan.HasValue ? (_ctx.NhanViens.Find(p.MaNguoiNhan.Value)?.TenNV ?? "...") : "...");
                                    } catch {
                                        c.Item().PaddingTop(10).Text("...");
                                    }
                                }
                                else
                                {
                                    c.Item().PaddingTop(40).Text("..........................");
                                }
                                if (p.MaNguoiNhan.HasValue) {
                                    var driver = _ctx.NhanViens.Find(p.MaNguoiNhan.Value);
                                    c.Item().PaddingTop(5).Text(driver?.TenNV ?? "").FontSize(10).Bold();
                                }
                            });

                            // CỘT 2: THỦ KHO (NGƯỜI XUẤT KHO)
                            row.RelativeItem().AlignCenter().Column(c =>
                            {
                                c.Item().Text("Thủ kho").Bold();
                                c.Item().Text("(Ký khi xuất kho)").FontSize(9).Italic();

                                var keeperSig = p.ChuKyNguoiXuatKho;
                                
                                if (!string.IsNullOrEmpty(keeperSig))
                                {
                                    try {
                                        var fileName = Path.GetFileName(keeperSig.TrimStart('/'));
                                        var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", keeperSig.TrimStart('/'));
                                        if (!System.IO.File.Exists(path)) path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "signatures", fileName);
                                        if (!System.IO.File.Exists(path)) path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "signatures", fileName);

                                        if (System.IO.File.Exists(path))
                                            c.Item().PaddingTop(5).MaxHeight(50).Image(path);
                                        else
                                            c.Item().PaddingTop(10).Text(p.MaNguoiXuatKho.HasValue ? (_ctx.NhanViens.Find(p.MaNguoiXuatKho.Value)?.TenNV ?? "...") : "...");
                                    } catch {
                                        c.Item().PaddingTop(10).Text("...");
                                    }
                                }
                                else
                                {
                                    c.Item().PaddingTop(40).Text("..........................");
                                }
                                
                                if (p.MaNguoiXuatKho.HasValue) {
                                    var keeper = _ctx.NhanViens.Find(p.MaNguoiXuatKho.Value);
                                    c.Item().PaddingTop(5).Text(keeper?.TenNV ?? "").FontSize(10).Bold();
                                }
                            });

                            // CỘT 3: QUẢN LÝ (NGƯỜI PHÊ DUYỆT)
                            row.RelativeItem().AlignCenter().Column(c =>
                            {
                                c.Item().Text("Quản lý phê duyệt").Bold();
                                c.Item().Text("(Ký duyệt phiếu)").FontSize(9).Italic();
                                
                                var managerSig = p.ChuKyQuanLy;

                                if (!string.IsNullOrEmpty(managerSig))
                                {
                                    try {
                                        var fileName = Path.GetFileName(managerSig.TrimStart('/'));
                                        var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", managerSig.TrimStart('/'));
                                        if (!System.IO.File.Exists(path)) path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "signatures", fileName);
                                        if (!System.IO.File.Exists(path)) path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "signatures", fileName);

                                        if (System.IO.File.Exists(path))
                                            c.Item().PaddingTop(5).MaxHeight(50).Image(path);
                                        else
                                            c.Item().PaddingTop(10).Text(p.NguoiDuyet?.TenNV ?? "Đã duyệt");
                                    } catch {
                                        c.Item().PaddingTop(10).Text("Đã duyệt");
                                    }
                                }
                                else
                                {
                                    c.Item().PaddingTop(10).Text("Chưa phê duyệt").FontColor(QuestPDF.Helpers.Colors.Red.Medium).Bold();
                                    c.Item().PaddingTop(40).Text("..........................");
                                }
                                if (p.NguoiDuyet != null)
                                    c.Item().PaddingTop(5).Text(p.NguoiDuyet.TenNV).FontSize(10).Bold();
                                
                                if (p.NgayDuyet.HasValue)
                                    c.Item().Text($"Ngày: {p.NgayDuyet.Value.ToString("dd/MM/yyyy")}").FontSize(9);
                            });
                        });
                    });

                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Trang ");
                        x.CurrentPageNumber();
                    });
                });
            });
        }
    }

    public class CTKhoHangDto
    {
        public int MaKhoHang { get; set; }
        public int MaSanPham { get; set; }
        public int SoLuong { get; set; }
        public int SoLuongNhap { get; set; }
        public int SoLuongTon { get; set; }
        public DateTime? NgayNhapCuoi { get; set; }
    }

    public class WarehouseDto
    {
        public string? TenKho { get; set; }
        public string? LoaiKho { get; set; }
        public string? DiaChi { get; set; }
        public string? GhiChu { get; set; }
    }

    public class ConfirmReceiptDto
    {
        public int ManagerId { get; set; }
        public List<ReceiptItemDto>? Items { get; set; }
    }

    public class ReceiptItemDto
    {
        public int MaSanPham { get; set; }
        public int SoLuongNhan { get; set; }
        public string? GhiChu { get; set; }
    }
}
