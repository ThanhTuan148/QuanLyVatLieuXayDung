using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("LICHSUGIAOHANG")]
    public class LichSuGiaoHang
    {
        [Key][Column("MaLichSu")] public int MaLichSu { get; set; }
        [Column("MaPhieuGH")] public int MaPhieuGH { get; set; }
        [Column("TrangThaiCu")] public string? TrangThaiCu { get; set; }
        [Column("TrangThaiMoi")] public string? TrangThaiMoi { get; set; }
        [Column("NoiDungThayDoi")] public string? NoiDungThayDoi { get; set; }
        [Column("HinhAnhXacNhan")] public string? HinhAnhXacNhan { get; set; } // Base64 or URL
        [Column("NgayTao")] public DateTime NgayTao { get; set; } = DateTime.UtcNow;
        [Column("MaNguoiThucHien")] public int? MaNguoiThucHien { get; set; }
        [Column("ViTriCapNhat")] public string? ViTriCapNhat { get; set; }

        [ForeignKey("MaPhieuGH")]
        public virtual PhieuGiaoHang? PhieuGiaoHang { get; set; }
    }
}
