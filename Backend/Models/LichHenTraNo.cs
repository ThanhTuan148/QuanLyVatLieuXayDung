using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("LICHHENTRANO")]
    public class LichHenTraNo
    {
        [Key][Column("MaHen")] public int MaHen { get; set; }
        [Column("MaCongNo")] public int MaCongNo { get; set; }
        [Column("NgayHen")] public DateTime NgayHen { get; set; }
        [Column("SoTienDuKien")] public decimal SoTienDuKien { get; set; }
        [Column("GhiChu")] public string? GhiChu { get; set; }
        [Column("TrangThai")] public string? TrangThai { get; set; }
        [Column("NgayTao")] public DateTime NgayTao { get; set; }

        [ForeignKey("MaCongNo")] public virtual CongNo CongNo { get; set; } = null!;
    }
}
