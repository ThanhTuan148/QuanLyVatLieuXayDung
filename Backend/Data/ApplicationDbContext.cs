using Microsoft.EntityFrameworkCore;
using BuildingMaterialAPI.Models;

namespace BuildingMaterialAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        // Phân quyền
        public DbSet<Quyen> Quyens { get; set; }
        public DbSet<VaiTro> VaiTros { get; set; }
        public DbSet<PhanQuyen> PhanQuyens { get; set; }
        public DbSet<TaiKhoan> TaiKhoans { get; set; }

        // Nhân sự
        public DbSet<NhanVien> NhanViens { get; set; }
        public DbSet<NhanVienModuleQuyen> NhanVienModuleQuyens { get; set; }
        public DbSet<KhachHang> KhachHangs { get; set; }

        // Sản phẩm & Kho
        public DbSet<LoaiSanPham> LoaiSanPhams { get; set; }
        public DbSet<NhaCungCap> NhaCungCaps { get; set; }
        public DbSet<SanPham> SanPhams { get; set; }
        public DbSet<KhoHang> KhoHangs { get; set; }
        public DbSet<CTKhoHang> CTKhoHangs { get; set; }
        public DbSet<NhaCungCapSanPham> NhaCungCapSanPhams { get; set; }

        // Mua hàng
        public DbSet<PhieuNhap> PhieuNhaps { get; set; }
        public DbSet<CTPN> CTPNs { get; set; }

        // Bán hàng

        public DbSet<HoaDon> HoaDons { get; set; }
        public DbSet<CTHD> CTHDs { get; set; }

        // Đổi trả & Giao hàng
        public DbSet<PhieuDoiTra> PhieuDoiTras { get; set; }
        public DbSet<CTPhieuDoiTra> CTPhieuDoiTras { get; set; }
        public DbSet<PhieuTraHangNCC> PhieuTraHangNCCs { get; set; }
        public DbSet<CTPhieuTraHangNCC> CTPhieuTraHangNCCs { get; set; }
        public DbSet<PhieuGiaoHang> PhieuGiaoHangs { get; set; }
        public DbSet<CTPhieuGiaoHang> CTPhieuGiaoHangs { get; set; }
        public DbSet<PhieuXuatKho> PhieuXuatKhos { get; set; }
        public DbSet<CTPhieuXuatKho> CTPhieuXuatKhos { get; set; }
        public DbSet<LichSuPhieuXuatKho> LichSuPhieuXuatKhos { get; set; }
        public DbSet<LichSuGiaoHang> LichSuGiaoHangs { get; set; }

        // Công nợ
        public DbSet<CongNo> CongNos { get; set; }
        public DbSet<ChiTietTraNo> ChiTietTraNos { get; set; }

        // Khuyến mãi
        public DbSet<KhuyenMai> KhuyenMais { get; set; }
        public DbSet<KhuyenMaiDoiTuong> KhuyenMaiDoiTuongs { get; set; }
        public DbSet<VoucherUuDai> VoucherUuDais { get; set; }
        public DbSet<LichSuGia> LichSuGias { get; set; }
        public DbSet<ThongBao> ThongBaos { get; set; }
        public DbSet<LichSuPhieuNhap> LichSuPhieuNhaps { get; set; }
        public DbSet<LichSuHoaDon> LichSuHoaDons { get; set; }


        // Hệ thống
        public DbSet<NhatKy> NhatKys { get; set; }
        public DbSet<DanhGia> DanhGias { get; set; }
        public DbSet<LichSuThangHang> LichSuThangHangs { get; set; }
        public DbSet<LichHenTraNo> LichHenTraNos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Lịch hẹn trả nợ
            modelBuilder.Entity<LichHenTraNo>()
                .HasOne(l => l.CongNo)
                .WithMany()
                .HasForeignKey(l => l.MaCongNo)
                .OnDelete(DeleteBehavior.Cascade);

            // Lịch sử thăng hạng
            modelBuilder.Entity<LichSuThangHang>()
                .HasOne(l => l.KhachHang)
                .WithMany()
                .HasForeignKey(l => l.MaKhachHang)
                .OnDelete(DeleteBehavior.Cascade);

            // Đánh giá
            modelBuilder.Entity<DanhGia>()
                .HasOne(dg => dg.SanPham)
                .WithMany(sp => sp.DanhGias)
                .HasForeignKey(dg => dg.MaSanPham)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DanhGia>()
                .HasOne(dg => dg.KhachHang)
                .WithMany(kh => kh.DanhGias)
                .HasForeignKey(dg => dg.MaKhachHang)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DanhGia>()
                .HasOne(dg => dg.HoaDon)
                .WithMany()
                .HasForeignKey(dg => dg.MaHoaDon)
                .OnDelete(DeleteBehavior.SetNull);

            // Phân quyền N-N
            modelBuilder.Entity<PhanQuyen>()
                .HasOne(pq => pq.VaiTro)
                .WithMany(vt => vt.PhanQuyens)
                .HasForeignKey(pq => pq.MaVaiTro)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PhanQuyen>()
                .HasOne(pq => pq.Quyen)
                .WithMany(q => q.PhanQuyens)
                .HasForeignKey(pq => pq.MaQuyen)
                .OnDelete(DeleteBehavior.Cascade);

            // Tài khoản → Vai trò
            modelBuilder.Entity<TaiKhoan>()
                .HasOne(tk => tk.VaiTro)
                .WithMany(vt => vt.TaiKhoans)
                .HasForeignKey(tk => tk.MaVaiTro)
                .OnDelete(DeleteBehavior.Restrict);

            // Nhân viên → Tài khoản (1-1)
            modelBuilder.Entity<NhanVien>()
                .HasOne(nv => nv.TaiKhoan)
                .WithOne(tk => tk.NhanVien)
                .HasForeignKey<NhanVien>(nv => nv.MaTaiKhoan)
                .OnDelete(DeleteBehavior.SetNull);

            // NhanVienModuleQuyen → NhanVien
            modelBuilder.Entity<NhanVienModuleQuyen>()
                .HasOne(nmq => nmq.NhanVien)
                .WithMany()
                .HasForeignKey(nmq => nmq.MaNhanVien)
                .OnDelete(DeleteBehavior.Cascade);

            // Khách hàng → Tài khoản
            modelBuilder.Entity<KhachHang>()
                .HasOne(kh => kh.TaiKhoan)
                .WithOne(tk => tk.KhachHang)
                .HasForeignKey<KhachHang>(kh => kh.MaTaiKhoan)
                .OnDelete(DeleteBehavior.SetNull);

            // Sản phẩm → Loại SP
            modelBuilder.Entity<SanPham>()
                .HasOne(sp => sp.LoaiSanPham)
                .WithMany(lsp => lsp.SanPhams)
                .HasForeignKey(sp => sp.MaLoaiSP)
                .OnDelete(DeleteBehavior.Restrict);

            // CTKhoHang → KhoHang + SanPham
            modelBuilder.Entity<CTKhoHang>()
                .HasOne(ct => ct.KhoHang)
                .WithMany(kh => kh.CTKhoHangs)
                .HasForeignKey(ct => ct.MaKhoHang);

            modelBuilder.Entity<CTKhoHang>()
                .HasOne(ct => ct.SanPham)
                .WithMany(sp => sp.CTKhoHangs)
                .HasForeignKey(ct => ct.MaSanPham);

            // Hóa đơn → NV + KH
            modelBuilder.Entity<HoaDon>()
                .HasOne(hd => hd.NhanVien)
                .WithMany(nv => nv.HoaDons)
                .HasForeignKey(hd => hd.MaNhanVien)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<HoaDon>()
                .HasOne(hd => hd.KhachHang)
                .WithMany(kh => kh.HoaDons)
                .HasForeignKey(hd => hd.MaKhachHang)
                .OnDelete(DeleteBehavior.Restrict);

            // CTHD → HoaDon (cascade)
            modelBuilder.Entity<CTHD>()
                .HasOne(ct => ct.HoaDon)
                .WithMany(hd => hd.CTHDs)
                .HasForeignKey(ct => ct.MaHoaDon)
                .OnDelete(DeleteBehavior.Cascade);



            // Phiếu nhập → NCC + NV
            modelBuilder.Entity<PhieuNhap>()
                .HasOne(pn => pn.NhaCungCap)
                .WithMany(ncc => ncc.PhieuNhaps)
                .HasForeignKey(pn => pn.MaNhaCungCap)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PhieuNhap>()
                .HasOne(pn => pn.NhanVien)
                .WithMany(nv => nv.PhieuNhaps)
                .HasForeignKey(pn => pn.MaNhanVien)
                .OnDelete(DeleteBehavior.Restrict);

            // CTPN → PhieuNhap (cascade)
            modelBuilder.Entity<CTPN>()
                .HasOne(ct => ct.PhieuNhap)
                .WithMany(pn => pn.CTPNs)
                .HasForeignKey(ct => ct.MaPhieuNhap)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CTPN>()
                .HasOne(ct => ct.KhoHang)
                .WithMany()
                .HasForeignKey(ct => ct.MaKhoHang)
                .OnDelete(DeleteBehavior.SetNull);

            // Phiếu đổi trả
            modelBuilder.Entity<PhieuDoiTra>()
                .HasOne(pdt => pdt.HoaDon)
                .WithMany(hd => hd.PhieuDoiTras)
                .HasForeignKey(pdt => pdt.MaHoaDon)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PhieuDoiTra>()
                .HasOne(pdt => pdt.NhanVien)
                .WithMany(nv => nv.PhieuDoiTras)
                .HasForeignKey(pdt => pdt.MaNhanVien)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CTPhieuDoiTra>()
                .HasOne(ct => ct.PhieuDoiTra)
                .WithMany(pdt => pdt.CTPhieuDoiTras)
                .HasForeignKey(ct => ct.MaPhieuDT)
                .OnDelete(DeleteBehavior.Cascade);

            // Phiếu giao hàng
            modelBuilder.Entity<PhieuGiaoHang>()
                .HasOne(pgh => pgh.HoaDon)
                .WithMany(hd => hd.PhieuGiaoHangs)
                .HasForeignKey(pgh => pgh.MaHoaDon)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PhieuGiaoHang>()
                .HasOne(pgh => pgh.NhanVien)
                .WithMany(nv => nv.PhieuGiaoHangs)
                .HasForeignKey(pgh => pgh.MaNhanVien)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CTPhieuGiaoHang>()
                .HasOne(ct => ct.PhieuGiaoHang)
                .WithMany(pgh => pgh.CTPhieuGiaoHangs)
                .HasForeignKey(ct => ct.MaPhieuGH)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CTPhieuGiaoHang>()
                .HasOne(ct => ct.SanPham)
                .WithMany()
                .HasForeignKey(ct => ct.MaSanPham)
                .OnDelete(DeleteBehavior.Restrict);

            // Phiếu xuất kho
            modelBuilder.Entity<CTPhieuXuatKho>()
                .HasOne(ct => ct.PhieuXuatKho)
                .WithMany(p => p.ChiTiet)
                .HasForeignKey(ct => ct.MaPhieuXK)
                .OnDelete(DeleteBehavior.Cascade);

            // Công nợ
            modelBuilder.Entity<CongNo>()
                .HasOne(cn => cn.KhachHang)
                .WithMany(kh => kh.CongNos)
                .HasForeignKey(cn => cn.MaKhachHang)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CongNo>()
                .HasOne(cn => cn.NhaCungCap)
                .WithMany(ncc => ncc.CongNos)
                .HasForeignKey(cn => cn.MaNhaCungCap)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CongNo>()
                .HasOne(cn => cn.PhieuNhap)
                .WithMany(pn => pn.CongNos)
                .HasForeignKey(cn => cn.MaPhieuNhap)
                .OnDelete(DeleteBehavior.Restrict);



            // Chi tiết trả nợ
            modelBuilder.Entity<ChiTietTraNo>()
                .HasOne(ct => ct.HoaDon)
                .WithMany(hd => hd.ChiTietTraNos)
                .HasForeignKey(ct => ct.MaHoaDon)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChiTietTraNo>()
                .HasOne(ct => ct.PhieuNhap)
                .WithMany()
                .HasForeignKey(ct => ct.MaPhieuNhap)
                .OnDelete(DeleteBehavior.Restrict);



            modelBuilder.Entity<ChiTietTraNo>()
                .HasOne(ct => ct.CongNo)
                .WithMany()
                .HasForeignKey(ct => ct.MaCongNo)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChiTietTraNo>()
                .HasOne(ct => ct.NhanVien)
                .WithMany(nv => nv.ChiTietTraNos)
                .HasForeignKey(ct => ct.MaNhanVien)
                .OnDelete(DeleteBehavior.Restrict);

            // Khuyến mãi đối tượng
            modelBuilder.Entity<KhuyenMaiDoiTuong>()
                .HasOne(km => km.KhuyenMai)
                .WithMany(k => k.KhuyenMaiDoiTuongs)
                .HasForeignKey(km => km.MaKhuyenMai)
                .OnDelete(DeleteBehavior.Cascade);






            // Nhật ký → TK
            modelBuilder.Entity<NhatKy>()
                .HasOne(nk => nk.TaiKhoan)
                .WithMany(tk => tk.NhatKys)
                .HasForeignKey(nk => nk.MaTaiKhoan)
                .OnDelete(DeleteBehavior.Restrict);

            // ===================================
            // CẤU HÌNH CỘT TÍNH TOÁN (COMPUTED)
            // ===================================
            // Decimal precision configuration
            foreach (var property in modelBuilder.Model.GetEntityTypes()
                .SelectMany(t => t.GetProperties())
                .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetColumnType("decimal(18,2)");
            }

            modelBuilder.Entity<Quyen>().Property(e => e.MaQ).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<VaiTro>().Property(e => e.MaVT).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<TaiKhoan>().Property(e => e.MaTK).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<NhanVien>().Property(e => e.MaNV).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<KhachHang>().Property(e => e.MaKH).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<LoaiSanPham>().Property(e => e.MaLoai).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<NhaCungCap>().Property(e => e.MaNCC).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<SanPham>().Property(e => e.MaSP).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<KhoHang>().Property(e => e.MaKho).ValueGeneratedOnAddOrUpdate();

            modelBuilder.Entity<PhieuNhap>().Property(e => e.MaPN).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<HoaDon>().Property(e => e.MaHD).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<PhieuDoiTra>().Property(e => e.MaDT).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<PhieuGiaoHang>().Property(e => e.MaGH).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<CongNo>().Property(e => e.MaCN).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<ChiTietTraNo>().Property(e => e.MaTT).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<KhuyenMai>().Property(e => e.MaKM).ValueGeneratedOnAddOrUpdate();
            modelBuilder.Entity<PhieuXuatKho>().Property(e => e.MaXK).ValueGeneratedOnAddOrUpdate();

        }
    }
}
