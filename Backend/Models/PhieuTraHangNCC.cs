using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("PHIEUTRAHANG_NCC")]
    public class PhieuTraHangNCC
    {
        [Key][Column("MaPhieuTra")] public int MaPhieuTra { get; set; }
        [Column("MaPT")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaPT { get; set; }
        [Column("MaPhieuNhap")] public int MaPhieuNhap { get; set; }
        [Column("MaNhanVien")] public int MaNhanVien { get; set; }
        [Column("NgayTra")] public DateTime NgayTra { get; set; }
        [Column("TongTienHoan")] public decimal? TongTienHoan { get; set; }
        [Column("LyDo")] public string? LyDo { get; set; }
        [Column("GhiChu")] public string? GhiChu { get; set; }
        [Column("TrangThai")] public string? TrangThai { get; set; }
        [Column("NgayTao")] public DateTime NgayTao { get; set; }
        [Column("NgayCapNhat")] public DateTime NgayCapNhat { get; set; }

        [ForeignKey("MaPhieuNhap")] public virtual PhieuNhap PhieuNhap { get; set; }
        [ForeignKey("MaNhanVien")] public virtual NhanVien NhanVien { get; set; }
        public virtual ICollection<CTPhieuTraHangNCC> ChiTiet { get; set; }
    }
}
