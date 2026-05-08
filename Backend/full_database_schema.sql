IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [COUPON] (
    [MaCoupon] int NOT NULL IDENTITY,
    [MaCP] nvarchar(max) NULL,
    [Code] nvarchar(50) NOT NULL,
    [LoaiCoupon] nvarchar(20) NOT NULL,
    [GiaTriGiam] decimal(18,2) NOT NULL,
    [DonHangToiThieu] decimal(18,2) NOT NULL,
    [GiamToiDa] decimal(18,2) NULL,
    [NgayBatDau] datetime2 NOT NULL,
    [NgayKetThuc] datetime2 NOT NULL,
    [SoLanDungToiDa] int NULL,
    [SoLanDaDung] int NOT NULL,
    [TrangThai] bit NOT NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_COUPON] PRIMARY KEY ([MaCoupon])
);
GO

CREATE TABLE [FLASHSALE] (
    [MaFlashSale] int NOT NULL IDENTITY,
    [TieuDe] nvarchar(max) NOT NULL,
    [MoTa] nvarchar(max) NULL,
    [ThoiGianBatDau] datetime2 NOT NULL,
    [ThoiGianKetThuc] datetime2 NOT NULL,
    [TrangThai] bit NOT NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NULL,
    CONSTRAINT [PK_FLASHSALE] PRIMARY KEY ([MaFlashSale])
);
GO

CREATE TABLE [KHOHANG] (
    [MaKhoHang] int NOT NULL IDENTITY,
    [MaKho] nvarchar(max) NOT NULL,
    [TenKho] nvarchar(max) NOT NULL,
    [DiaChi] nvarchar(max) NULL,
    [GhiChu] nvarchar(max) NULL,
    [TrangThai] bit NOT NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_KHOHANG] PRIMARY KEY ([MaKhoHang])
);
GO

CREATE TABLE [KHUYENMAI] (
    [MaKhuyenMai] int NOT NULL IDENTITY,
    [MaKM] nvarchar(max) NULL,
    [TenKM] nvarchar(max) NOT NULL,
    [MoTa] nvarchar(max) NULL,
    [PhanTramGiam] decimal(18,2) NULL,
    [SoTienGiam] decimal(18,2) NULL,
    [ThoiGianBatDau] datetime2 NULL,
    [ThoiGianKetThuc] datetime2 NULL,
    [SoLanToiDa] int NULL,
    [SoLanDaDung] int NOT NULL,
    [TrangThai] bit NOT NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    [HangThanhVien] nvarchar(max) NULL,
    CONSTRAINT [PK_KHUYENMAI] PRIMARY KEY ([MaKhuyenMai])
);
GO

CREATE TABLE [LOAISANPHAM] (
    [MaLoaiSP] int NOT NULL IDENTITY,
    [MaLoai] nvarchar(max) NOT NULL,
    [TenLoai] nvarchar(max) NOT NULL,
    [MoTa] nvarchar(max) NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_LOAISANPHAM] PRIMARY KEY ([MaLoaiSP])
);
GO

CREATE TABLE [NHACUNGCAP] (
    [MaNhaCungCap] int NOT NULL IDENTITY,
    [MaNCC] nvarchar(max) NOT NULL,
    [TenNCC] nvarchar(max) NOT NULL,
    [NguoiLienHe] nvarchar(max) NULL,
    [Sdt] nvarchar(max) NULL,
    [Email] nvarchar(max) NULL,
    [DiaChi] nvarchar(max) NULL,
    [ThanhPho] nvarchar(max) NULL,
    [MaSoThue] nvarchar(max) NULL,
    [TrangThai] bit NOT NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_NHACUNGCAP] PRIMARY KEY ([MaNhaCungCap])
);
GO

CREATE TABLE [QUYEN] (
    [MaQuyen] int NOT NULL IDENTITY,
    [MaQ] nvarchar(max) NOT NULL,
    [TenQ] nvarchar(max) NOT NULL,
    [MoTa] nvarchar(max) NULL,
    [NgayTao] datetime2 NOT NULL,
    CONSTRAINT [PK_QUYEN] PRIMARY KEY ([MaQuyen])
);
GO

CREATE TABLE [VAITRO] (
    [MaVaiTro] int NOT NULL IDENTITY,
    [MaVT] nvarchar(max) NOT NULL,
    [TenVT] nvarchar(max) NOT NULL,
    [MoTa] nvarchar(max) NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_VAITRO] PRIMARY KEY ([MaVaiTro])
);
GO

CREATE TABLE [SANPHAM] (
    [MaSanPham] int NOT NULL IDENTITY,
    [MaSP] nvarchar(max) NOT NULL,
    [TenSP] nvarchar(max) NOT NULL,
    [MoTa] nvarchar(max) NULL,
    [HinhAnh] nvarchar(max) NULL,
    [AnhPhu] nvarchar(max) NULL,
    [DonViTinh] nvarchar(max) NULL,
    [GiaBan] decimal(18,2) NOT NULL,
    [GiaNhap] decimal(18,2) NULL,
    [MucTonToiThieu] int NOT NULL,
    [GhiChu] nvarchar(max) NULL,
    [MaLoaiSP] int NOT NULL,
    [TrangThai] bit NOT NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_SANPHAM] PRIMARY KEY ([MaSanPham]),
    CONSTRAINT [FK_SANPHAM_LOAISANPHAM_MaLoaiSP] FOREIGN KEY ([MaLoaiSP]) REFERENCES [LOAISANPHAM] ([MaLoaiSP]) ON DELETE NO ACTION
);
GO

CREATE TABLE [PHANQUYEN] (
    [MaPhanQuyen] int NOT NULL IDENTITY,
    [MaVaiTro] int NOT NULL,
    [MaQuyen] int NOT NULL,
    CONSTRAINT [PK_PHANQUYEN] PRIMARY KEY ([MaPhanQuyen]),
    CONSTRAINT [FK_PHANQUYEN_QUYEN_MaQuyen] FOREIGN KEY ([MaQuyen]) REFERENCES [QUYEN] ([MaQuyen]) ON DELETE CASCADE,
    CONSTRAINT [FK_PHANQUYEN_VAITRO_MaVaiTro] FOREIGN KEY ([MaVaiTro]) REFERENCES [VAITRO] ([MaVaiTro]) ON DELETE CASCADE
);
GO

CREATE TABLE [TAIKHOAN] (
    [MaTaiKhoan] int NOT NULL IDENTITY,
    [MaTK] nvarchar(max) NOT NULL,
    [TenTK] nvarchar(max) NOT NULL,
    [MatKhau] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [MaVaiTro] int NOT NULL,
    [TrangThai] bit NOT NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    [DangNhapCuoi] datetime2 NULL,
    [ResetOTP] nvarchar(max) NULL,
    [OTPExpiry] datetime2 NULL,
    CONSTRAINT [PK_TAIKHOAN] PRIMARY KEY ([MaTaiKhoan]),
    CONSTRAINT [FK_TAIKHOAN_VAITRO_MaVaiTro] FOREIGN KEY ([MaVaiTro]) REFERENCES [VAITRO] ([MaVaiTro]) ON DELETE NO ACTION
);
GO

CREATE TABLE [CTFLASHSALE] (
    [MaCTFlashSale] int NOT NULL IDENTITY,
    [MaFlashSale] int NOT NULL,
    [MaSanPham] int NOT NULL,
    [GiaKhuyenMai] decimal(18,2) NOT NULL,
    [PhanTramGiam] decimal(18,2) NOT NULL,
    [SoLuong] int NOT NULL,
    [DaBan] int NOT NULL,
    [NgayTao] datetime2 NOT NULL,
    CONSTRAINT [PK_CTFLASHSALE] PRIMARY KEY ([MaCTFlashSale]),
    CONSTRAINT [FK_CTFLASHSALE_FLASHSALE_MaFlashSale] FOREIGN KEY ([MaFlashSale]) REFERENCES [FLASHSALE] ([MaFlashSale]) ON DELETE CASCADE,
    CONSTRAINT [FK_CTFLASHSALE_SANPHAM_MaSanPham] FOREIGN KEY ([MaSanPham]) REFERENCES [SANPHAM] ([MaSanPham]) ON DELETE CASCADE
);
GO

CREATE TABLE [CTKHOHANG] (
    [MaCTKho] int NOT NULL IDENTITY,
    [MaKhoHang] int NOT NULL,
    [MaSanPham] int NOT NULL,
    [SoLuong] int NOT NULL,
    [SoLuongNhap] int NOT NULL,
    [SoLuongTon] int NOT NULL,
    [ViTri] nvarchar(max) NULL,
    [NgayNhapCuoi] datetime2 NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_CTKHOHANG] PRIMARY KEY ([MaCTKho]),
    CONSTRAINT [FK_CTKHOHANG_KHOHANG_MaKhoHang] FOREIGN KEY ([MaKhoHang]) REFERENCES [KHOHANG] ([MaKhoHang]) ON DELETE CASCADE,
    CONSTRAINT [FK_CTKHOHANG_SANPHAM_MaSanPham] FOREIGN KEY ([MaSanPham]) REFERENCES [SANPHAM] ([MaSanPham]) ON DELETE CASCADE
);
GO

CREATE TABLE [KHUYENMAI_SANPHAM] (
    [MaKMSP] int NOT NULL IDENTITY,
    [MaKhuyenMai] int NOT NULL,
    [MaSanPham] int NOT NULL,
    CONSTRAINT [PK_KHUYENMAI_SANPHAM] PRIMARY KEY ([MaKMSP]),
    CONSTRAINT [FK_KHUYENMAI_SANPHAM_KHUYENMAI_MaKhuyenMai] FOREIGN KEY ([MaKhuyenMai]) REFERENCES [KHUYENMAI] ([MaKhuyenMai]) ON DELETE CASCADE,
    CONSTRAINT [FK_KHUYENMAI_SANPHAM_SANPHAM_MaSanPham] FOREIGN KEY ([MaSanPham]) REFERENCES [SANPHAM] ([MaSanPham]) ON DELETE CASCADE
);
GO

CREATE TABLE [KHACHHANG] (
    [MaKhachHang] int NOT NULL IDENTITY,
    [MaKH] nvarchar(max) NOT NULL,
    [TenKH] nvarchar(max) NOT NULL,
    [Sdt] nvarchar(max) NULL,
    [Email] nvarchar(max) NULL,
    [DiaChi] nvarchar(max) NULL,
    [LoaiKH] nvarchar(max) NULL,
    [MaSoThue] nvarchar(max) NULL,
    [NguoiLienHe] nvarchar(max) NULL,
    [MaTaiKhoan] int NULL,
    [TrangThai] bit NOT NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    [HangThanhVien] nvarchar(max) NOT NULL,
    [TongChiTieu] decimal(18,2) NOT NULL,
    CONSTRAINT [PK_KHACHHANG] PRIMARY KEY ([MaKhachHang]),
    CONSTRAINT [FK_KHACHHANG_TAIKHOAN_MaTaiKhoan] FOREIGN KEY ([MaTaiKhoan]) REFERENCES [TAIKHOAN] ([MaTaiKhoan]) ON DELETE SET NULL
);
GO

CREATE TABLE [NHANVIEN] (
    [MaNhanVien] int NOT NULL IDENTITY,
    [MaNV] nvarchar(max) NOT NULL,
    [TenNV] nvarchar(max) NOT NULL,
    [Sdt] nvarchar(max) NULL,
    [Email] nvarchar(max) NULL,
    [DiaChi] nvarchar(max) NULL,
    [MaTaiKhoan] int NULL,
    [TrangThai] bit NOT NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_NHANVIEN] PRIMARY KEY ([MaNhanVien]),
    CONSTRAINT [FK_NHANVIEN_TAIKHOAN_MaTaiKhoan] FOREIGN KEY ([MaTaiKhoan]) REFERENCES [TAIKHOAN] ([MaTaiKhoan]) ON DELETE SET NULL
);
GO

CREATE TABLE [NHATKY] (
    [MaNhatKy] int NOT NULL IDENTITY,
    [MaTaiKhoan] int NOT NULL,
    [HanhDong] nvarchar(max) NOT NULL,
    [TenBang] nvarchar(max) NULL,
    [MaBanGhi] int NULL,
    [GiaTriCu] nvarchar(max) NULL,
    [GiaTriMoi] nvarchar(max) NULL,
    [ThoiGian] datetime2 NOT NULL,
    CONSTRAINT [PK_NHATKY] PRIMARY KEY ([MaNhatKy]),
    CONSTRAINT [FK_NHATKY_TAIKHOAN_MaTaiKhoan] FOREIGN KEY ([MaTaiKhoan]) REFERENCES [TAIKHOAN] ([MaTaiKhoan]) ON DELETE NO ACTION
);
GO

CREATE TABLE [BAOGIA] (
    [MaBaoGia] int NOT NULL IDENTITY,
    [MaBG] nvarchar(max) NOT NULL,
    [NgayLap] datetime2 NOT NULL,
    [TongTien] decimal(18,2) NULL,
    [TrangThai] nvarchar(max) NULL,
    [MaKhachHang] int NOT NULL,
    [GhiChu] nvarchar(max) NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    [KhachHangMaKhachHang] int NULL,
    CONSTRAINT [PK_BAOGIA] PRIMARY KEY ([MaBaoGia]),
    CONSTRAINT [FK_BAOGIA_KHACHHANG_KhachHangMaKhachHang] FOREIGN KEY ([KhachHangMaKhachHang]) REFERENCES [KHACHHANG] ([MaKhachHang]),
    CONSTRAINT [FK_BAOGIA_KHACHHANG_MaKhachHang] FOREIGN KEY ([MaKhachHang]) REFERENCES [KHACHHANG] ([MaKhachHang]) ON DELETE NO ACTION
);
GO

CREATE TABLE [BAOCAO] (
    [MaBaoCao] int NOT NULL IDENTITY,
    [LoaiBaoCao] nvarchar(max) NOT NULL,
    [TenBaoCao] nvarchar(max) NOT NULL,
    [NgayBaoCao] datetime2 NOT NULL,
    [NguoiTao] int NOT NULL,
    [NoiDung] nvarchar(max) NULL,
    [NgayTao] datetime2 NOT NULL,
    CONSTRAINT [PK_BAOCAO] PRIMARY KEY ([MaBaoCao]),
    CONSTRAINT [FK_BAOCAO_NHANVIEN_NguoiTao] FOREIGN KEY ([NguoiTao]) REFERENCES [NHANVIEN] ([MaNhanVien]) ON DELETE NO ACTION
);
GO

CREATE TABLE [HOADON] (
    [MaHoaDon] int NOT NULL IDENTITY,
    [MaHD] nvarchar(max) NOT NULL,
    [NgayLap] datetime2 NOT NULL,
    [NgayGiao] datetime2 NULL,
    [TongTien] decimal(18,2) NULL,
    [GiamGia] decimal(18,2) NOT NULL,
    [ThanhToan] decimal(18,2) NULL,
    [TrangThai] nvarchar(max) NULL,
    [PTTT] nvarchar(max) NULL,
    [GhiChu] nvarchar(max) NULL,
    [MaNhanVien] int NULL,
    [MaKhachHang] int NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    [MaCoupon] int NULL,
    CONSTRAINT [PK_HOADON] PRIMARY KEY ([MaHoaDon]),
    CONSTRAINT [FK_HOADON_COUPON_MaCoupon] FOREIGN KEY ([MaCoupon]) REFERENCES [COUPON] ([MaCoupon]),
    CONSTRAINT [FK_HOADON_KHACHHANG_MaKhachHang] FOREIGN KEY ([MaKhachHang]) REFERENCES [KHACHHANG] ([MaKhachHang]) ON DELETE NO ACTION,
    CONSTRAINT [FK_HOADON_NHANVIEN_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NHANVIEN] ([MaNhanVien]) ON DELETE NO ACTION
);
GO

CREATE TABLE [NHANVIEN_MODULE_QUYEN] (
    [Id] int NOT NULL IDENTITY,
    [MaNhanVien] int NOT NULL,
    [Module] nvarchar(max) NOT NULL,
    [TenModule] nvarchar(max) NOT NULL,
    [CoTheXem] bit NOT NULL,
    [CoTheTao] bit NOT NULL,
    [CoTheSua] bit NOT NULL,
    [CoTheXoa] bit NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_NHANVIEN_MODULE_QUYEN] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_NHANVIEN_MODULE_QUYEN_NHANVIEN_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NHANVIEN] ([MaNhanVien]) ON DELETE CASCADE
);
GO

CREATE TABLE [PHIEUNHAP] (
    [MaPhieuNhap] int NOT NULL IDENTITY,
    [MaPN] nvarchar(max) NOT NULL,
    [NgayNhap] datetime2 NOT NULL,
    [NgayGiaoHang] datetime2 NULL,
    [TongTien] decimal(18,2) NULL,
    [ThanhToan] decimal(18,2) NULL,
    [TrangThai] nvarchar(max) NULL,
    [GhiChu] nvarchar(max) NULL,
    [MaNhaCungCap] int NOT NULL,
    [MaNhanVien] int NOT NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_PHIEUNHAP] PRIMARY KEY ([MaPhieuNhap]),
    CONSTRAINT [FK_PHIEUNHAP_NHACUNGCAP_MaNhaCungCap] FOREIGN KEY ([MaNhaCungCap]) REFERENCES [NHACUNGCAP] ([MaNhaCungCap]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PHIEUNHAP_NHANVIEN_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NHANVIEN] ([MaNhanVien]) ON DELETE NO ACTION
);
GO

CREATE TABLE [CTBAOGIA] (
    [MaCTBG] int NOT NULL IDENTITY,
    [MaBaoGia] int NOT NULL,
    [MaSanPham] int NOT NULL,
    [SoLuong] int NOT NULL,
    [DonGia] decimal(18,2) NOT NULL,
    [ThanhTien] decimal(18,2) NULL,
    [GhiChu] nvarchar(max) NULL,
    [NgayTao] datetime2 NOT NULL,
    CONSTRAINT [PK_CTBAOGIA] PRIMARY KEY ([MaCTBG]),
    CONSTRAINT [FK_CTBAOGIA_BAOGIA_MaBaoGia] FOREIGN KEY ([MaBaoGia]) REFERENCES [BAOGIA] ([MaBaoGia]) ON DELETE CASCADE,
    CONSTRAINT [FK_CTBAOGIA_SANPHAM_MaSanPham] FOREIGN KEY ([MaSanPham]) REFERENCES [SANPHAM] ([MaSanPham]) ON DELETE NO ACTION
);
GO

CREATE TABLE [CTHD] (
    [MaCTHD] int NOT NULL IDENTITY,
    [MaHoaDon] int NOT NULL,
    [MaSanPham] int NOT NULL,
    [SoLuong] int NOT NULL,
    [DonGia] decimal(18,2) NOT NULL,
    [GiamGia] decimal(18,2) NOT NULL,
    [ThanhTien] decimal(18,2) NULL,
    [NgayTao] datetime2 NOT NULL,
    CONSTRAINT [PK_CTHD] PRIMARY KEY ([MaCTHD]),
    CONSTRAINT [FK_CTHD_HOADON_MaHoaDon] FOREIGN KEY ([MaHoaDon]) REFERENCES [HOADON] ([MaHoaDon]) ON DELETE CASCADE,
    CONSTRAINT [FK_CTHD_SANPHAM_MaSanPham] FOREIGN KEY ([MaSanPham]) REFERENCES [SANPHAM] ([MaSanPham]) ON DELETE CASCADE
);
GO

CREATE TABLE [PHIEUDOITRA] (
    [MaPhieuDT] int NOT NULL IDENTITY,
    [MaDT] nvarchar(max) NOT NULL,
    [NgayDT] datetime2 NOT NULL,
    [TongTienHoan] decimal(18,2) NULL,
    [LyDo] nvarchar(max) NULL,
    [GhiChu] nvarchar(max) NULL,
    [TrangThai] nvarchar(max) NULL,
    [MaHoaDon] int NOT NULL,
    [MaNhanVien] int NOT NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_PHIEUDOITRA] PRIMARY KEY ([MaPhieuDT]),
    CONSTRAINT [FK_PHIEUDOITRA_HOADON_MaHoaDon] FOREIGN KEY ([MaHoaDon]) REFERENCES [HOADON] ([MaHoaDon]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PHIEUDOITRA_NHANVIEN_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NHANVIEN] ([MaNhanVien]) ON DELETE NO ACTION
);
GO

CREATE TABLE [PHIEUGIAOHANG] (
    [MaPhieuGH] int NOT NULL IDENTITY,
    [MaGH] nvarchar(max) NOT NULL,
    [NguoiGiao] nvarchar(max) NULL,
    [NgayGiao] datetime2 NOT NULL,
    [NgayGiaoDuKien] datetime2 NULL,
    [NgayGiaoThucTe] datetime2 NULL,
    [DiaChi] nvarchar(max) NULL,
    [TrangThai] nvarchar(max) NULL,
    [GhiChu] nvarchar(max) NULL,
    [MaHoaDon] int NULL,
    [MaNhanVien] int NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_PHIEUGIAOHANG] PRIMARY KEY ([MaPhieuGH]),
    CONSTRAINT [FK_PHIEUGIAOHANG_HOADON_MaHoaDon] FOREIGN KEY ([MaHoaDon]) REFERENCES [HOADON] ([MaHoaDon]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PHIEUGIAOHANG_NHANVIEN_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NHANVIEN] ([MaNhanVien]) ON DELETE NO ACTION
);
GO

CREATE TABLE [CONGNO] (
    [MaCongNo] int NOT NULL IDENTITY,
    [MaCN] nvarchar(max) NOT NULL,
    [SoTienNo] decimal(18,2) NOT NULL,
    [SoTienDaTra] decimal(18,2) NOT NULL,
    [SoTienConLai] decimal(18,2) NULL,
    [HanThanhToan] datetime2 NULL,
    [TrangThai] nvarchar(max) NULL,
    [LoaiCongNo] nvarchar(max) NULL,
    [MaKhachHang] int NULL,
    [MaNhaCungCap] int NULL,
    [MaHoaDon] int NULL,
    [MaPhieuNhap] int NULL,
    [GhiChu] nvarchar(max) NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_CONGNO] PRIMARY KEY ([MaCongNo]),
    CONSTRAINT [FK_CONGNO_HOADON_MaHoaDon] FOREIGN KEY ([MaHoaDon]) REFERENCES [HOADON] ([MaHoaDon]),
    CONSTRAINT [FK_CONGNO_KHACHHANG_MaKhachHang] FOREIGN KEY ([MaKhachHang]) REFERENCES [KHACHHANG] ([MaKhachHang]) ON DELETE NO ACTION,
    CONSTRAINT [FK_CONGNO_NHACUNGCAP_MaNhaCungCap] FOREIGN KEY ([MaNhaCungCap]) REFERENCES [NHACUNGCAP] ([MaNhaCungCap]) ON DELETE NO ACTION,
    CONSTRAINT [FK_CONGNO_PHIEUNHAP_MaPhieuNhap] FOREIGN KEY ([MaPhieuNhap]) REFERENCES [PHIEUNHAP] ([MaPhieuNhap]) ON DELETE NO ACTION
);
GO

CREATE TABLE [CTPN] (
    [MaCTPN] int NOT NULL IDENTITY,
    [MaPhieuNhap] int NOT NULL,
    [MaSanPham] int NOT NULL,
    [SoLuong] int NOT NULL,
    [DonGia] decimal(18,2) NOT NULL,
    [ThanhTien] decimal(18,2) NULL,
    [SoLuongDaNhan] int NOT NULL,
    [NgayTao] datetime2 NOT NULL,
    CONSTRAINT [PK_CTPN] PRIMARY KEY ([MaCTPN]),
    CONSTRAINT [FK_CTPN_PHIEUNHAP_MaPhieuNhap] FOREIGN KEY ([MaPhieuNhap]) REFERENCES [PHIEUNHAP] ([MaPhieuNhap]) ON DELETE CASCADE,
    CONSTRAINT [FK_CTPN_SANPHAM_MaSanPham] FOREIGN KEY ([MaSanPham]) REFERENCES [SANPHAM] ([MaSanPham]) ON DELETE CASCADE
);
GO

CREATE TABLE [PHIEUTRAHANG_NCC] (
    [MaPhieuTra] int NOT NULL IDENTITY,
    [MaPT] nvarchar(max) NOT NULL,
    [MaPhieuNhap] int NOT NULL,
    [MaNhanVien] int NOT NULL,
    [NgayTra] datetime2 NOT NULL,
    [TongTienHoan] decimal(18,2) NULL,
    [LyDo] nvarchar(max) NULL,
    [GhiChu] nvarchar(max) NULL,
    [TrangThai] nvarchar(max) NULL,
    [NgayTao] datetime2 NOT NULL,
    [NgayCapNhat] datetime2 NOT NULL,
    CONSTRAINT [PK_PHIEUTRAHANG_NCC] PRIMARY KEY ([MaPhieuTra]),
    CONSTRAINT [FK_PHIEUTRAHANG_NCC_NHANVIEN_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NHANVIEN] ([MaNhanVien]) ON DELETE CASCADE,
    CONSTRAINT [FK_PHIEUTRAHANG_NCC_PHIEUNHAP_MaPhieuNhap] FOREIGN KEY ([MaPhieuNhap]) REFERENCES [PHIEUNHAP] ([MaPhieuNhap]) ON DELETE CASCADE
);
GO

CREATE TABLE [CTPHIEUDOITRA] (
    [MaCTDT] int NOT NULL IDENTITY,
    [MaPhieuDT] int NOT NULL,
    [MaSanPham] int NOT NULL,
    [SoLuong] int NOT NULL,
    [DonGia] decimal(18,2) NOT NULL,
    [ThanhTien] decimal(18,2) NULL,
    [NgayTao] datetime2 NOT NULL,
    CONSTRAINT [PK_CTPHIEUDOITRA] PRIMARY KEY ([MaCTDT]),
    CONSTRAINT [FK_CTPHIEUDOITRA_PHIEUDOITRA_MaPhieuDT] FOREIGN KEY ([MaPhieuDT]) REFERENCES [PHIEUDOITRA] ([MaPhieuDT]) ON DELETE CASCADE,
    CONSTRAINT [FK_CTPHIEUDOITRA_SANPHAM_MaSanPham] FOREIGN KEY ([MaSanPham]) REFERENCES [SANPHAM] ([MaSanPham]) ON DELETE CASCADE
);
GO

CREATE TABLE [CHITETTRANO] (
    [MaChiTietTN] int NOT NULL IDENTITY,
    [MaTT] nvarchar(max) NOT NULL,
    [NgayTT] datetime2 NOT NULL,
    [SoTien] decimal(18,2) NOT NULL,
    [PTTT] nvarchar(max) NULL,
    [SoGiaoDich] nvarchar(max) NULL,
    [TrangThai] nvarchar(max) NULL,
    [MaHoaDon] int NULL,
    [MaPhieuNhap] int NULL,
    [MaCongNo] int NOT NULL,
    [MaNhanVien] int NULL,
    [GhiChu] nvarchar(max) NULL,
    [NgayTao] datetime2 NOT NULL,
    CONSTRAINT [PK_CHITETTRANO] PRIMARY KEY ([MaChiTietTN]),
    CONSTRAINT [FK_CHITETTRANO_CONGNO_MaCongNo] FOREIGN KEY ([MaCongNo]) REFERENCES [CONGNO] ([MaCongNo]) ON DELETE NO ACTION,
    CONSTRAINT [FK_CHITETTRANO_HOADON_MaHoaDon] FOREIGN KEY ([MaHoaDon]) REFERENCES [HOADON] ([MaHoaDon]) ON DELETE NO ACTION,
    CONSTRAINT [FK_CHITETTRANO_NHANVIEN_MaNhanVien] FOREIGN KEY ([MaNhanVien]) REFERENCES [NHANVIEN] ([MaNhanVien]) ON DELETE NO ACTION,
    CONSTRAINT [FK_CHITETTRANO_PHIEUNHAP_MaPhieuNhap] FOREIGN KEY ([MaPhieuNhap]) REFERENCES [PHIEUNHAP] ([MaPhieuNhap]) ON DELETE NO ACTION
);
GO

CREATE TABLE [CT_PHIEUTRAHANG_NCC] (
    [MaCTPT] int NOT NULL IDENTITY,
    [MaPhieuTra] int NOT NULL,
    [MaSanPham] int NOT NULL,
    [SoLuongTra] int NOT NULL,
    [DonGia] decimal(18,2) NOT NULL,
    [ThanhTien] decimal(18,2) NULL,
    CONSTRAINT [PK_CT_PHIEUTRAHANG_NCC] PRIMARY KEY ([MaCTPT]),
    CONSTRAINT [FK_CT_PHIEUTRAHANG_NCC_PHIEUTRAHANG_NCC_MaPhieuTra] FOREIGN KEY ([MaPhieuTra]) REFERENCES [PHIEUTRAHANG_NCC] ([MaPhieuTra]) ON DELETE CASCADE,
    CONSTRAINT [FK_CT_PHIEUTRAHANG_NCC_SANPHAM_MaSanPham] FOREIGN KEY ([MaSanPham]) REFERENCES [SANPHAM] ([MaSanPham]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_BAOCAO_NguoiTao] ON [BAOCAO] ([NguoiTao]);
GO

CREATE INDEX [IX_BAOGIA_KhachHangMaKhachHang] ON [BAOGIA] ([KhachHangMaKhachHang]);
GO

CREATE INDEX [IX_BAOGIA_MaKhachHang] ON [BAOGIA] ([MaKhachHang]);
GO

CREATE INDEX [IX_CHITETTRANO_MaCongNo] ON [CHITETTRANO] ([MaCongNo]);
GO

CREATE INDEX [IX_CHITETTRANO_MaHoaDon] ON [CHITETTRANO] ([MaHoaDon]);
GO

CREATE INDEX [IX_CHITETTRANO_MaNhanVien] ON [CHITETTRANO] ([MaNhanVien]);
GO

CREATE INDEX [IX_CHITETTRANO_MaPhieuNhap] ON [CHITETTRANO] ([MaPhieuNhap]);
GO

CREATE INDEX [IX_CONGNO_MaHoaDon] ON [CONGNO] ([MaHoaDon]);
GO

CREATE INDEX [IX_CONGNO_MaKhachHang] ON [CONGNO] ([MaKhachHang]);
GO

CREATE INDEX [IX_CONGNO_MaNhaCungCap] ON [CONGNO] ([MaNhaCungCap]);
GO

CREATE INDEX [IX_CONGNO_MaPhieuNhap] ON [CONGNO] ([MaPhieuNhap]);
GO

CREATE INDEX [IX_CT_PHIEUTRAHANG_NCC_MaPhieuTra] ON [CT_PHIEUTRAHANG_NCC] ([MaPhieuTra]);
GO

CREATE INDEX [IX_CT_PHIEUTRAHANG_NCC_MaSanPham] ON [CT_PHIEUTRAHANG_NCC] ([MaSanPham]);
GO

CREATE INDEX [IX_CTBAOGIA_MaBaoGia] ON [CTBAOGIA] ([MaBaoGia]);
GO

CREATE INDEX [IX_CTBAOGIA_MaSanPham] ON [CTBAOGIA] ([MaSanPham]);
GO

CREATE INDEX [IX_CTFLASHSALE_MaFlashSale] ON [CTFLASHSALE] ([MaFlashSale]);
GO

CREATE INDEX [IX_CTFLASHSALE_MaSanPham] ON [CTFLASHSALE] ([MaSanPham]);
GO

CREATE INDEX [IX_CTHD_MaHoaDon] ON [CTHD] ([MaHoaDon]);
GO

CREATE INDEX [IX_CTHD_MaSanPham] ON [CTHD] ([MaSanPham]);
GO

CREATE INDEX [IX_CTKHOHANG_MaKhoHang] ON [CTKHOHANG] ([MaKhoHang]);
GO

CREATE INDEX [IX_CTKHOHANG_MaSanPham] ON [CTKHOHANG] ([MaSanPham]);
GO

CREATE INDEX [IX_CTPHIEUDOITRA_MaPhieuDT] ON [CTPHIEUDOITRA] ([MaPhieuDT]);
GO

CREATE INDEX [IX_CTPHIEUDOITRA_MaSanPham] ON [CTPHIEUDOITRA] ([MaSanPham]);
GO

CREATE INDEX [IX_CTPN_MaPhieuNhap] ON [CTPN] ([MaPhieuNhap]);
GO

CREATE INDEX [IX_CTPN_MaSanPham] ON [CTPN] ([MaSanPham]);
GO

CREATE INDEX [IX_HOADON_MaCoupon] ON [HOADON] ([MaCoupon]);
GO

CREATE INDEX [IX_HOADON_MaKhachHang] ON [HOADON] ([MaKhachHang]);
GO

CREATE INDEX [IX_HOADON_MaNhanVien] ON [HOADON] ([MaNhanVien]);
GO

CREATE UNIQUE INDEX [IX_KHACHHANG_MaTaiKhoan] ON [KHACHHANG] ([MaTaiKhoan]) WHERE [MaTaiKhoan] IS NOT NULL;
GO

CREATE INDEX [IX_KHUYENMAI_SANPHAM_MaKhuyenMai] ON [KHUYENMAI_SANPHAM] ([MaKhuyenMai]);
GO

CREATE INDEX [IX_KHUYENMAI_SANPHAM_MaSanPham] ON [KHUYENMAI_SANPHAM] ([MaSanPham]);
GO

CREATE UNIQUE INDEX [IX_NHANVIEN_MaTaiKhoan] ON [NHANVIEN] ([MaTaiKhoan]) WHERE [MaTaiKhoan] IS NOT NULL;
GO

CREATE INDEX [IX_NHANVIEN_MODULE_QUYEN_MaNhanVien] ON [NHANVIEN_MODULE_QUYEN] ([MaNhanVien]);
GO

CREATE INDEX [IX_NHATKY_MaTaiKhoan] ON [NHATKY] ([MaTaiKhoan]);
GO

CREATE INDEX [IX_PHANQUYEN_MaQuyen] ON [PHANQUYEN] ([MaQuyen]);
GO

CREATE INDEX [IX_PHANQUYEN_MaVaiTro] ON [PHANQUYEN] ([MaVaiTro]);
GO

CREATE INDEX [IX_PHIEUDOITRA_MaHoaDon] ON [PHIEUDOITRA] ([MaHoaDon]);
GO

CREATE INDEX [IX_PHIEUDOITRA_MaNhanVien] ON [PHIEUDOITRA] ([MaNhanVien]);
GO

CREATE INDEX [IX_PHIEUGIAOHANG_MaHoaDon] ON [PHIEUGIAOHANG] ([MaHoaDon]);
GO

CREATE INDEX [IX_PHIEUGIAOHANG_MaNhanVien] ON [PHIEUGIAOHANG] ([MaNhanVien]);
GO

CREATE INDEX [IX_PHIEUNHAP_MaNhaCungCap] ON [PHIEUNHAP] ([MaNhaCungCap]);
GO

CREATE INDEX [IX_PHIEUNHAP_MaNhanVien] ON [PHIEUNHAP] ([MaNhanVien]);
GO

CREATE INDEX [IX_PHIEUTRAHANG_NCC_MaNhanVien] ON [PHIEUTRAHANG_NCC] ([MaNhanVien]);
GO

CREATE INDEX [IX_PHIEUTRAHANG_NCC_MaPhieuNhap] ON [PHIEUTRAHANG_NCC] ([MaPhieuNhap]);
GO

CREATE INDEX [IX_SANPHAM_MaLoaiSP] ON [SANPHAM] ([MaLoaiSP]);
GO

CREATE INDEX [IX_TAIKHOAN_MaVaiTro] ON [TAIKHOAN] ([MaVaiTro]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260408121251_AddCTBaoGia', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [SANPHAM] ADD [ThuongHieu] nvarchar(max) NULL;
GO

ALTER TABLE [SANPHAM] ADD [XuatXu] nvarchar(max) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260409202517_AddBrandAndOrigin', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [LOAISANPHAM] ADD [HinhAnh] nvarchar(max) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260409203751_AddCategoryImage', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DROP TABLE [BAOCAO];
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260412090355_RemoveBaoCao', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DROP TABLE [CTBAOGIA];
GO

DROP TABLE [BAOGIA];
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260412091543_RemoveBaoGia', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [CHITETTRANO] DROP CONSTRAINT [FK_CHITETTRANO_PHIEUNHAP_MaPhieuNhap];
GO

ALTER TABLE [CONGNO] DROP CONSTRAINT [FK_CONGNO_NHACUNGCAP_MaNhaCungCap];
GO

ALTER TABLE [CONGNO] DROP CONSTRAINT [FK_CONGNO_PHIEUNHAP_MaPhieuNhap];
GO

DROP INDEX [IX_CONGNO_MaNhaCungCap] ON [CONGNO];
GO

DROP INDEX [IX_CONGNO_MaPhieuNhap] ON [CONGNO];
GO

DROP INDEX [IX_CHITETTRANO_MaPhieuNhap] ON [CHITETTRANO];
GO

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CONGNO]') AND [c].[name] = N'MaNhaCungCap');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [CONGNO] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [CONGNO] DROP COLUMN [MaNhaCungCap];
GO

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CONGNO]') AND [c].[name] = N'MaPhieuNhap');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [CONGNO] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [CONGNO] DROP COLUMN [MaPhieuNhap];
GO

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CHITETTRANO]') AND [c].[name] = N'MaPhieuNhap');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [CHITETTRANO] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [CHITETTRANO] DROP COLUMN [MaPhieuNhap];
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260412092250_RemoveNoNhaCungCap', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [KHACHHANG] ADD [NgaySinh] datetime2 NULL;
GO

ALTER TABLE [CTPN] ADD [TrangThai] nvarchar(max) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260412184729_AddCustomerBirthday', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [KHACHHANG] ADD [AnhDaiDien] nvarchar(max) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260413094555_AddKhachHangAnhDaiDien', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [KHACHHANG] ADD [CCCD] nvarchar(max) NULL;
GO

ALTER TABLE [KHACHHANG] ADD [GioiTinh] nvarchar(max) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260413094952_AddCustomerIdentityFields', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [CONGNO] ADD [MaNhaCungCap] int NULL;
GO

ALTER TABLE [CONGNO] ADD [MaPhieuNhap] int NULL;
GO

ALTER TABLE [CHITETTRANO] ADD [MaPhieuNhap] int NULL;
GO

CREATE INDEX [IX_CONGNO_MaNhaCungCap] ON [CONGNO] ([MaNhaCungCap]);
GO

CREATE INDEX [IX_CONGNO_MaPhieuNhap] ON [CONGNO] ([MaPhieuNhap]);
GO

CREATE INDEX [IX_CHITETTRANO_MaPhieuNhap] ON [CHITETTRANO] ([MaPhieuNhap]);
GO

ALTER TABLE [CONGNO] ADD CONSTRAINT [FK_CONGNO_NHACUNGCAP_MaNhaCungCap] FOREIGN KEY ([MaNhaCungCap]) REFERENCES [NHACUNGCAP] ([MaNhaCungCap]) ON DELETE NO ACTION;
GO

ALTER TABLE [CONGNO] ADD CONSTRAINT [FK_CONGNO_PHIEUNHAP_MaPhieuNhap] FOREIGN KEY ([MaPhieuNhap]) REFERENCES [PHIEUNHAP] ([MaPhieuNhap]) ON DELETE NO ACTION;
GO

ALTER TABLE [CHITETTRANO] ADD CONSTRAINT [FK_CHITETTRANO_PHIEUNHAP_MaPhieuNhap] FOREIGN KEY ([MaPhieuNhap]) REFERENCES [PHIEUNHAP] ([MaPhieuNhap]) ON DELETE NO ACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260428102909_RestoreSupplierDebtsV2', N'8.0.0');
GO

-- Add MaCTHD to CTPHIEUGIAOHANG
ALTER TABLE [dbo].[CTPHIEUGIAOHANG] ADD [MaCTHD] INT NULL;
GO
CREATE INDEX [IX_CTPHIEUGIAOHANG_MaCTHD] ON [dbo].[CTPHIEUGIAOHANG] ([MaCTHD]);
GO
ALTER TABLE [dbo].[CTPHIEUGIAOHANG] ADD CONSTRAINT [FK_CTPHIEUGIAOHANG_CTHD_MaCTHD] 
    FOREIGN KEY ([MaCTHD]) REFERENCES [dbo].[CTHD] ([MaCTHD]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260428215940_AddMaCTHDToDelivery', N'8.0.0');
GO

COMMIT;
GO


