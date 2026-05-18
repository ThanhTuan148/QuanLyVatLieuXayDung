using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/returns")]
    public class ReturnController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;

        public ReturnController(ApplicationDbContext ctx)
        {
            _ctx = ctx;
        }

        [HttpPost("init-db")]
        public async Task<IActionResult> InitDb()
        {
            try {
                // Tạo bảng NCC nếu chưa có
                await _ctx.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PHIEUTRAHANG_NCC' and xtype='U')
                    BEGIN
                        CREATE TABLE PHIEUTRAHANG_NCC (
                            MaPhieuTra INT IDENTITY(1,1) PRIMARY KEY,
                            MaPT VARCHAR(50) NOT NULL,
                            MaPhieuNhap INT NOT NULL,
                            MaNhanVien INT NOT NULL,
                            NgayTra DATETIME DEFAULT GETDATE(),
                            TongTienHoan DECIMAL(18,0) DEFAULT 0,
                            LyDo NVARCHAR(MAX),
                            GhiChu NVARCHAR(MAX),
                            TrangThai NVARCHAR(100),
                            NgayTao DATETIME DEFAULT GETDATE(),
                            NgayCapNhat DATETIME DEFAULT GETDATE(),
                            CONSTRAINT FK_PhieuTraNCC_PhieuNhap FOREIGN KEY (MaPhieuNhap) REFERENCES PHIEUNHAP(MaPhieuNhap),
                            CONSTRAINT FK_PhieuTraNCC_NhanVien FOREIGN KEY (MaNhanVien) REFERENCES NHANVIEN(MaNhanVien)
                        );
                        
                        CREATE TABLE CT_PHIEUTRAHANG_NCC (
                            MaCTPT INT IDENTITY(1,1) PRIMARY KEY,
                            MaPhieuTra INT NOT NULL,
                            MaSanPham INT NOT NULL,
                            SoLuongTra INT NOT NULL,
                            DonGia DECIMAL(18,0) NOT NULL,
                            ThanhTien DECIMAL(18,0),
                            CONSTRAINT FK_CTPhieuTraNCC_PhieuTra FOREIGN KEY (MaPhieuTra) REFERENCES PHIEUTRAHANG_NCC(MaPhieuTra),
                            CONSTRAINT FK_CTPhieuTraNCC_SanPham FOREIGN KEY (MaSanPham) REFERENCES SANPHAM(MaSanPham)
                        );
                    END
                    ELSE
                    BEGIN
                        -- Nếu đã có bảng nhưng chưa có FK thì bổ sung
                        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_PhieuTraNCC_PhieuNhap')
                        BEGIN
                            ALTER TABLE PHIEUTRAHANG_NCC ADD CONSTRAINT FK_PhieuTraNCC_PhieuNhap FOREIGN KEY (MaPhieuNhap) REFERENCES PHIEUNHAP(MaPhieuNhap);
                        END
                        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_PhieuTraNCC_NhanVien')
                        BEGIN
                            ALTER TABLE PHIEUTRAHANG_NCC ADD CONSTRAINT FK_PhieuTraNCC_NhanVien FOREIGN KEY (MaNhanVien) REFERENCES NHANVIEN(MaNhanVien);
                        END
                        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_CTPhieuTraNCC_PhieuTra')
                        BEGIN
                            ALTER TABLE CT_PHIEUTRAHANG_NCC ADD CONSTRAINT FK_CTPhieuTraNCC_PhieuTra FOREIGN KEY (MaPhieuTra) REFERENCES PHIEUTRAHANG_NCC(MaPhieuTra);
                        END
                        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_CTPhieuTraNCC_SanPham')
                        BEGIN
                            ALTER TABLE CT_PHIEUTRAHANG_NCC ADD CONSTRAINT FK_CTPhieuTraNCC_SanPham FOREIGN KEY (MaSanPham) REFERENCES SANPHAM(MaSanPham);
                        END
                    END
                ");

                // Kiểm tra lại danh sách các FK đã thực sự có trong DB hay chưa
                var fkNames = new[] { "FK_PhieuTraNCC_PhieuNhap", "FK_PhieuTraNCC_NhanVien", "FK_CTPhieuTraNCC_PhieuTra", "FK_CTPhieuTraNCC_SanPham" };
                var existingFks = new List<string>();
                
                foreach(var name in fkNames) {
                    // Note: This is an ugly way to check but ExecuteSqlRawAsync doesn't return scalar easily
                    try {
                        await _ctx.Database.ExecuteSqlRawAsync("SELECT 1 FROM sys.foreign_keys WHERE name = {0}", name);
                        existingFks.Add(name); 
                    } catch { }
                }

                return Ok(new { 
                    message = "Khởi tạo bảng Thành Công!", 
                    fksCreated = existingFks,
                    totalFksCount = existingFks.Count
                });
            } catch (Exception ex) {
                return BadRequest(new { error = ex.Message, stack = ex.StackTrace });
            }
        }

        // ============================================
        // 1. MODULE: TRẢ HÀNG NHÀ CUNG CẤP (UC16)
        // ============================================

        [HttpGet("supplier")]
        public async Task<IActionResult> GetSupplierReturns()
        {
            var ds = await _ctx.PhieuTraHangNCCs
                .Include(p => p.NhanVien)
                .Include(p => p.PhieuNhap)
                .ThenInclude(pn => pn.NhaCungCap)
                .OrderByDescending(p => p.NgayTao)
                .AsSplitQuery()
                .Select(p => new
                {
                    maPhieuTra = p.MaPhieuTra,
                    maPT = p.MaPT,
                    maPhieuNhap = p.MaPhieuNhap,
                    maPN = p.PhieuNhap != null ? p.PhieuNhap.MaPN : "Unknown",
                    tenNhaCungCap = (p.PhieuNhap != null && p.PhieuNhap.NhaCungCap != null) ? p.PhieuNhap.NhaCungCap.TenNCC : "Unknown",
                    ngayTra = p.NgayTra,
                    tongTienHoan = p.TongTienHoan,
                    trangThai = p.TrangThai,
                    lyDo = p.LyDo,
                    tenNhanVien = p.NhanVien != null ? p.NhanVien.TenNV : "Unknown",
                    chiTiet = p.ChiTiet.Select(c => new {
                        maSanPham = c.MaSanPham,
                        tenSanPham = c.SanPham != null ? c.SanPham.TenSP : "Unknown",
                        soLuongTra = c.SoLuongTra,
                        donGia = c.DonGia
                    }).ToList()
                }).ToListAsync();
            return Ok(ds);
        }

        [HttpGet("supplier/pending-imports")]
        public async Task<IActionResult> GetPendingImportsForReturn()
        {
            // Lấy các phiếu nhập bị đánh dấu là Nhập Thiếu
            var pending = await _ctx.PhieuNhaps
                .Include(p => p.NhaCungCap)
                .Include(p => p.CTPNs).ThenInclude(c => c.SanPham)
                .Where(p => p.TrangThai == "Nhập Thiếu (Cần Đổi Trả)")
                .ToListAsync();

            var result = pending.Select(p => new {
                maPhieuNhap = p.MaPhieuNhap,
                maPN = p.MaPN,
                tenNhaCungCap = p.NhaCungCap?.TenNCC,
                ngayNhap = p.NgayNhap,
                chiTietLoi = p.CTPNs.Where(c => c.SoLuongDaNhan < c.SoLuong).Select(c => new {
                    maSanPham = c.MaSanPham,
                    tenSanPham = c.SanPham?.TenSP,
                    soLuongThieu = c.SoLuong - c.SoLuongDaNhan,
                    donGia = c.DonGia
                }).ToList()
            });

            return Ok(result);
        }

        [HttpPost("supplier")]
        public async Task<IActionResult> CreateSupplierReturn([FromBody] CreateSupplierReturnDto dto)
        {
            var pn = await _ctx.PhieuNhaps.Include(x => x.CTPNs).FirstOrDefaultAsync(x => x.MaPhieuNhap == dto.MaPhieuNhap);
            if (pn == null) return NotFound("Không tìm thấy phiếu nhập gốc.");

            var phieu = new PhieuTraHangNCC
            {
                MaPhieuNhap = dto.MaPhieuNhap,
                MaNhanVien = dto.MaNhanVien,
                NgayTra = DateTime.UtcNow,
                LyDo = dto.LyDo,
                TrangThai = "Chờ Duyệt Trả",
                NgayTao = DateTime.UtcNow,
                NgayCapNhat = DateTime.UtcNow
            };

            decimal tong = 0;
            var listCT = new List<CTPhieuTraHangNCC>();

            // Convert chi tiết lỗi
            var lackItems = pn.CTPNs.Where(c => c.SoLuongDaNhan < c.SoLuong).ToList();
            if(!lackItems.Any()) return BadRequest("Phiếu nhập này không có sản phẩm bị thiếu.");

            foreach(var item in lackItems)
            {
                int slLoi = item.SoLuong - item.SoLuongDaNhan;
                var tt = slLoi * item.DonGia;
                tong += tt;

                listCT.Add(new CTPhieuTraHangNCC {
                    MaSanPham = item.MaSanPham,
                    SoLuongTra = slLoi,
                    DonGia = item.DonGia,
                    ThanhTien = tt
                });
            }

            phieu.TongTienHoan = tong;
            _ctx.PhieuTraHangNCCs.Add(phieu);
            await _ctx.SaveChangesAsync();

            foreach(var c in listCT) c.MaPhieuTra = phieu.MaPhieuTra;
            _ctx.CTPhieuTraHangNCCs.AddRange(listCT);
            
            // Khi mới lập đề xuất, giữ nguyên trạng thái gốc của Phiếu Nhập (thường là Nhập Thiếu)
            // pn.TrangThai = "Đang Xử Lý Đổi Trả"; // Bỏ dòng này
            await _ctx.SaveChangesAsync();

            return Ok(new { message = "Lập đề xuất đổi/trả cho Nhà Cung Cấp thành công!" });
        }

        [HttpPut("supplier/{id}/approve")]
        public async Task<IActionResult> ApproveSupplierReturn(int id)
        {
            var p = await _ctx.PhieuTraHangNCCs.FindAsync(id);
            if (p == null) return NotFound();

            // Bước 2: Quản lý duyệt -> Chuyển sang trạng thái chờ hàng về
            p.TrangThai = "Đang Chờ Hàng Về";
            p.NgayCapNhat = DateTime.UtcNow;

            // Bước 2: Quản lý Duyệt -> Lúc này Phiếu Nhập mới chính thức chuyển sang "Đang Xử Lý"
            var pn = await _ctx.PhieuNhaps.FindAsync(p.MaPhieuNhap);
            if (pn != null)
            {
                pn.TrangThai = "Đang Xử Lý Đổi Trả";
            }

            await _ctx.SaveChangesAsync();

            return Ok(new { message = "Đã phê duyệt đề nghị đổi trả. Hệ thống đang chờ Nhân viên Kho xác nhận khi hàng về tới." });
        }

        [HttpPut("supplier/{id}/receive")]
        public async Task<IActionResult> ReceiveSupplierReturn(int id)
        {
            var p = await _ctx.PhieuTraHangNCCs
                .Include(x => x.PhieuNhap)
                .Include(x => x.ChiTiet)
                .FirstOrDefaultAsync(x => x.MaPhieuTra == id);
            
            if (p == null) return NotFound();
            if (string.IsNullOrEmpty(p.TrangThai) || !p.TrangThai.Contains("Chờ Hàng Về", StringComparison.OrdinalIgnoreCase)) 
                return BadRequest("Phiếu này chưa được duyệt hoặc đã hoàn tất trước đó.");

            using var transaction = await _ctx.Database.BeginTransactionAsync();
            try
            {
                foreach(var ct in p.ChiTiet)
                {
                    // Tìm kho dự kiến cũ từ phiếu nhập hoặc mặc định kho 1
                    // Để đơn giản, ta cộng vào bản ghi tồn kho đầu tiên tìm thấy hoặc tạo mới ở kho 1
                    var kho = await _ctx.CTKhoHangs.FirstOrDefaultAsync(k => k.MaSanPham == ct.MaSanPham);
                    if (kho != null)
                    {
                        kho.SoLuong += ct.SoLuongTra;
                        kho.SoLuongTon += ct.SoLuongTra;
                        kho.NgayCapNhat = DateTime.UtcNow;
                    }
                    else
                    {
                        _ctx.CTKhoHangs.Add(new CTKhoHang {
                            MaKhoHang = 1,
                            MaSanPham = ct.MaSanPham,
                            SoLuong = ct.SoLuongTra,
                            SoLuongTon = ct.SoLuongTra,
                            NgayCapNhat = DateTime.UtcNow
                        });
                    }
                }

                p.TrangThai = "Hoàn Tất";
                p.NgayCapNhat = DateTime.UtcNow;

                // CHỈ KHI NÀY MỚI CẬP NHẬT PHIẾU NHẬP LÀ ĐÃ XỬ LÝ XONG
                if (p.PhieuNhap != null)
                {
                    p.PhieuNhap.TrangThai = "Đã Xử Lý Đổi Trả";
                }
                
                await _ctx.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Xác nhận nhận hàng bù thành công. Tồn kho đã được cập nhật!" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi khi nhập kho hàng bù.", error = ex.Message });
            }
        }

        // ============================================
        // 1b. CHUẨN HÓA NCC: NHẬP BÙ TỪ NCC KHÁC
        // ============================================
        [HttpPut("supplier/{id}/pivot-supplier")]
        public async Task<IActionResult> PivotSupplierReturn(int id, [FromBody] PivotSupplierDto dto)
        {
            var p = await _ctx.PhieuTraHangNCCs
                .Include(x => x.PhieuNhap)
                .ThenInclude(pn => pn.NhaCungCap)
                .Include(x => x.ChiTiet)
                .FirstOrDefaultAsync(x => x.MaPhieuTra == id);

            if (p == null) return NotFound();
            if (p.TrangThai == "Hoàn Tất" || p.TrangThai == "Bị Từ Chối") return BadRequest("Phiếu này đã kết thúc, không thể chuyển NCC.");

            using var transaction = await _ctx.Database.BeginTransactionAsync();
            try
            {
                // 1. Cấn trừ công nợ NCC cũ (NCC A)
                // Vì NCC A không trả hàng bù, nên chúng ta sẽ trừ thẳng vào số tiền nợ họ (Coi như họ đã hoàn tiền cho phần hàng thiếu này)
                var congNoA = await _ctx.CongNos.FirstOrDefaultAsync(x => x.MaPhieuNhap == p.MaPhieuNhap);
                if (congNoA != null)
                {
                    decimal amountToRefund = p.TongTienHoan ?? 0; // Giá trị hàng thiếu ở giá gốc NCC A
                    congNoA.SoTienNo -= amountToRefund;
                    congNoA.SoTienConLai = (congNoA.SoTienNo < congNoA.SoTienDaTra) ? 0 : (congNoA.SoTienNo - congNoA.SoTienDaTra);
                    congNoA.GhiChu += $" | Trừ {amountToRefund:N0}đ do chuyển nhập bù sang NCC khác (Theo phiếu {p.MaPT})";
                    congNoA.NgayCapNhat = DateTime.UtcNow;

                    _ctx.ChiTietTraNos.Add(new ChiTietTraNo {
                        MaCongNo = congNoA.MaCongNo,
                        NgayTT = DateTime.Now,
                        SoTien = amountToRefund,
                        PTTT = "Cấn trừ hàng thiếu",
                        GhiChu = $"Khấu trừ hàng hóa không thể bù từ phiếu {p.MaPT}",
                        MaNhanVien = dto.UserId,
                        TrangThai = "Thành công",
                        NgayTao = DateTime.UtcNow
                    });
                }

                // 2. Tạo Phiếu Đề Xuất mới cho từng NCC mới (Nhiều NCC)
                var groups = dto.NewItems.GroupBy(x => x.NewSupplierId).ToList();
                var countToday = await _ctx.PhieuNhaps.CountAsync(x => x.NgayNhap.Date == DateTime.Today);
                List<string> dsPhieuMoi = new List<string>();

                foreach (var g in groups)
                {
                    countToday++;
                    var nhacungcapSelect = g.Key;
                    
                    var newPhieu = new PhieuNhap {
                        MaPN = $"PN{DateTime.Today:ddMMyy}{countToday:D3}",
                        MaNhanVien = dto.UserId,
                        MaNhaCungCap = nhacungcapSelect,
                        NgayNhap = DateTime.Now,
                        NgayCapNhat = DateTime.Now,
                        NgayTao = DateTime.Now,
                        TrangThai = "Đề Xuất (Nhập Bù)",
                        GhiChu = $"Nhập bù hàng thiếu từ phiếu {p.PhieuNhap?.MaPN}. ( NCC cũ: {p.PhieuNhap?.NhaCungCap?.TenNCC ?? p.PhieuNhap?.MaNhaCungCap.ToString()} )",
                        TongTien = g.Sum(x => x.Price * x.Quantity)
                    };
                    _ctx.PhieuNhaps.Add(newPhieu);
                    await _ctx.SaveChangesAsync();

                    foreach (var item in g)
                    {
                        var tt = item.Price * item.Quantity;
                        _ctx.CTPNs.Add(new CTPN
                        {
                            MaPhieuNhap = newPhieu.MaPhieuNhap,
                            MaSanPham = item.MaSanPham,
                            SoLuong = item.Quantity,
                            DonGia = item.Price,
                            ThanhTien = tt,
                            SoLuongDaNhan = 0,
                            MaNhaCungCap = nhacungcapSelect,
                            NgayTao = DateTime.UtcNow,
                            TrangThai = "Chờ Duyệt"
                        });
                    }
                    dsPhieuMoi.Add(newPhieu.MaPN);
                }

                // 3. Cập nhật phiếu trả hàng NCC cũ
                p.TrangThai = "Hoàn Tất (Chuyển NCC)";
                p.GhiChu += $" | Đã tách nhập bù sang các NCC mới: {string.Join(", ", dsPhieuMoi)}";
                p.NgayCapNhat = DateTime.UtcNow;

                // 4. Lịch sử phiếu nhập cũ
                if (p.PhieuNhap != null)
                {
                    p.PhieuNhap.TrangThai = "Đã Xử Lý Đổi Trả (Tách NCC)";
                    _ctx.LichSuPhieuNhaps.Add(new LichSuPhieuNhap {
                        MaPhieuNhap = p.MaPhieuNhap,
                        TrangThaiMoi = p.PhieuNhap.TrangThai,
                        NoiDungThayDoi = $"Đã tách nhập bù sang các NCC mới (Các phiếu: {string.Join(", ", dsPhieuMoi)}). Giá trị trừ nợ: {p.TongTienHoan:N0}đ",
                        MaNguoiThucHien = dto.UserId
                    });
                }

                await _ctx.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { 
                    message = "Đã chuyển mục nhập bù sang NCC mới thành công!", 
                    newMaPN = string.Join(", ", dsPhieuMoi)
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi khi chuyển đổi NCC nhập bù.", error = ex.Message });
            }
        }


        // ============================================
        // 2. MODULE: KHÁCH HÀNG ĐỔI TRẢ (UC16)
        // ============================================

        [HttpGet("customer")]
        public async Task<IActionResult> GetCustomerReturns()
        {
            var ds = await _ctx.PhieuDoiTras
                .Include(p => p.HoaDon).ThenInclude(h => h.KhachHang)
                .Include(p => p.NhanVien)
                .OrderByDescending(p => p.NgayTao)
                .AsSplitQuery()
                .Select(p => new {
                    maPhieuDT = p.MaPhieuDT,
                    maDT = p.MaDT,
                    maHoaDon = p.MaHoaDon,
                    maHD = p.HoaDon != null ? p.HoaDon.MaHD : "Unknown",
                    tenKhachHang = (p.HoaDon != null && p.HoaDon.KhachHang != null) ? p.HoaDon.KhachHang.TenKH : "Unknown",
                    ngayDT = p.NgayDT,
                    tongTienHoan = p.TongTienHoan,
                    lyDo = p.LyDo,
                    trangThai = p.TrangThai,
                    hinhAnhMinhChung = p.HinhAnhMinhChung,
                    trangThaiNhapKho = p.TrangThaiNhapKho,
                    loai = p.Loai,
                    tenNhanVien = p.NhanVien != null ? p.NhanVien.TenNV : "Unknown",
                    loiDo = p.LoiDo,
                    phiVanChuyenMoi = p.PhiVanChuyenMoi,
                    items = p.CTPhieuDoiTras.Select(c => new {
                        maCTDT = c.MaCTDT,
                        maSanPham = c.MaSanPham,
                        tenSanPham = c.SanPham != null ? c.SanPham.TenSP : "Unknown",
                        soLuong = c.SoLuong,
                        donGia = c.DonGia,
                        loai = c.Loai,
                        trangThai = c.TrangThai
                    }).ToList()
                }).ToListAsync();
            return Ok(ds);
        }

        [HttpGet("customer/by-order/{maHoaDon}")]
        public async Task<IActionResult> GetCandidateItems(int maHoaDon)
        {
            var hd = await _ctx.HoaDons.Include(x => x.CTHDs).ThenInclude(c => c.SanPham).FirstOrDefaultAsync(h => h.MaHoaDon == maHoaDon);
            if (hd == null) return NotFound("Hóa đơn không tồn tại.");

            var kq = hd.CTHDs.Select(c => new {
                maSanPham = c.MaSanPham,
                tenSanPham = c.SanPham?.TenSP,
                soLuongMua = c.SoLuong,
                donGia = c.DonGia
            }).ToList();
            return Ok(kq);
        }

        [HttpPost("customer")]
        public async Task<IActionResult> CreateCustomerReturn([FromBody] CreateCustomerReturnDto dto)
        {
            var hd = await _ctx.HoaDons.FindAsync(dto.MaHoaDon);
            if (hd == null) return NotFound("Hóa đơn không tồn tại.");

            // Ràng buộc 1: Mỗi hóa đơn chỉ được yêu cầu đổi trả 1 lần
            var existingReturn = await _ctx.PhieuDoiTras.AnyAsync(p => p.MaHoaDon == dto.MaHoaDon);
            if (existingReturn) return BadRequest("Đơn hàng này đã có yêu cầu đổi trả trước đó. Mỗi đơn hàng chỉ được yêu cầu đổi trả 1 lần duy nhất.");

            // Ràng buộc 2: Quy ước đổi trả hàng trong vòng 1 ngày (24h) kể từ khi hoàn thành
            if (hd.TrangThai == "Hoàn thành" && hd.NgayGiao != null)
            {
                var diff = DateTime.UtcNow - hd.NgayGiao.Value;
                if (diff.TotalHours > 24)
                {
                    return BadRequest("Đã quá thời hạn 24h để yêu cầu đổi trả hàng kể từ lúc nhận hàng thành công.");
                }
            }

            var phieu = new PhieuDoiTra {
                MaHoaDon = dto.MaHoaDon,
                MaNhanVien = dto.MaNhanVien,
                NgayDT = DateTime.UtcNow,
                LyDo = dto.LyDo,
                LoiDo = dto.LoiDo,
                TrangThai = "Chờ Xử Lý",
                HinhAnhMinhChung = dto.HinhAnhMinhChung,
                TrangThaiNhapKho = "Chưa nhập kho",
                NgayTao = DateTime.UtcNow,
                NgayCapNhat = DateTime.UtcNow
            };

            decimal tong = 0;
            var listCT = new List<CTPhieuDoiTra>();

            foreach(var it in dto.Items) {
                var tt = it.SoLuong * it.DonGia;
                tong += tt;
                listCT.Add(new CTPhieuDoiTra {
                    MaSanPham = it.MaSanPham,
                    SoLuong = it.SoLuong,
                    DonGia = it.DonGia,
                    ThanhTien = tt,
                    Loai = it.Loai,
                    NgayTao = DateTime.UtcNow
                });
            }

            phieu.TongTienHoan = tong;
            
            // Xác định loại phiếu tổng quát (Đổi/Trả/Hỗn hợp)
            var distinctTypes = dto.Items.Select(x => x.Loai).Distinct().ToList();
            phieu.Loai = distinctTypes.Count > 1 ? "Hỗn hợp" : (distinctTypes.FirstOrDefault() ?? "Trả hàng");

            _ctx.PhieuDoiTras.Add(phieu);
            await _ctx.SaveChangesAsync();

            // Gán MaPhieuDT cho chi tiết
            foreach(var c in listCT) c.MaPhieuDT = phieu.MaPhieuDT;
            _ctx.CTPhieuDoiTras.AddRange(listCT);

            // Cập nhật trạng thái hoá đơn
            string oldStatus = hd.TrangThai;
            hd.TrangThai = "Yêu cầu đổi/trả hàng";

            // Ghi lịch sử hóa đơn
            _ctx.LichSuHoaDons.Add(new LichSuHoaDon {
                MaHoaDon = dto.MaHoaDon,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = hd.TrangThai,
                NoiDungThayDoi = $"Khách hàng gửi yêu cầu {phieu.Loai} (Mã phiếu: {phieu.MaDT}). Lý do: {dto.LyDo}",
                MaNguoiThucHien = dto.MaNhanVien,
                NgayTao = DateTime.UtcNow
            });

            await _ctx.SaveChangesAsync();

            return Ok(new { message = $"Lập đề nghị Đổi/Trả thành công. Loại: {phieu.Loai}" });
        }

        [HttpPut("customer/{id}/approve")]
        public async Task<IActionResult> ApproveCustomerReturn(int id)
        {
            var p = await _ctx.PhieuDoiTras.FirstOrDefaultAsync(x => x.MaPhieuDT == id);
            if(p == null) return NotFound();
            if(p.TrangThai == "Hoàn Tất" || p.TrangThai == "Đã Duyệt") return BadRequest("Phiếu đã được duyệt hoặc hoàn tất trước đó.");

            p.TrangThai = p.Loai == "Đổi hàng" ? "Đã Duyệt - Chờ Giao Đổi" : "Đã Duyệt - Chờ Thu Hồi";
            p.NgayCapNhat = DateTime.UtcNow;

            // Ghi lịch sử hóa đơn
            _ctx.LichSuHoaDons.Add(new LichSuHoaDon {
                MaHoaDon = p.MaHoaDon,
                TrangThaiMoi = "Đang đổi trả",
                NoiDungThayDoi = $"Quản lý đã duyệt yêu cầu {p.Loai}. Trạng thái hiện tại: {p.TrangThai}",
                MaNguoiThucHien = 1, // Default admin/manager id
                NgayTao = DateTime.UtcNow
            });

            await _ctx.SaveChangesAsync();

            return Ok(new { message = $"Đã duyệt yêu cầu {p.Loai}. Hệ thống đã chuyển trạng thái sang: {p.TrangThai}" });
        }

        [HttpPut("customer/approve-items")]
        public async Task<IActionResult> ApproveCustomerReturnItems([FromBody] ApproveCustomerReturnItemsDto dto)
        {
            if (dto.MaCTDTs == null || !dto.MaCTDTs.Any()) return BadRequest("Không có mặt hàng nào được chọn.");

            var items = await _ctx.CTPhieuDoiTras.Where(x => dto.MaCTDTs.Contains(x.MaCTDT)).ToListAsync();
            if (!items.Any()) return NotFound("Không tìm thấy các mặt hàng được chọn.");

            string newStatus = dto.Status ?? "Đã Duyệt";

            foreach (var it in items)
            {
                it.TrangThai = newStatus;
            }

            var firstPhieu = await _ctx.PhieuDoiTras.FindAsync(items.First().MaPhieuDT);
            int maHoaDon = firstPhieu?.MaHoaDon ?? 0;

            // Cập nhật trạng thái phiếu cha
            var allItemsInPhieu = await _ctx.CTPhieuDoiTras.Where(x => x.MaPhieuDT == firstPhieu.MaPhieuDT).ToListAsync();
            if (allItemsInPhieu.All(x => x.TrangThai == "Đã Duyệt" || x.TrangThai == "Từ chối" || x.TrangThai == "Hoàn Tất"))
            {
                if (allItemsInPhieu.All(x => x.TrangThai == "Từ chối")) 
                    firstPhieu.TrangThai = "Từ chối";
                else if (allItemsInPhieu.All(x => x.TrangThai == "Hoàn Tất" || x.TrangThai == "Từ chối"))
                    firstPhieu.TrangThai = "Hoàn Tất";
                else
                    firstPhieu.TrangThai = "Đã Duyệt (Tất cả)";
            }
            else
            {
                firstPhieu.TrangThai = "Đang xử lý (Duyệt một phần)";
            }

            // --- TỰ ĐỘNG TẠO PHIẾU GIAO HÀNG ĐỂ ĐI THU HỒI / ĐỔI MỚI ---
            if (newStatus == "Đã Duyệt")
            {
                if (items.Any())
                {
                    var hd = await _ctx.HoaDons.FindAsync(maHoaDon);
                    if (hd != null)
                    {
                        hd.TrangThai = "Đang đổi trả"; 

                        var originalDelivery = await _ctx.PhieuGiaoHangs
                            .Where(x => x.MaHoaDon == maHoaDon && x.TrangThai == "Đã giao")
                            .OrderByDescending(x => x.NgayGiaoThucTe)
                            .FirstOrDefaultAsync();

                        int driverId = originalDelivery?.MaNhanVien ?? 0;
                        string driverName = originalDelivery?.NguoiGiao ?? "";

                        // Nếu không tìm thấy tài xế cũ, thử tìm tài xế 'taixe01' hoặc tài xế bất kỳ
                        if (driverId == 0)
                        {
                            var backupDriver = await _ctx.NhanViens
                                .Include(nv => nv.TaiKhoan).ThenInclude(tk => tk.VaiTro)
                                .Where(nv => nv.TaiKhoan.VaiTro.TenVT.Contains("Tài xế") || nv.TaiKhoan.TenTK == "taixe01")
                                .FirstOrDefaultAsync();
                            
                            if (backupDriver != null)
                            {
                                driverId = backupDriver.MaNhanVien;
                                driverName = backupDriver.TenNV;
                            }
                            else
                            {
                                driverId = 1; // Fallback cuối cùng
                                driverName = "Nhân viên điều phối";
                            }
                        }

                        var pg = new PhieuGiaoHang {
                            MaHoaDon = maHoaDon,
                            MaNhanVien = driverId,
                            NguoiGiao = driverName,
                            NgayGiao = DateTime.UtcNow,
                            NgayGiaoDuKien = DateTime.UtcNow.AddDays(1),
                            DiaChi = hd.DiaChiGiaoHang ?? "Tại cửa hàng",
                            TrangThai = "Chờ giao đổi/thu hồi",
                            GhiChu = $"Giao việc cho phiếu Đổi/Trả {firstPhieu.MaDT}. Vui lòng liên hệ khách.",
                            NgayTao = DateTime.UtcNow,
                            NgayCapNhat = DateTime.UtcNow
                        };
                        _ctx.PhieuGiaoHangs.Add(pg);
                        await _ctx.SaveChangesAsync();

                        foreach (var it in items)
                        {
                            _ctx.CTPhieuGiaoHangs.Add(new CTPhieuGiaoHang {
                                MaPhieuGH = pg.MaPhieuGH,
                                MaSanPham = it.MaSanPham,
                                SoLuongGiao = it.SoLuong,
                                GhiChu = it.Loai == "Đổi hàng" ? "Giao hàng mới & thu hồi hàng lỗi" : "Đến thu hồi hàng lỗi",
                                NgayTao = DateTime.UtcNow
                            });
                        }
                    }
                }
            }

            await _ctx.SaveChangesAsync();
            return Ok(new { message = $"Đã cập nhật trạng thái {newStatus} cho các mặt hàng được chọn." });
        }

        [HttpPut("customer/{id}/receive")]
        public async Task<IActionResult> ReceiveCustomerReturnPhysical(int id)
        {
            var p = await _ctx.PhieuDoiTras.Include(x => x.CTPhieuDoiTras).FirstOrDefaultAsync(x => x.MaPhieuDT == id);
            if(p == null) return NotFound();
            if((p.TrangThai ?? "") != "Đã Duyệt" && (p.TrangThai ?? "") != "Đã Duyệt (Tất cả)" && !(p.TrangThai ?? "").Contains("một phần")) 
                return BadRequest("Phiếu chưa được duyệt, không thể nhập kho.");
            
            if(p.TrangThaiNhapKho == "Đã nhập kho") return BadRequest("Phiếu này đã được nhập kho trước đó.");

            foreach(var ct in p.CTPhieuDoiTras.Where(x => x.TrangThai == "Đã Duyệt" || x.TrangThai == "Hoàn Tất")) {
                var kho = await _ctx.CTKhoHangs.FirstOrDefaultAsync(k => k.MaSanPham == ct.MaSanPham);
                if (kho != null) {
                    kho.SoLuong += ct.SoLuong; 
                    kho.SoLuongTon += ct.SoLuong;
                }
            }

            p.TrangThai = "Hoàn Tất";
            p.TrangThaiNhapKho = "Đã nhập kho";
            p.NgayCapNhat = DateTime.UtcNow;

            _ctx.LichSuHoaDons.Add(new LichSuHoaDon {
                MaHoaDon = p.MaHoaDon,
                TrangThaiMoi = "Hoàn tất",
                NoiDungThayDoi = $"Đã hoàn tất quy trình {p.Loai}. Hàng đã nhập kho.",
                MaNguoiThucHien = 1,
                NgayTao = DateTime.UtcNow
            });

            // --- TỰ ĐỘNG CẤN TRỪ CÔNG NỢ ---
            var congNo = await _ctx.CongNos.FirstOrDefaultAsync(cn => cn.MaHoaDon == p.MaHoaDon);
            if (congNo != null && p.TongTienHoan > 0)
            {
                decimal refundAmount = p.TongTienHoan ?? 0;
                
                // Trừ tiền nợ
                congNo.SoTienNo -= refundAmount;
                if (congNo.SoTienNo < 0) congNo.SoTienNo = 0;
                
                // Tính lại số tiền còn lại (nếu cần)
                congNo.SoTienConLai = congNo.SoTienNo - congNo.SoTienDaTra;
                if (congNo.SoTienConLai < 0) congNo.SoTienConLai = 0;
                
                congNo.NgayCapNhat = DateTime.UtcNow;
                congNo.GhiChu += $" | Cấn trừ {refundAmount:N0}đ từ phiếu đổi trả {p.MaDT}";

                // Ghi lịch sử thanh toán/cấn trừ
                _ctx.ChiTietTraNos.Add(new ChiTietTraNo {
                    MaCongNo = congNo.MaCongNo,
                    MaHoaDon = p.MaHoaDon,
                    NgayTT = DateTime.Now,
                    SoTien = refundAmount,
                    PTTT = "Cấn trừ hàng trả",
                    GhiChu = $"Hệ thống tự động khấu trừ giá trị hàng trả từ phiếu {p.MaDT}",
                    MaNhanVien = 1, // Mặc định hệ thống/admin
                    TrangThai = "Thành công",
                    NgayTao = DateTime.UtcNow
                });
            }

            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Xác nhận nhập kho và cấn trừ công nợ thành công!" });
        }
    }

    public class ApproveCustomerReturnItemsDto
    {
        public List<int> MaCTDTs { get; set; }
        public string? Status { get; set; }
    }

    public class CreateSupplierReturnDto {
        public int MaPhieuNhap { get; set; }
        public int MaNhanVien { get; set; }
        public string LyDo { get; set; }
    }

    public class CreateCustomerReturnDto {
        public int MaHoaDon { get; set; }
        public int MaNhanVien { get; set; }
        public string LyDo { get; set; }
        public string? LoiDo { get; set; } // "Khách hàng" hoặc "Cửa hàng"
        public string? HinhAnhMinhChung { get; set; }
        public string Loai { get; set; } 
        public List<RetItemDto> Items { get; set; }
    }
    public class RetItemDto {
        public int MaSanPham { get; set; }
        public int SoLuong { get; set; }
        public decimal DonGia { get; set; }
        public string Loai { get; set; } 
    }

    public class PivotSupplierDto {
        public int UserId { get; set; }
        public List<PivotItemDto> NewItems { get; set; }
    }

    public class PivotItemDto {
        public int MaSanPham { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public int NewSupplierId { get; set; }
    }
}
