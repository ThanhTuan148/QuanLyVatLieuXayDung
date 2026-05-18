using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("CHITETTRANO")]
    public class ChiTietTraNo
    {
        [Key][Column("MaChiTietTN")] public int MaChiTietTN { get; set; }
        [Column("MaTT")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaTT { get; set; } = null!;
        [Column("NgayTT")] public DateTime NgayTT { get; set; }
        [Column("SoTien")] public decimal SoTien { get; set; }
        [Column("PTTT")] public string? PTTT { get; set; }
        [Column("SoGiaoDich")] public string? SoGiaoDich { get; set; }
        [Column("TrangThai")] public string? TrangThai { get; set; }
        [Column("MaHoaDon")] public int? MaHoaDon { get; set; }
        [Column("MaPhieuNhap")] public int? MaPhieuNhap { get; set; }

        [Column("MaCongNo")] public int MaCongNo { get; set; }
        [Column("MaNhanVien")] public int? MaNhanVien { get; set; }
        [Column("GhiChu")] public string? GhiChu { get; set; }
        [Column("AnhBangChung")] public string? AnhBangChung { get; set; }
        [Column("NgayTao")] public DateTime NgayTao { get; set; }

        [ForeignKey("MaHoaDon")] public virtual HoaDon? HoaDon { get; set; }
        [ForeignKey("MaPhieuNhap")] public virtual PhieuNhap? PhieuNhap { get; set; }

        [ForeignKey("MaCongNo")] public virtual CongNo CongNo { get; set; } = null!;
        [ForeignKey("MaNhanVien")] public virtual NhanVien? NhanVien { get; set; }
    }
}
