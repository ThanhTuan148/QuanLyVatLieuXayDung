using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("CTPHIEUGIAOHANG")]
    public class CTPhieuGiaoHang
    {
        [Key]
        [Column("MaCTGH")]
        public int MaCTGH { get; set; }

        [Column("MaPhieuGH")]
        public int MaPhieuGH { get; set; }

        [Column("MaSanPham")]
        public int MaSanPham { get; set; }

        [Column("MaCTHD")]
        public int? MaCTHD { get; set; }

        [Column("SoLuongGiao")]
        public int SoLuongGiao { get; set; }

        [Column("GhiChu")]
        public string? GhiChu { get; set; }

        [Column("TrangThai")]
        public string? TrangThai { get; set; }

        [Column("NgayTao")]
        public DateTime NgayTao { get; set; }

        [ForeignKey("MaPhieuGH")]
        public virtual PhieuGiaoHang PhieuGiaoHang { get; set; } = null!;

        [ForeignKey("MaSanPham")]
        public virtual SanPham SanPham { get; set; } = null!;
    }
}
