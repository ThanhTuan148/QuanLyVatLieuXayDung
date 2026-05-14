using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("KHOHANG")]
    public class KhoHang
    {
        [Key]
        [Column("MaKhoHang")]
        public int MaKhoHang { get; set; }
        [Column("MaKho")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string? MaKho { get; set; }
        [Column("TenKho")] public string? TenKho { get; set; }
        [Column("LoaiKho")] public string? LoaiKho { get; set; }
        [Column("DiaChi")]
        public string? DiaChi { get; set; }
        [Column("GhiChu")]
        public string? GhiChu { get; set; }
        [Column("TrangThai")]
        public bool TrangThai { get; set; }
        [Column("NgayTao")]
        public DateTime? NgayTao { get; set; }
        [Column("NgayCapNhat")]
        public DateTime? NgayCapNhat { get; set; }

        public virtual ICollection<CTKhoHang> CTKhoHangs { get; set; } = new List<CTKhoHang>();
    }
}
