using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("PHIEUDOITRA")]
    public class PhieuDoiTra
    {
        [Key][Column("MaPhieuDT")] public int MaPhieuDT { get; set; }
        [Column("MaDT")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaDT { get; set; }
        [Column("NgayDT")] public DateTime NgayDT { get; set; }
        [Column("TongTienHoan")] public decimal? TongTienHoan { get; set; }
        [Column("LyDo")] public string? LyDo { get; set; }
        [Column("GhiChu")] public string? GhiChu { get; set; }
        [Column("TrangThai")] public string? TrangThai { get; set; }
        [Column("HinhAnhMinhChung")] public string? HinhAnhMinhChung { get; set; }
        [Column("TrangThaiNhapKho")] public string? TrangThaiNhapKho { get; set; }
        [Column("Loai")] public string? Loai { get; set; } // "Trả hàng" hoặc "Đổi hàng"
        [Column("LoiDo")] public string? LoiDo { get; set; } // "Khách hàng" hoặc "Cửa hàng"
        [Column("PhiVanChuyenMoi")] public decimal? PhiVanChuyenMoi { get; set; }
        [Column("MaHoaDon")] public int MaHoaDon { get; set; }
        [Column("MaNhanVien")] public int MaNhanVien { get; set; }
        [Column("NgayTao")] public DateTime NgayTao { get; set; }
        [Column("NgayCapNhat")] public DateTime NgayCapNhat { get; set; }

        [ForeignKey("MaHoaDon")] public virtual HoaDon HoaDon { get; set; }
        [ForeignKey("MaNhanVien")] public virtual NhanVien NhanVien { get; set; }
        public virtual ICollection<CTPhieuDoiTra> CTPhieuDoiTras { get; set; }
    }
}
