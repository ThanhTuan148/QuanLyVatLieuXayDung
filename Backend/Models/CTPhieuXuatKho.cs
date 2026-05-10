using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("CTPHIEUXUATKHO")]
    public class CTPhieuXuatKho
    {
        [Key][Column("MaCTXK")] public int MaCTXK { get; set; }
        [Column("MaPhieuXK")] public int MaPhieuXK { get; set; }
        [Column("MaSanPham")] public int MaSanPham { get; set; }
        [Column("SoLuong")] public int SoLuong { get; set; }
        [Column("MaKho")] public int? MaKho { get; set; }
        [Column("DonGiaVon")] public decimal? DonGiaVon { get; set; }

        [ForeignKey("MaPhieuXK")] public virtual PhieuXuatKho PhieuXuatKho { get; set; }
        [ForeignKey("MaSanPham")] public virtual SanPham SanPham { get; set; }
        [ForeignKey("MaKho")] public virtual KhoHang? KhoHang { get; set; }
    }
}
