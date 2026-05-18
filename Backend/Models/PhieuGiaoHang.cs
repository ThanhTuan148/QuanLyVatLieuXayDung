using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("PHIEUGIAOHANG")]
    public class PhieuGiaoHang
    {
        public PhieuGiaoHang()
        {
            CTPhieuGiaoHangs = new HashSet<CTPhieuGiaoHang>();
        }

        [Key][Column("MaPhieuGH")] public int MaPhieuGH { get; set; }
        [Column("MaGH")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaGH { get; set; } = null!;
        [Column("NguoiGiao")] public string? NguoiGiao { get; set; }
        [Column("NgayGiao")] public DateTime NgayGiao { get; set; }
        [Column("NgayGiaoDuKien")] public DateTime? NgayGiaoDuKien { get; set; }
        [Column("NgayGiaoThucTe")] public DateTime? NgayGiaoThucTe { get; set; }
        [Column("DiaChi")] public string? DiaChi { get; set; }
        [Column("TrangThai")] public string? TrangThai { get; set; }
        [Column("ViTriHienTai")] public string? ViTriHienTai { get; set; }
        [Column("Lat")] public decimal? Lat { get; set; }
        [Column("Lng")] public decimal? Lng { get; set; }
        [Column("GhiChu")] public string? GhiChu { get; set; }
        [Column("MaHoaDon")] public int? MaHoaDon { get; set; }
        [Column("MaNhanVien")] public int? MaNhanVien { get; set; }
        [Column("NgayTao")] public DateTime NgayTao { get; set; }
        [Column("NgayCapNhat")] public DateTime NgayCapNhat { get; set; }
        [Column("SoTienThu")] public decimal? SoTienThu { get; set; }
 
        [ForeignKey("MaHoaDon")] public virtual HoaDon? HoaDon { get; set; }
        [ForeignKey("MaNhanVien")] public virtual NhanVien? NhanVien { get; set; }
        public virtual ICollection<CTPhieuGiaoHang> CTPhieuGiaoHangs { get; set; } = new List<CTPhieuGiaoHang>();
    }
}
