using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("HOADON")]
    public class HoaDon
    {
        public HoaDon()
        {
            CTHDs = new HashSet<CTHD>();
            PhieuDoiTras = new HashSet<PhieuDoiTra>();
            PhieuGiaoHangs = new HashSet<PhieuGiaoHang>();
            CongNos = new HashSet<CongNo>();
            ChiTietTraNos = new HashSet<ChiTietTraNo>();
            ChiTietKhuyenMais = new HashSet<ChiTietKhuyenMai>();
        }

        [Key][Column("MaHoaDon")] public int MaHoaDon { get; set; }
        [Column("MaHD")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaHD { get; set; } = null!;
        [Column("NgayLap")] public DateTime NgayLap { get; set; }
        [Column("NgayGiao")] public DateTime? NgayGiao { get; set; }
        [Column("TongTien")] public decimal? TongTien { get; set; }
        [Column("GiamGia")] public decimal GiamGia { get; set; }
        [Column("ThanhToan")] public decimal? ThanhToan { get; set; }
        [Column("TrangThai")] public string? TrangThai { get; set; }
        [Column("PTTT")] public string? PTTT { get; set; }
        [Column("GhiChu")] public string? GhiChu { get; set; }
        [Column("MaNhanVien")] public int? MaNhanVien { get; set; }
        [Column("MaKhachHang")] public int? MaKhachHang { get; set; }
        [Column("NgayTao")] public DateTime NgayTao { get; set; }
        [Column("NgayCapNhat")] public DateTime NgayCapNhat { get; set; }
        
        // Delivery Info
        [Column("TenNguoiNhan")] public string? TenNguoiNhan { get; set; }
        [Column("SdtNguoiNhan")] public string? SdtNguoiNhan { get; set; }
        [Column("EmailNguoiNhan")] public string? EmailNguoiNhan { get; set; }
        [Column("DiaChiGiaoHang")] public string? DiaChiGiaoHang { get; set; }
        [Column("PhiVanChuyen")] public decimal PhiVanChuyen { get; set; }
        
        // VAT Info
        [Column("YeuCauVat")] public bool YeuCauVat { get; set; }
        [Column("VatType")] public string? VatType { get; set; }
        [Column("VatBuyerName")] public string? VatBuyerName { get; set; }
        [Column("VatEmail")] public string? VatEmail { get; set; }
        [Column("VatAddress")] public string? VatAddress { get; set; }
        [Column("VatIdCard")] public string? VatIdCard { get; set; }
        [Column("VatPassport")] public string? VatPassport { get; set; }
        [Column("VatCompanyName")] public string? VatCompanyName { get; set; }
        [Column("VatCompanyAddress")] public string? VatCompanyAddress { get; set; }
        [Column("VatTaxId")] public string? VatTaxId { get; set; }
        [Column("VatBudgetCode")] public string? VatBudgetCode { get; set; }
        [Column("AnhBangChung")] public string? AnhBangChung { get; set; }
        [Column("SoTienPhaiThu")] public decimal SoTienPhaiThu { get; set; }
 
        [ForeignKey("MaNhanVien")] public virtual NhanVien? NhanVien { get; set; }
        [ForeignKey("MaKhachHang")] public virtual KhachHang? KhachHang { get; set; }
 
        public virtual ICollection<CTHD> CTHDs { get; set; } = new List<CTHD>();
        public virtual ICollection<PhieuDoiTra> PhieuDoiTras { get; set; } = new List<PhieuDoiTra>();
        public virtual ICollection<PhieuGiaoHang> PhieuGiaoHangs { get; set; } = new List<PhieuGiaoHang>();
        public virtual ICollection<CongNo> CongNos { get; set; } = new List<CongNo>();
        public virtual ICollection<ChiTietTraNo> ChiTietTraNos { get; set; } = new List<ChiTietTraNo>();
        public virtual ICollection<ChiTietKhuyenMai> ChiTietKhuyenMais { get; set; } = new List<ChiTietKhuyenMai>();
        public virtual PhieuXuatKho? PhieuXuatKho { get; set; }
    }
}
