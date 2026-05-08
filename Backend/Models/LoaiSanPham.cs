using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("LOAISANPHAM")]
    public class LoaiSanPham
    {
        [Key]
        [Column("MaLoaiSP")]
        public int MaLoaiSP { get; set; }

        [Column("MaLoai")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaLoai { get; set; }

        [Column("TenLoai")]
        public string TenLoai { get; set; }

        [Column("MoTa")]
        public string? MoTa { get; set; }

        [Column("HinhAnh")]
        public string? HinhAnh { get; set; }

        [Column("NgayTao")]
        public DateTime NgayTao { get; set; }

        [Column("NgayCapNhat")]
        public DateTime NgayCapNhat { get; set; }

        public virtual ICollection<SanPham> SanPhams { get; set; }
        public virtual ICollection<KhuyenMaiDoiTuong> KhuyenMaiDoiTuongs { get; set; }

    }
}
