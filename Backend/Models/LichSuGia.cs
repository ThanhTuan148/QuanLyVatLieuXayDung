using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("LICHSUGIA")]
    public class LichSuGia
    {
        [Key]
        [Column("MaLSG")]
        public int MaLSG { get; set; }

        [Column("MaSanPham")]
        public int MaSanPham { get; set; }

        [Column("GiaBanCu")]
        public decimal? GiaBanCu { get; set; }

        [Column("GiaBanMoi")]
        public decimal GiaBanMoi { get; set; }

        [Column("GiaNhapCu")]
        public decimal? GiaNhapCu { get; set; }

        [Column("GiaNhapMoi")]
        public decimal? GiaNhapMoi { get; set; }

        [Column("LyDo")]
        [StringLength(500)]
        public string? LyDo { get; set; }

        [Column("NguonThayDoi")]
        [StringLength(100)]
        public string? NguonThayDoi { get; set; } // "Thủ công", "Nhập hàng", "Khuyến mãi"...

        [Column("NgayThayDoi")]
        public DateTime NgayThayDoi { get; set; } = DateTime.UtcNow;

        [Column("MaNhanVien")]
        public int? MaNhanVien { get; set; }

        // Navigation
        [ForeignKey("MaSanPham")]
        public virtual SanPham? SanPham { get; set; }

        [ForeignKey("MaNhanVien")]
        public virtual NhanVien? NhanVien { get; set; }
    }
}
