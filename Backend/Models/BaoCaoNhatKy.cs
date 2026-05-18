using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("NHATKY")]
    public class NhatKy
    {
        [Key][Column("MaNhatKy")] public int MaNhatKy { get; set; }
        [Column("MaTaiKhoan")] public int MaTaiKhoan { get; set; }
        [Column("HanhDong")] public string HanhDong { get; set; } = null!;
        [Column("TenBang")] public string? TenBang { get; set; }
        [Column("MaBanGhi")] public int? MaBanGhi { get; set; }
        [Column("GiaTriCu")] public string? GiaTriCu { get; set; }
        [Column("GiaTriMoi")] public string? GiaTriMoi { get; set; }
        [Column("ThoiGian")] public DateTime ThoiGian { get; set; }

        [ForeignKey("MaTaiKhoan")] public virtual TaiKhoan TaiKhoan { get; set; } = null!;
    }
}
