using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("NHACUNGCAP_SANPHAM")]
    public class NhaCungCapSanPham
    {
        [Key]
        [Column("MaNCCSP")]
        public int MaNCCSP { get; set; }

        [Column("MaNCC")]
        public int MaNCC { get; set; }

        [Column("MaSanPham")]
        public int MaSanPham { get; set; }

        [Column("GiaCungCap")]
        public decimal GiaCungCap { get; set; }

        [Column("NgayCapNhat")]
        public DateTime NgayCapNhat { get; set; } = DateTime.Now;

        [ForeignKey("MaNCC")]
        public virtual NhaCungCap NhaCungCap { get; set; }

        [ForeignKey("MaSanPham")]
        public virtual SanPham SanPham { get; set; }
    }
}
