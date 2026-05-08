// Program.cs - Main entry point for ASP.NET Core API
using Microsoft.EntityFrameworkCore;
using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Repositories;
using BuildingMaterialAPI.Services;
using BuildingMaterialAPI.Utilities;

var builder = WebApplication.CreateBuilder(args);

// Configure EPPlus License Context
OfficeOpenXml.ExcelPackage.License.SetNonCommercialPersonal("Pann");

// Configure QuestPDF License
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Allow large file uploads (up to 10MB)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Add DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString, x => x.MigrationsHistoryTable("__EFMigrationsHistory")));

// Add Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// Add Services
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// Add AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

builder.Services.AddSignalR();
builder.Services.AddHttpClient(); // Required for Gemini API
builder.Services.AddScoped<IAIService, AIService>();
builder.Services.AddHostedService<BackupWorker>();

// 3. AUTH (JWT) ───────────────────────────────────────────────────
var jwtSecretKey = builder.Configuration["Auth:JwtSecretKey"];
if (string.IsNullOrEmpty(jwtSecretKey)) throw new Exception("JWT Secret Key is missing in appsettings.json");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSecretKey))
    };
});


var app = builder.Build();

// Emergency Database Fix
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try {
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CONGNO]') AND name = 'MaNhaCungCap') ALTER TABLE [CONGNO] ADD [MaNhaCungCap] int NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CONGNO]') AND name = 'MaPhieuNhap') ALTER TABLE [CONGNO] ADD [MaPhieuNhap] int NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CHITETTRANO]') AND name = 'MaPhieuNhap') ALTER TABLE [CHITETTRANO] ADD [MaPhieuNhap] int NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[NHANVIEN]') AND name = 'SucChuaToiDa') ALTER TABLE [NHANVIEN] ADD [SucChuaToiDa] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTHD]') AND name = 'DiaChiGiaoHang') ALTER TABLE [CTHD] ADD [DiaChiGiaoHang] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTHD]') AND name = 'TenNguoiNhan') ALTER TABLE [CTHD] ADD [TenNguoiNhan] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTHD]') AND name = 'SdtNguoiNhan') ALTER TABLE [CTHD] ADD [SdtNguoiNhan] nvarchar(max) NULL;");
        
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'PhiVanChuyen') ALTER TABLE [HOADON] ADD [PhiVanChuyen] decimal(18,2) NOT NULL DEFAULT 0;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'TenNguoiNhan') ALTER TABLE [HOADON] ADD [TenNguoiNhan] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'SdtNguoiNhan') ALTER TABLE [HOADON] ADD [SdtNguoiNhan] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'EmailNguoiNhan') ALTER TABLE [HOADON] ADD [EmailNguoiNhan] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'DiaChiGiaoHang') ALTER TABLE [HOADON] ADD [DiaChiGiaoHang] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'YeuCauVat') ALTER TABLE [HOADON] ADD [YeuCauVat] bit NOT NULL DEFAULT 0;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatType') ALTER TABLE [HOADON] ADD [VatType] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatBuyerName') ALTER TABLE [HOADON] ADD [VatBuyerName] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatEmail') ALTER TABLE [HOADON] ADD [VatEmail] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatAddress') ALTER TABLE [HOADON] ADD [VatAddress] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatIdCard') ALTER TABLE [HOADON] ADD [VatIdCard] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatPassport') ALTER TABLE [HOADON] ADD [VatPassport] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatCompanyName') ALTER TABLE [HOADON] ADD [VatCompanyName] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatCompanyAddress') ALTER TABLE [HOADON] ADD [VatCompanyAddress] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatTaxId') ALTER TABLE [HOADON] ADD [VatTaxId] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatBudgetCode') ALTER TABLE [HOADON] ADD [VatBudgetCode] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTPHIEUGIAOHANG]') AND name = 'MaCTHD') ALTER TABLE [CTPHIEUGIAOHANG] ADD [MaCTHD] int NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTPHIEUGIAOHANG]') AND name = 'TrangThai') ALTER TABLE [CTPHIEUGIAOHANG] ADD [TrangThai] nvarchar(50) NULL DEFAULT N'Đang giao';");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUGIAOHANG]') AND name = 'SoTienThu') ALTER TABLE [PHIEUGIAOHANG] ADD [SoTienThu] decimal(18,2) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUGIAOHANG]') AND name = 'ViTriHienTai') ALTER TABLE [PHIEUGIAOHANG] ADD [ViTriHienTai] NVARCHAR(500) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUGIAOHANG]') AND name = 'Lat') ALTER TABLE [PHIEUGIAOHANG] ADD [Lat] DECIMAL(18, 10) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUGIAOHANG]') AND name = 'Lng') ALTER TABLE [PHIEUGIAOHANG] ADD [Lng] DECIMAL(18, 10) NULL;");
        
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUDOITRA]') AND name = 'LoiDo') ALTER TABLE [PHIEUDOITRA] ADD [LoiDo] NVARCHAR(100) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUDOITRA]') AND name = 'PhiVanChuyenMoi') ALTER TABLE [PHIEUDOITRA] ADD [PhiVanChuyenMoi] DECIMAL(18, 2) NULL;");


        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SANPHAM]') AND name = 'TrongLuong') ALTER TABLE [SANPHAM] ADD [TrongLuong] decimal(18,2) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SANPHAM]') AND name = 'DonViTrongLuong') ALTER TABLE [SANPHAM] ADD [DonViTrongLuong] nvarchar(50) NULL DEFAULT 'kg';");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SANPHAM]') AND name = 'KichThuoc') ALTER TABLE [SANPHAM] ADD [KichThuoc] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SANPHAM]') AND name = 'IsGift') ALTER TABLE [SANPHAM] ADD [IsGift] bit DEFAULT 0;");

        // Chèn dữ liệu mẫu quà tặng nếu chưa có
        context.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM [SANPHAM] WHERE [TenSP] = N'Bút thử điện thông minh')
            BEGIN
                INSERT INTO [SANPHAM] ([TenSP], [MoTa], [HinhAnh], [DonViTinh], [GiaBan], [GiaNhap], [MucTonToiThieu], [ThuongHieu], [XuatXu], [MaLoaiSP], [IsGift])
                VALUES (N'Bút thử điện thông minh', N'Bút thử điện cảm ứng, báo đèn led', '/images/butthudienthongminh.jpg', N'Cái', 0, 0, 50, N'OEM', N'Việt Nam', 9, 1);
                
                DECLARE @newId1 INT = SCOPE_IDENTITY();
                INSERT INTO [CTKHOHANG] ([MaKhoHang],[MaSanPham],[SoLuong],[SoLuongNhap],[SoLuongTon],[ViTri])
                VALUES (1, @newId1, 200, 200, 200, N'Kệ Quà Tặng');
            END

            IF NOT EXISTS (SELECT * FROM [SANPHAM] WHERE [TenSP] = N'Đèn pin siêu sáng')
            BEGIN
                INSERT INTO [SANPHAM] ([TenSP], [MoTa], [HinhAnh], [DonViTinh], [GiaBan], [GiaNhap], [MucTonToiThieu], [ThuongHieu], [XuatXu], [MaLoaiSP], [IsGift])
                VALUES (N'Đèn pin siêu sáng', N'Đèn pin cầm tay sạc USB', '/images/denpin.jpg', N'Cái', 0, 0, 30, N'OEM', N'Việt Nam', 9, 1);
                
                DECLARE @newId2 INT = SCOPE_IDENTITY();
                INSERT INTO [CTKHOHANG] ([MaKhoHang],[MaSanPham],[SoLuong],[SoLuongNhap],[SoLuongTon],[ViTri])
                VALUES (1, @newId2, 100, 100, 100, N'Kệ Quà Tặng');
            END

            IF NOT EXISTS (SELECT * FROM [SANPHAM] WHERE [TenSP] = N'Găng tay bảo hộ')
            BEGIN
                INSERT INTO [SANPHAM] ([TenSP], [MoTa], [HinhAnh], [DonViTinh], [GiaBan], [GiaNhap], [MucTonToiThieu], [ThuongHieu], [XuatXu], [MaLoaiSP], [IsGift])
                VALUES (N'Găng tay bảo hộ', N'Găng tay len phủ hạt nhựa chống trượt', '/images/gangtaybaoho.jpg', N'Đôi', 0, 0, 200, N'OEM', N'Việt Nam', 9, 1);
                
                DECLARE @newId3 INT = SCOPE_IDENTITY();
                INSERT INTO [CTKHOHANG] ([MaKhoHang],[MaSanPham],[SoLuong],[SoLuongNhap],[SoLuongTon],[ViTri])
                VALUES (1, @newId3, 500, 500, 500, N'Kệ Quà Tặng');
            END

            IF NOT EXISTS (SELECT * FROM [SANPHAM] WHERE [TenSP] = N'Nón bảo hộ COV')
            BEGIN
                INSERT INTO [SANPHAM] ([TenSP], [MoTa], [HinhAnh], [DonViTinh], [GiaBan], [GiaNhap], [MucTonToiThieu], [ThuongHieu], [XuatXu], [MaLoaiSP], [IsGift])
                VALUES (N'Nón bảo hộ COV', N'Nón bảo hộ công trường tiêu chuẩn', '/images/non-bao-ho-cov.jpg', N'Cái', 0, 0, 50, N'COV', N'Việt Nam', 9, 1);
                
                DECLARE @newId4 INT = SCOPE_IDENTITY();
                INSERT INTO [CTKHOHANG] ([MaKhoHang],[MaSanPham],[SoLuong],[SoLuongNhap],[SoLuongTon],[ViTri])
                VALUES (1, @newId4, 150, 150, 150, N'Kệ Quà Tặng');
            END

            IF NOT EXISTS (SELECT * FROM [SANPHAM] WHERE [TenSP] = N'Thước cuộn 5m')
            BEGIN
                INSERT INTO [SANPHAM] ([TenSP], [MoTa], [HinhAnh], [DonViTinh], [GiaBan], [GiaNhap], [MucTonToiThieu], [ThuongHieu], [XuatXu], [MaLoaiSP], [IsGift])
                VALUES (N'Thước cuộn 5m', N'Thước thép bọc nhựa chống va đập', '/images/thuoccuon5m.jpg', N'Cái', 0, 0, 100, N'OEM', N'Việt Nam', 9, 1);
                
                DECLARE @newId5 INT = SCOPE_IDENTITY();
                INSERT INTO [CTKHOHANG] ([MaKhoHang],[MaSanPham],[SoLuong],[SoLuongNhap],[SoLuongTon],[ViTri])
                VALUES (1, @newId5, 300, 300, 300, N'Kệ Quà Tặng');
            END

            IF NOT EXISTS (SELECT * FROM [SANPHAM] WHERE [TenSP] = N'Tua vít đa năng')
            BEGIN
                INSERT INTO [SANPHAM] ([TenSP], [MoTa], [HinhAnh], [DonViTinh], [GiaBan], [GiaNhap], [MucTonToiThieu], [ThuongHieu], [XuatXu], [MaLoaiSP], [IsGift])
                VALUES (N'Tua vít đa năng', N'Bộ tua vít nhiều đầu thay thế', '/images/tuavitdanang.jpg', N'Cái', 0, 0, 50, N'OEM', N'Việt Nam', 9, 1);
                
                DECLARE @newId6 INT = SCOPE_IDENTITY();
                INSERT INTO [CTKHOHANG] ([MaKhoHang],[MaSanPham],[SoLuong],[SoLuongNhap],[SoLuongTon],[ViTri])
                VALUES (1, @newId6, 250, 250, 250, N'Kệ Quà Tặng');
            END
        ");

        // Cập nhật dữ liệu mẫu cho Sản phẩm (Chỉ cập nhật nếu các trường đang NULL)
        context.Database.ExecuteSqlRaw("UPDATE [SANPHAM] SET [TrongLuong] = 50, [DonViTrongLuong] = 'kg' WHERE [TenSP] LIKE N'%Xi măng%' AND [TrongLuong] IS NULL;");
        context.Database.ExecuteSqlRaw("UPDATE [SANPHAM] SET [TrongLuong] = 7.22, [KichThuoc] = N'11.7m' WHERE [TenSP] LIKE N'%Thép Hòa Phát D10%' AND [TrongLuong] IS NULL;");
        context.Database.ExecuteSqlRaw("UPDATE [SANPHAM] SET [TrongLuong] = 10.39, [KichThuoc] = N'11.7m' WHERE [TenSP] LIKE N'%Thép Việt Nhật D12%' AND [TrongLuong] IS NULL;");
        context.Database.ExecuteSqlRaw("UPDATE [SANPHAM] SET [TrongLuong] = 1.1, [KichThuoc] = N'8x8x18cm' WHERE [TenSP] LIKE N'%Gạch Tuynel%' AND [TrongLuong] IS NULL;");
        context.Database.ExecuteSqlRaw("UPDATE [SANPHAM] SET [TrongLuong] = 30, [KichThuoc] = N'60x60cm' WHERE [TenSP] LIKE N'%Gạch Men%' AND [TrongLuong] IS NULL;");
        context.Database.ExecuteSqlRaw("UPDATE [SANPHAM] SET [TrongLuong] = 1400 WHERE [TenSP] LIKE N'%Cát%' AND [TrongLuong] IS NULL;");
        context.Database.ExecuteSqlRaw("UPDATE [SANPHAM] SET [TrongLuong] = 1550 WHERE [TenSP] LIKE N'%Đá 1x2%' AND [TrongLuong] IS NULL;");
        context.Database.ExecuteSqlRaw("UPDATE [SANPHAM] SET [TrongLuong] = 22, [KichThuoc] = N'18L' WHERE [TenSP] LIKE N'%Sơn Dulux%' AND [TrongLuong] IS NULL;");
        context.Database.ExecuteSqlRaw("UPDATE [SANPHAM] SET [TrongLuong] = 3, [KichThuoc] = N'100m' WHERE [TenSP] LIKE N'%Dây điện%' AND [TrongLuong] IS NULL;");
        context.Database.ExecuteSqlRaw("UPDATE [SANPHAM] SET [TrongLuong] = 0.8, [KichThuoc] = N'4m' WHERE [TenSP] LIKE N'%Ống PVC%D21%' AND [TrongLuong] IS NULL;");
        context.Database.ExecuteSqlRaw("UPDATE [SANPHAM] SET [TrongLuong] = 4.5, [KichThuoc] = N'4m' WHERE [TenSP] LIKE N'%Ống PVC%D90%' AND [TrongLuong] IS NULL;");

        // Cập nhật sức chứa cho Tài xế
        context.Database.ExecuteSqlRaw("UPDATE [NHANVIEN] SET [SucChuaToiDa] = '5000' WHERE [TenNV] LIKE N'%Trương Thanh Tuấn%' AND [SucChuaToiDa] IS NULL;");
        context.Database.ExecuteSqlRaw("UPDATE [NHANVIEN] SET [SucChuaToiDa] = '3000' WHERE [TenNV] LIKE N'%Lê Trần Ngọc Yến%' AND [SucChuaToiDa] IS NULL;");
        context.Database.ExecuteSqlRaw("UPDATE [NHANVIEN] SET [SucChuaToiDa] = '10000' WHERE [TenNV] LIKE N'%Phạm Văn Tài%' AND [SucChuaToiDa] IS NULL;");

        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'AnhBangChung') ALTER TABLE [HOADON] ADD [AnhBangChung] nvarchar(max) NULL;");

        context.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LICHSUHOADON]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[LICHSUHOADON](
                    [MaLichSu] [int] IDENTITY(1,1) NOT NULL,
                    [MaHoaDon] [int] NOT NULL,
                    [TrangThaiCu] [nvarchar](100) NULL,
                    [TrangThaiMoi] [nvarchar](100) NULL,
                    [NoiDungThayDoi] [nvarchar](max) NULL,
                    [MaNguoiThucHien] [int] NULL,
                    [NgayTao] [datetime2](7) NOT NULL,
                    CONSTRAINT [PK_LICHSUHOADON] PRIMARY KEY CLUSTERED ([MaLichSu] ASC)
                );
                ALTER TABLE [dbo].[LICHSUHOADON] WITH CHECK ADD CONSTRAINT [FK_LICHSUHOADON_HOADON] FOREIGN KEY([MaHoaDon]) REFERENCES [dbo].[HOADON] ([MaHoaDon]) ON DELETE CASCADE;
            END

            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DANHGIA]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[DANHGIA](
                    [MaDanhGia] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [MaSanPham] [int] NOT NULL,
                    [MaKhachHang] [int] NOT NULL,
                    [MaHoaDon] [int] NULL,
                    [SoSao] [int] NOT NULL,
                    [NoiDung] [nvarchar](max) NULL,
                    [HinhAnh] [nvarchar](max) NULL,
                    [Video] [nvarchar](max) NULL,
                    [TrangThai] [bit] NOT NULL DEFAULT 1,
                    [NgayTao] [datetime2](7) NOT NULL DEFAULT GETDATE()
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LICHHENTRANO]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[LICHHENTRANO](
                    [MaHen] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [MaCongNo] [int] NOT NULL,
                    [NgayHen] [datetime2](7) NOT NULL,
                    [SoTienDuKien] [decimal](18, 2) NOT NULL,
                    [GhiChu] [nvarchar](max) NULL,
                    [TrangThai] [nvarchar](50) NULL DEFAULT N'Chưa hoàn thành',
                    [NgayTao] [datetime2](7) NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT [FK_LICHHENTRANO_CONGNO] FOREIGN KEY([MaCongNo]) REFERENCES [dbo].[CONGNO] ([MaCongNo]) ON DELETE CASCADE
                );
            END
            
            -- Auto-migrate PHIEUDOITRA table for 'Loai' column
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUDOITRA]') AND name = 'Loai')
            BEGIN
                ALTER TABLE [dbo].[PHIEUDOITRA] ADD [Loai] NVARCHAR(50) NULL;
            END

            -- Auto-migrate CTPHIEUDOITRA table for 'Loai' column
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTPHIEUDOITRA]') AND name = 'Loai')
            BEGIN
                ALTER TABLE [dbo].[CTPHIEUDOITRA] ADD [Loai] NVARCHAR(50) NULL;
            END

            -- Auto-migrate CTPHIEUDOITRA table for 'TrangThai' column
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTPHIEUDOITRA]') AND name = 'TrangThai')
            BEGIN
                ALTER TABLE [dbo].[CTPHIEUDOITRA] ADD [TrangThai] NVARCHAR(50) NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LICHSUTHANGHANG]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[LICHSUTHANGHANG](
                    [MaLichSu] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [MaKhachHang] [int] NOT NULL,
                    [HangCu] [nvarchar](20) NULL,
                    [HangMoi] [nvarchar](20) NULL,
                    [TongChiTieuHienTai] [decimal](18, 2) NULL,
                    [LyDo] [nvarchar](max) NULL,
                    [NgayThayDoi] [datetime2](7) NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT [FK_LICHSUTHANGHANG_KHACHHANG] FOREIGN KEY([MaKhachHang]) REFERENCES [dbo].[KHACHHANG] ([MaKhachHang]) ON DELETE CASCADE
                );
            END
        ");
    } catch (Exception ex) { 
        Console.WriteLine($"[Emergency Fix Error] {ex.Message}");
    }
}


// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Disable HTTPS redirection for development
// app.UseHttpsRedirection();
app.UseCors("AllowReact");
app.UseStaticFiles(); // Serve files from wwwroot
app.MapControllers();
app.MapHub<BuildingMaterialAPI.Hubs.NotificationHub>("/hubs/notifications");

app.Run();
