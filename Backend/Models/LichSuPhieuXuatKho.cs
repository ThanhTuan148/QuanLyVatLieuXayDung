using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("LICHSUPHIEUXUATKHO")]
    public class LichSuPhieuXuatKho
    {
        [Key][Column("MaLichSu")] public int MaLichSu { get; set; }
        [Column("MaPhieuXK")] public int MaPhieuXK { get; set; }
        [Column("TrangThaiCu")] public string? TrangThaiCu { get; set; }
        [Column("TrangThaiMoi")] public string? TrangThaiMoi { get; set; }
        [Column("NoiDungThayDoi")] public string? NoiDungThayDoi { get; set; }
        [Column("NgayTao")] public DateTime NgayTao { get; set; } = DateTime.UtcNow;
        [Column("MaNguoiThucHien")] public int? MaNguoiThucHien { get; set; }

        [ForeignKey("MaPhieuXK")] public virtual PhieuXuatKho? PhieuXuatKho { get; set; }
        [ForeignKey("MaNguoiThucHien")] public virtual NhanVien? NhanVien { get; set; }
    }
}
