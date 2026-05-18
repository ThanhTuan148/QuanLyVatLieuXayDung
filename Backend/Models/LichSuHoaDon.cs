using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("LICHSUHOADON")]
    public class LichSuHoaDon
    {
        [Key][Column("MaLichSu")] public int MaLichSu { get; set; }
        [Column("MaHoaDon")] public int MaHoaDon { get; set; }
        [Column("TrangThaiCu")] public string? TrangThaiCu { get; set; }
        [Column("TrangThaiMoi")] public string? TrangThaiMoi { get; set; }
        [Column("NoiDungThayDoi")] public string? NoiDungThayDoi { get; set; }
        [Column("MaNguoiThucHien")] public int? MaNguoiThucHien { get; set; }
        [Column("NgayTao")] public DateTime NgayTao { get; set; } = DateTime.UtcNow;

        [ForeignKey("MaHoaDon")] public virtual HoaDon HoaDon { get; set; } = null!;
        [ForeignKey("MaNguoiThucHien")] public virtual NhanVien? NhanVien { get; set; }
    }
}
