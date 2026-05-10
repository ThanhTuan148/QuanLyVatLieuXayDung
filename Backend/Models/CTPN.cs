using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("CTPN")]
    public class CTPN
    {
        [Key][Column("MaCTPN")] public int MaCTPN { get; set; }
        [Column("MaPhieuNhap")] public int MaPhieuNhap { get; set; }
        [Column("MaSanPham")] public int MaSanPham { get; set; }
        [Column("SoLuong")] public int SoLuong { get; set; }
        [Column("DonGia")] public decimal DonGia { get; set; }
        [Column("ThanhTien")] public decimal? ThanhTien { get; set; }
        [Column("SoLuongDaNhan")] public int SoLuongDaNhan { get; set; }
        [Column("NgayTao")] public DateTime NgayTao { get; set; }
        /// <summary>null = chưa xử lý | "Đã Duyệt" | "Không Duyệt"</summary>
        [Column("TrangThai")] public string? TrangThai { get; set; }
        [Column("GhiChu")] public string? GhiChu { get; set; }
        [Column("MaKhoHang")] public int? MaKhoHang { get; set; }
        [Column("MaNhaCungCap")] public int? MaNhaCungCap { get; set; }

        [ForeignKey("MaPhieuNhap")] public virtual PhieuNhap PhieuNhap { get; set; }
        [ForeignKey("MaSanPham")] public virtual SanPham SanPham { get; set; }
        [ForeignKey("MaKhoHang")] public virtual KhoHang? KhoHang { get; set; }
        [ForeignKey("MaNhaCungCap")] public virtual NhaCungCap? NhaCungCap { get; set; }
    }
}
