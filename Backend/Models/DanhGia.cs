using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("DANHGIA")]
    public class DanhGia
    {
        [Key]
        [Column("MaDanhGia")]
        public int MaDanhGia { get; set; }

        [Column("MaSanPham")]
        public int MaSanPham { get; set; }

        [Column("MaKhachHang")]
        public int MaKhachHang { get; set; }

        [Column("MaHoaDon")]
        public int? MaHoaDon { get; set; }

        [Column("SoSao")]
        [Range(1, 5)]
        public int SoSao { get; set; }

        [Column("NoiDung")]
        [StringLength(1000)]
        public string? NoiDung { get; set; }

        [Column("HinhAnh")]
        public string? HinhAnh { get; set; } // JSON string array

        [Column("Video")]
        public string? Video { get; set; }

        [Column("TrangThai")]
        public bool TrangThai { get; set; } = true;

        [Column("NgayTao")]
        public DateTime NgayTao { get; set; } = DateTime.UtcNow;

        [ForeignKey("MaSanPham")]
        public virtual SanPham SanPham { get; set; } = null!;

        [ForeignKey("MaKhachHang")]
        public virtual KhachHang KhachHang { get; set; } = null!;

        [ForeignKey("MaHoaDon")]
        public virtual HoaDon HoaDon { get; set; } = null!;
    }
}
