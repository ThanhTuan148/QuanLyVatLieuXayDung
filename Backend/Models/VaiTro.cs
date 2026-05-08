using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("VAITRO")]
    public class VaiTro
    {
        [Key]
        [Column("MaVaiTro")]
        public int MaVaiTro { get; set; }

        [Column("MaVT")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaVT { get; set; }

        [Column("TenVT")]
        public string TenVT { get; set; }

        [Column("MoTa")]
        public string? MoTa { get; set; }

        [Column("NgayTao")]
        public DateTime NgayTao { get; set; }

        [Column("NgayCapNhat")]
        public DateTime NgayCapNhat { get; set; }

        public virtual ICollection<TaiKhoan> TaiKhoans { get; set; }
        public virtual ICollection<PhanQuyen> PhanQuyens { get; set; }
    }
}
