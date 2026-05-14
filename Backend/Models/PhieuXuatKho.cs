using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("PHIEUXUATKHO")]
    public class PhieuXuatKho
    {
        public PhieuXuatKho()
        {
            ChiTiet = new HashSet<CTPhieuXuatKho>();
        }

        [Key][Column("MaPhieuXK")] public int MaPhieuXK { get; set; }
        [Column("MaXK")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string? MaXK { get; set; }
        
        [Column("NgayXuat")] public DateTime NgayXuat { get; set; }
        [Column("NguoiXuat")] public string? NguoiXuat { get; set; }
        [Column("GhiChu")] public string? GhiChu { get; set; }
        
        [Column("MaPhieuGH")] public int? MaPhieuGH { get; set; }
        [Column("MaHoaDon")] public int? MaHoaDon { get; set; }
        [Column("MaNhanVien")] public int? MaNhanVien { get; set; }
        [Column("MaNguoiDuyet")] public int? MaNguoiDuyet { get; set; }
        [Column("NgayDuyet")] public DateTime? NgayDuyet { get; set; }
        [Column("ChuKyNguoiLap")] public string? ChuKyNguoiLap { get; set; }
        [Column("ChuKyQuanLy")] public string? ChuKyQuanLy { get; set; }
        [Column("MaNguoiXuatKho")] public int? MaNguoiXuatKho { get; set; }
        [Column("ChuKyNguoiXuatKho")] public string? ChuKyNguoiXuatKho { get; set; }
        [Column("MaNguoiNhan")] public int? MaNguoiNhan { get; set; }
        [Column("ChuKyNguoiNhan")] public string? ChuKyNguoiNhan { get; set; }
        [Column("TrangThai")] public string? TrangThai { get; set; } // Chờ duyệt, Chờ xuất, Đã xuất
        
        [Column("NgayTao")] public DateTime NgayTao { get; set; }

        [ForeignKey("MaPhieuGH")] public virtual PhieuGiaoHang? PhieuGiaoHang { get; set; }
        [ForeignKey("MaHoaDon")] public virtual HoaDon? HoaDon { get; set; }
        [ForeignKey("MaNhanVien")] public virtual NhanVien? NhanVien { get; set; }
        [ForeignKey("MaNguoiDuyet")] public virtual NhanVien? NguoiDuyet { get; set; }
        
        public virtual ICollection<CTPhieuXuatKho> ChiTiet { get; set; }
    }
}
