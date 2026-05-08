using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("CT_PHIEUTRAHANG_NCC")]
    public class CTPhieuTraHangNCC
    {
        [Key][Column("MaCTPT")] public int MaCTPT { get; set; }
        [Column("MaPhieuTra")] public int MaPhieuTra { get; set; }
        [Column("MaSanPham")] public int MaSanPham { get; set; }
        [Column("SoLuongTra")] public int SoLuongTra { get; set; }
        [Column("DonGia")] public decimal DonGia { get; set; }
        [Column("ThanhTien")] public decimal? ThanhTien { get; set; }

        [ForeignKey("MaPhieuTra")] public virtual PhieuTraHangNCC PhieuTraHangNCC { get; set; }
        [ForeignKey("MaSanPham")] public virtual SanPham SanPham { get; set; }
    }
}
