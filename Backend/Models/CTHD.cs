using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("CTHD")]
    public class CTHD
    {
        [Key][Column("MaCTHD")] public int MaCTHD { get; set; }
        [Column("MaHoaDon")] public int MaHoaDon { get; set; }
        [Column("MaSanPham")] public int MaSanPham { get; set; }
        [Column("SoLuong")] public int SoLuong { get; set; }
        [Column("DonGia")] public decimal DonGia { get; set; }
        [Column("GiamGia")] public decimal GiamGia { get; set; }
        [Column("ThanhTien")] public decimal? ThanhTien { get; set; }
        [Column("NgayTao")] public DateTime NgayTao { get; set; }
        [Column("DiaChiGiaoHang")] public string? DiaChiGiaoHang { get; set; }
        [Column("TenNguoiNhan")] public string? TenNguoiNhan { get; set; }
        [Column("SdtNguoiNhan")] public string? SdtNguoiNhan { get; set; }
        [Column("SoLuongDaGiao")] public int SoLuongDaGiao { get; set; }

        [ForeignKey("MaHoaDon")] public virtual HoaDon HoaDon { get; set; } = null!;
        [ForeignKey("MaSanPham")] public virtual SanPham SanPham { get; set; } = null!;
    }
}
