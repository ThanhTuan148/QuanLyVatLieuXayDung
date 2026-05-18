using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("CONGNO")]
    public class CongNo
    {
        [Key][Column("MaCongNo")] public int MaCongNo { get; set; }
        [Column("MaCN")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaCN { get; set; } = null!;
        [Column("SoTienNo")] public decimal SoTienNo { get; set; }
        [Column("SoTienDaTra")] public decimal SoTienDaTra { get; set; }
        [Column("SoTienConLai")] public decimal? SoTienConLai { get; set; }
        [Column("HanThanhToan")] public DateTime? HanThanhToan { get; set; }
        [Column("TrangThai")] public string? TrangThai { get; set; }
        [Column("LoaiCongNo")] public string? LoaiCongNo { get; set; }
        [Column("MaKhachHang")] public int? MaKhachHang { get; set; }

        [Column("MaHoaDon")] public int? MaHoaDon { get; set; }
        [Column("MaNhaCungCap")] public int? MaNhaCungCap { get; set; }
        [Column("MaPhieuNhap")] public int? MaPhieuNhap { get; set; }

        [Column("GhiChu")] public string? GhiChu { get; set; }
        [Column("NgayTao")] public DateTime NgayTao { get; set; }
        [Column("NgayCapNhat")] public DateTime NgayCapNhat { get; set; }
        [Column("NgayNhacNoEmail")] public DateTime? NgayNhacNoEmail { get; set; }
        [Column("LaiPhat")] public decimal LaiPhat { get; set; } = 0;

        [ForeignKey("MaKhachHang")] public virtual KhachHang? KhachHang { get; set; }

        [ForeignKey("MaHoaDon")] public virtual HoaDon? HoaDon { get; set; }
        [ForeignKey("MaNhaCungCap")] public virtual NhaCungCap? NhaCungCap { get; set; }
        [ForeignKey("MaPhieuNhap")] public virtual PhieuNhap? PhieuNhap { get; set; }

    }
}
