using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("CTPHIEUDOITRA")]
    public class CTPhieuDoiTra
    {
        [Key][Column("MaCTDT")] public int MaCTDT { get; set; }
        [Column("MaPhieuDT")] public int MaPhieuDT { get; set; }
        [Column("MaSanPham")] public int MaSanPham { get; set; }
        [Column("SoLuong")] public int SoLuong { get; set; }
        [Column("DonGia")] public decimal DonGia { get; set; }
        [Column("ThanhTien")] public decimal? ThanhTien { get; set; }
        [Column("Loai")] public string? Loai { get; set; } // "Trả hàng" hoặc "Đổi hàng"
        [Column("TrangThai")] public string? TrangThai { get; set; } = "Chờ duyệt";
        [Column("NgayTao")] public DateTime NgayTao { get; set; }

        [ForeignKey("MaPhieuDT")] public virtual PhieuDoiTra PhieuDoiTra { get; set; }
        [ForeignKey("MaSanPham")] public virtual SanPham SanPham { get; set; }
    }
}
