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

            p.TrangThai = "Chờ nhận"; 
            p.MaNguoiXuatKho = staff.MaNhanVien;
            p.ChuKyNguoiXuatKho = staff.ChuKy;
            
            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Thủ kho đã xuất hàng. Đang chờ tài xế xác nhận nhận hàng." });
        }

        [HttpPost("{id}/confirm-receipt")]
        public async Task<IActionResult> ConfirmReceipt(int id, [FromBody] OutboundActionRequest body)
        {
            var p = await _ctx.PhieuXuatKhos
                .Include(x => x.PhieuGiaoHang)
                    .ThenInclude(gh => gh.CTPhieuGiaoHangs)
                .FirstOrDefaultAsync(x => x.MaPhieuXK == id);
            
            if (p == null) return NotFound();

            int driverId = body?.managerId ?? 0;
            var driver = await _ctx.NhanViens.FindAsync(driverId);
            if (driver == null) return BadRequest("Tài xế không tồn tại");

            p.TrangThai = "Đã xuất";
            p.MaNguoiNhan = driverId;
            p.ChuKyNguoiNhan = driver.ChuKy;

            if (p.PhieuGiaoHang != null)
            {
                p.PhieuGiaoHang.TrangThai = "Đang giao";
                p.PhieuGiaoHang.NgayCapNhat = DateTime.UtcNow;

                if (p.PhieuGiaoHang.CTPhieuGiaoHangs != null)
                {
                    foreach (var item in p.PhieuGiaoHang.CTPhieuGiaoHangs)
                    {
                        if (string.IsNullOrEmpty(item.TrangThai) || item.TrangThai.Trim() == "Chờ giao")
                        {
                            item.TrangThai = "Đang giao";
                        }
                    }
                }
            }

            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Tài xế đã nhận hàng thành công. Đơn hàng đang được đi giao." });
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveOutbound(int id, [FromBody] OutboundActionRequest body)
        {
            var p = await _ctx.PhieuXuatKhos.FindAsync(id);
            if (p == null) return NotFound();

            int managerId = body?.managerId ?? 0;
            var manager = await _ctx.NhanViens.FindAsync(managerId);
            if (manager == null) return BadRequest("Quản lý không tồn tại.");

            p.MaNguoiDuyet = managerId;
            p.NgayDuyet = DateTime.UtcNow;
            p.ChuKyQuanLy = manager.ChuKy;
            p.TrangThai = "Chờ xuất"; 

            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Đã phê duyệt và ký số phiếu xuất kho thành công." });
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
                            row.RelativeItem().AlignCenter().Column(c =>
                            {
                                c.Item().Text("Người nhận").Bold();
                                c.Item().Text("(Chữ ký số hoặc ký tên)").FontSize(9).Italic();
                                
                                var receiverSig = !string.IsNullOrEmpty(p.ChuKyNguoiLap) ? p.ChuKyNguoiLap : p.NhanVien?.ChuKy;
                                
                                if (!string.IsNullOrEmpty(receiverSig))
                                {
                                    try {
                                        var fileName = Path.GetFileName(receiverSig.TrimStart('/'));
                                        var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", receiverSig.TrimStart('/'));
                                        if (!System.IO.File.Exists(path))
                                            path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "signatures", fileName);
                                        if (!System.IO.File.Exists(path))
                                            path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "signatures", fileName);

                                        if (System.IO.File.Exists(path))
                                            c.Item().PaddingTop(5).MaxHeight(50).Image(path);
                                        else
                                            c.Item().PaddingTop(10).Text(p.NhanVien?.TenNV ?? "..........................");
                                    } catch {
                                        c.Item().PaddingTop(10).Text(p.NhanVien?.TenNV ?? "..........................");
                                    }
                                }
                                else
                                {
                                    c.Item().PaddingTop(40).Text("..........................");
                                }
                                c.Item().PaddingTop(5).Text(p.NhanVien?.TenNV ?? p.NguoiXuat).FontSize(10).Bold();
                            });

                            row.RelativeItem().AlignCenter().Column(c =>
                            {
                                c.Item().Text("Người xuất kho").Bold();
                                c.Item().Text("(Thủ kho ký)").FontSize(9).Italic();

                                var keeperSig = p.ChuKyNguoiXuatKho;
                                
                                if (!string.IsNullOrEmpty(keeperSig))
                                {
                                    try {
                                        var fileName = Path.GetFileName(keeperSig.TrimStart('/'));
                                        var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", keeperSig.TrimStart('/'));
                                        if (!System.IO.File.Exists(path))
                                            path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "signatures", fileName);
                                        if (!System.IO.File.Exists(path))
                                            path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "signatures", fileName);

                                        if (System.IO.File.Exists(path))
                                            c.Item().PaddingTop(5).MaxHeight(50).Image(path);
                                        else
                                            c.Item().PaddingTop(10).Text("..........................");
                                    } catch {
                                        c.Item().PaddingTop(10).Text("..........................");
                                    }
                                }
                                else
                                {
                                    c.Item().PaddingTop(40).Text("..........................");
                                }
                                
                                if (p.MaNguoiXuatKho.HasValue) {
                                    var keeper = _ctx.NhanViens.Find(p.MaNguoiXuatKho.Value);
                                    c.Item().PaddingTop(5).Text(keeper?.TenNV ?? "..........................").FontSize(10).Bold();
                                } else {
                                    c.Item().PaddingTop(5).Text("..........................").FontSize(10).Bold();
                                }
                            });

                            row.RelativeItem().AlignCenter().Column(c =>
                            {
                                c.Item().Text("Quản lý phê duyệt").Bold();
                                c.Item().Text("(Chữ ký số)").FontSize(9).Italic();
                                // Fallback to current manager signature if record's signature is empty
                                var managerSig = !string.IsNullOrEmpty(p.ChuKyQuanLy) ? p.ChuKyQuanLy : p.NguoiDuyet?.ChuKy;

                                if (!string.IsNullOrEmpty(managerSig) && p.TrangThai == "Đã duyệt")
                                {
                                    try {
                                        var fileName = Path.GetFileName(managerSig.TrimStart('/'));
                                        var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", managerSig.TrimStart('/'));
                                        if (!System.IO.File.Exists(path))
                                            path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "signatures", fileName);
                                        if (!System.IO.File.Exists(path))
                                            path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "signatures", fileName);

                                        if (System.IO.File.Exists(path))
                                            c.Item().PaddingTop(5).MaxHeight(50).Image(path);
                                        else
                                            c.Item().PaddingTop(10).Text(p.NguoiDuyet?.TenNV ?? "..........................");
                                    } catch {
                                        c.Item().PaddingTop(10).Text(p.NguoiDuyet?.TenNV ?? "..........................");
                                    }
                                }
                                else
                                {
                                    c.Item().PaddingTop(10).Text(p.TrangThai == "Đã duyệt" ? (p.NguoiDuyet?.TenNV ?? "Đã duyệt") : "Chưa phê duyệt").FontColor(QuestPDF.Helpers.Colors.Red.Medium).Bold();
                                    c.Item().PaddingTop(40).Text("..........................");
                                }
                                if (p.NgayDuyet.HasValue)
                                    c.Item().Text($"Ngày: {p.NgayDuyet.Value.ToString("dd/MM/yyyy")}").FontSize(9);
                                else if (p.TrangThai == "Đã duyệt")
                                    c.Item().Text($"Ngày: {p.NgayXuat.ToString("dd/MM/yyyy")}").FontSize(9);
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
        public string? ViTri { get; set; }
        public DateTime? NgayNhapCuoi { get; set; }
    }
}
