using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("PHIEUNHAP")]
    public class PhieuNhap
    {
        [Key][Column("MaPhieuNhap")] public int MaPhieuNhap { get; set; }
        [Column("MaPN")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaPN { get; set; } = null!;
        [Column("NgayNhap")] public DateTime NgayNhap { get; set; }
        [Column("NgayGiaoHang")] public DateTime? NgayGiaoHang { get; set; }
        [Column("TongTien")] public decimal? TongTien { get; set; }
        [Column("ThanhToan")] public decimal? ThanhToan { get; set; }
        [Column("TrangThai")] public string? TrangThai { get; set; }
        [Column("GhiChu")] public string? GhiChu { get; set; }
        [Column("MaNhaCungCap")] public int MaNhaCungCap { get; set; }
        [Column("MaNhanVien")] public int MaNhanVien { get; set; }
        [Column("NgayTao")] public DateTime NgayTao { get; set; }
        [Column("NgayCapNhat")] public DateTime NgayCapNhat { get; set; }

        [ForeignKey("MaNhaCungCap")] public virtual NhaCungCap NhaCungCap { get; set; } = null!;
        [ForeignKey("MaNhanVien")] public virtual NhanVien NhanVien { get; set; } = null!;
        public virtual ICollection<CTPN> CTPNs { get; set; } = new List<CTPN>();
        public virtual ICollection<CongNo> CongNos { get; set; } = new List<CongNo>();
    }
}
