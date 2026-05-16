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
builder.Services.AddScoped<IVatInvoiceService, VatInvoiceService>();

// Add AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

builder.Services.AddSignalR();
builder.Services.AddHttpClient(); // Required for Gemini API
builder.Services.AddScoped<IAIService, AIService>();
builder.Services.AddHostedService<BackupWorker>();
builder.Services.AddHostedService<DebtWorker>();

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

// Emergency Database Fix (Enabled to ensure schema synchronization on startup)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try {
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[KHUYENMAI_DOITUONG]') AND name = 'SoLuongKhuyenMai') ALTER TABLE [KHUYENMAI_DOITUONG] ADD [SoLuongKhuyenMai] int NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[KHUYENMAI_DOITUONG]') AND name = 'SoLuongDaBan') ALTER TABLE [KHUYENMAI_DOITUONG] ADD [SoLuongDaBan] int NOT NULL DEFAULT 0;");
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
        
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUXUATKHO]') AND name = 'MaNguoiDuyet') ALTER TABLE [PHIEUXUATKHO] ADD [MaNguoiDuyet] int NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUXUATKHO]') AND name = 'NgayDuyet') ALTER TABLE [PHIEUXUATKHO] ADD [NgayDuyet] datetime2 NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUXUATKHO]') AND name = 'ChuKyNguoiLap') ALTER TABLE [PHIEUXUATKHO] ADD [ChuKyNguoiLap] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUXUATKHO]') AND name = 'ChuKyQuanLy') ALTER TABLE [PHIEUXUATKHO] ADD [ChuKyQuanLy] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUXUATKHO]') AND name = 'MaNguoiXuatKho') ALTER TABLE [PHIEUXUATKHO] ADD [MaNguoiXuatKho] int NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUXUATKHO]') AND name = 'ChuKyNguoiXuatKho') ALTER TABLE [PHIEUXUATKHO] ADD [ChuKyNguoiXuatKho] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUXUATKHO]') AND name = 'MaNguoiNhan') ALTER TABLE [PHIEUXUATKHO] ADD [MaNguoiNhan] int NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUXUATKHO]') AND name = 'ChuKyNguoiNhan') ALTER TABLE [PHIEUXUATKHO] ADD [ChuKyNguoiNhan] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUXUATKHO]') AND name = 'TrangThai') ALTER TABLE [PHIEUXUATKHO] ADD [TrangThai] nvarchar(50) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTPHIEUXUATKHO]') AND name = 'SoLuongThucNhan') ALTER TABLE [CTPHIEUXUATKHO] ADD [SoLuongThucNhan] int NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTPHIEUXUATKHO]') AND name = 'GhiChu') ALTER TABLE [CTPHIEUXUATKHO] ADD [GhiChu] nvarchar(max) NULL;");

        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUDOITRA]') AND name = 'LoiDo') ALTER TABLE [PHIEUDOITRA] ADD [LoiDo] NVARCHAR(100) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUDOITRA]') AND name = 'PhiVanChuyenMoi') ALTER TABLE [PHIEUDOITRA] ADD [PhiVanChuyenMoi] DECIMAL(18, 2) NULL;");


        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SANPHAM]') AND name = 'TrongLuong') ALTER TABLE [SANPHAM] ADD [TrongLuong] decimal(18,2) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SANPHAM]') AND name = 'DonViTrongLuong') ALTER TABLE [SANPHAM] ADD [DonViTrongLuong] nvarchar(50) NULL DEFAULT 'kg';");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SANPHAM]') AND name = 'KichThuoc') ALTER TABLE [SANPHAM] ADD [KichThuoc] nvarchar(max) NULL;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SANPHAM]') AND name = 'IsGift') ALTER TABLE [SANPHAM] ADD [IsGift] bit DEFAULT 0;");
        context.Database.ExecuteSqlRaw("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[NHANVIEN]') AND name = 'ChuKy') ALTER TABLE [NHANVIEN] ADD [ChuKy] nvarchar(max) NULL;");

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
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PHIEUDOITRA]') AND name = 'Loai')
            BEGIN
                ALTER TABLE [dbo].[PHIEUDOITRA] ADD [Loai] NVARCHAR(50) NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTPHIEUDOITRA]') AND name = 'Loai')
            BEGIN
                ALTER TABLE [dbo].[CTPHIEUDOITRA] ADD [Loai] NVARCHAR(50) NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTPHIEUDOITRA]') AND name = 'TrangThai')
            BEGIN
                ALTER TABLE [dbo].[CTPHIEUDOITRA] ADD [TrangThai] NVARCHAR(50) NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LICHSUPHIEUXUATKHO]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[LICHSUPHIEUXUATKHO](
                    [MaLichSu] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [MaPhieuXK] [int] NOT NULL,
                    [TrangThaiCu] [nvarchar](50) NULL,
                    [TrangThaiMoi] [nvarchar](50) NULL,
                    [NoiDungThayDoi] [nvarchar](max) NULL,
                    [MaNguoiThucHien] [int] NULL,
                    [NgayTao] [datetime2](7) NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT [FK_LICHSUPHIEUXUATKHO_PHIEUXUATKHO] FOREIGN KEY([MaPhieuXK]) REFERENCES [dbo].[PHIEUXUATKHO] ([MaPhieuXK]) ON DELETE CASCADE
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LICHSUGIAOHANG]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[LICHSUGIAOHANG](
                    [MaLichSu] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [MaPhieuGH] [int] NOT NULL,
                    [TrangThaiCu] [nvarchar](50) NULL,
                    [TrangThaiMoi] [nvarchar](50) NULL,
                    [NoiDungThayDoi] [nvarchar](max) NULL,
                    [HinhAnhXacNhan] [nvarchar](max) NULL,
                    [MaNguoiThucHien] [int] NULL,
                    [ViTriCapNhat] [nvarchar](500) NULL,
                    [NgayTao] [datetime2](7) NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT [FK_LICHSUGIAOHANG_PHIEUGIAOHANG] FOREIGN KEY([MaPhieuGH]) REFERENCES [dbo].[PHIEUGIAOHANG] ([MaPhieuGH]) ON DELETE CASCADE
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BANNER]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[BANNER](
                    [MaBanner] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [Title] [nvarchar](500) NULL,
                    [Desc] [nvarchar](max) NULL,
                    [Src] [nvarchar](max) NULL,
                    [Bg] [nvarchar](100) NULL,
                    [Panel] [nvarchar](100) NULL,
                    [IsActive] [bit] NOT NULL DEFAULT 1,
                    [OrderIndex] [int] NOT NULL DEFAULT 0
                );

                INSERT INTO [dbo].[BANNER] ([Title], [Desc], [Src], [Bg], [Panel], [IsActive], [OrderIndex])
                VALUES 
                (N'TOONHUB FIGURINES', N'The artwork is stunning, shipped fully prepared. The finish is a vision, the 3D craft is flawless. Many thanks! Wishing you the win. Order now.', N'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png', N'#F4845F', N'#F79B7F', 1, 0),
                (N'TOONHUB FIGURINES', N'The artwork is stunning, shipped fully prepared. The finish is a vision, the 3D craft is flawless. Many thanks! Wishing you the win. Order now.', N'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png', N'#6BBF7A', N'#85CC92', 1, 1),
                (N'TOONHUB FIGURINES', N'The artwork is stunning, shipped fully prepared. The finish is a vision, the 3D craft is flawless. Many thanks! Wishing you the win. Order now.', N'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png', N'#E882B4', N'#ED9DC4', 1, 2),
                (N'TOONHUB FIGURINES', N'The artwork is stunning, shipped fully prepared. The finish is a vision, the 3D craft is flawless. Many thanks! Wishing you the win. Order now.', N'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.c9bc4587.png', N'#5A9BD5', N'#7CB3E5', 1, 3);
            END

            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TEAM_MEMBER]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[TEAM_MEMBER](
                    [MaThanhVien] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [Name] [nvarchar](200) NULL,
                    [StudentId] [nvarchar](100) NULL,
                    [Role] [nvarchar](200) NULL,
                    [Avatar] [nvarchar](max) NULL,
                    [Bg] [nvarchar](100) NULL,
                    [OrderIndex] [int] NOT NULL DEFAULT 0
                );

                INSERT INTO [dbo].[TEAM_MEMBER] ([Name], [StudentId], [Role], [Avatar], [Bg], [OrderIndex])
                VALUES 
                (N'Trương Thanh Tuấn', N'2001224546', N'Trưởng nhóm phát triển', N'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png', N'#F4845F', 0),
                (N'Phạm Hồ Thúy Vy', N'2001225958', N'Thiết kế UI/UX', N'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png', N'#6BBF7A', 1),
                (N'Lê Trần Ngọc Yến', N'2001226134', N'Phát triển Backend', N'https://i.ibb.co/5hHx2KNM/Chat-GPT-Image-21-19-31-16-thg-5-2026-removebg-preview.png', N'#5A9BD5', 2);
            END
            IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TEAM_MEMBER]') AND type in (N'U'))
            BEGIN
                UPDATE [dbo].[TEAM_MEMBER] SET [Avatar] = N'https://i.ibb.co/5hHx2KNM/Chat-GPT-Image-21-19-31-16-thg-5-2026-removebg-preview.png', [Bg] = N'#5A9BD5' WHERE [StudentId] = N'2001226134';
            END
            IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BANNER]') AND type in (N'U'))
            BEGIN
                UPDATE [dbo].[BANNER] SET [Src] = N'https://i.ibb.co/5hHx2KNM/Chat-GPT-Image-21-19-31-16-thg-5-2026-removebg-preview.png', [Bg] = N'#5A9BD5', [Panel] = N'#7CB3E5' WHERE [OrderIndex] = 2;
            END
        ");

        context.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM [VAITRO] WHERE [TenVT] = N'Quản trị viên') INSERT INTO [VAITRO] ([TenVT], [NgayTao], [NgayCapNhat]) VALUES (N'Quản trị viên', GETDATE(), GETDATE());
            IF NOT EXISTS (SELECT * FROM [VAITRO] WHERE [TenVT] = N'Quản lý') INSERT INTO [VAITRO] ([TenVT], [NgayTao], [NgayCapNhat]) VALUES (N'Quản lý', GETDATE(), GETDATE());
            IF NOT EXISTS (SELECT * FROM [VAITRO] WHERE [TenVT] = N'Nhân viên bán hàng') INSERT INTO [VAITRO] ([TenVT], [NgayTao], [NgayCapNhat]) VALUES (N'Nhân viên bán hàng', GETDATE(), GETDATE());
            IF NOT EXISTS (SELECT * FROM [VAITRO] WHERE [TenVT] = N'Nhân viên kho') INSERT INTO [VAITRO] ([TenVT], [NgayTao], [NgayCapNhat]) VALUES (N'Nhân viên kho', GETDATE(), GETDATE());
            IF NOT EXISTS (SELECT * FROM [VAITRO] WHERE [TenVT] = N'Tài xế') INSERT INTO [VAITRO] ([TenVT], [NgayTao], [NgayCapNhat]) VALUES (N'Tài xế', GETDATE(), GETDATE());

            DELETE FROM [PHANQUYEN];

            INSERT INTO [PHANQUYEN] ([MaVaiTro], [MaQuyen])
            SELECT v.[MaVaiTro], q.[MaQuyen] FROM [VAITRO] v, [QUYEN] q 
            WHERE v.[TenVT] = N'Quản trị viên' AND q.[MaQ] IN ('Q01', 'Q06', 'Q09');

            INSERT INTO [PHANQUYEN] ([MaVaiTro], [MaQuyen])
            SELECT v.[MaVaiTro], q.[MaQuyen] FROM [VAITRO] v, [QUYEN] q 
            WHERE v.[TenVT] = N'Quản lý' AND q.[MaQ] IN ('Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'Q07', 'Q08', 'Q09');

            INSERT INTO [PHANQUYEN] ([MaVaiTro], [MaQuyen])
            SELECT v.[MaVaiTro], q.[MaQuyen] FROM [VAITRO] v, [QUYEN] q 
            WHERE v.[TenVT] = N'Nhân viên bán hàng' AND q.[MaQ] IN ('Q10', 'Q03', 'Q06', 'Q09');

            INSERT INTO [PHANQUYEN] ([MaVaiTro], [MaQuyen])
            SELECT v.[MaVaiTro], q.[MaQuyen] FROM [VAITRO] v, [QUYEN] q 
            WHERE v.[TenVT] = N'Nhân viên kho' AND q.[MaQ] IN ('Q02', 'Q04', 'Q09');

            INSERT INTO [PHANQUYEN] ([MaVaiTro], [MaQuyen])
            SELECT v.[MaVaiTro], q.[MaQuyen] FROM [VAITRO] v, [QUYEN] q 
            WHERE v.[TenVT] = N'Tài xế' AND q.[MaQ] IN ('Q05', 'Q04', 'Q09');

            DELETE FROM [NHANVIEN_MODULE_QUYEN];
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
