using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("CHITIET_KHUYENMAI")]
    public class ChiTietKhuyenMai
    {
        [Key]
        [Column("MaCTKM")]
        public int MaCTKM { get; set; }

        [Column("MaHoaDon")]
        public int MaHoaDon { get; set; }

        [Column("MaKhuyenMai")]
        public int MaKhuyenMai { get; set; }

        [Column("SoTienGiam")]
        public decimal SoTienGiam { get; set; }

        [Column("NgayTao")]
        public DateTime NgayTao { get; set; } = DateTime.Now;

        [ForeignKey("MaHoaDon")]
        public virtual HoaDon HoaDon { get; set; } = null!;

        [ForeignKey("MaKhuyenMai")]
        public virtual KhuyenMai KhuyenMai { get; set; } = null!;
    }
}
