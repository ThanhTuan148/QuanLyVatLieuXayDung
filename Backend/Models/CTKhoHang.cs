using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("CTKHOHANG")]
    public class CTKhoHang
    {
        [Key]
        [Column("MaCTKho")]
        public int MaCTKho { get; set; }
        [Column("MaKhoHang")]
        public int MaKhoHang { get; set; }
        [Column("MaSanPham")]
        public int MaSanPham { get; set; }
        [Column("SoLuong")]
        public int SoLuong { get; set; }
        [Column("SoLuongNhap")]
        public int SoLuongNhap { get; set; }
        [Column("SoLuongTon")]
        public int SoLuongTon { get; set; }
        [Column("NgayNhapCuoi")]
        public DateTime? NgayNhapCuoi { get; set; }
        [Column("NgayCapNhat")]
        public DateTime NgayCapNhat { get; set; }

        [ForeignKey("MaKhoHang")]
        public virtual KhoHang KhoHang { get; set; }
        [ForeignKey("MaSanPham")]
        public virtual SanPham SanPham { get; set; }
    }
}
