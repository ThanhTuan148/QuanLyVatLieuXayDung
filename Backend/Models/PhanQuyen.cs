using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("PHANQUYEN")]
    public class PhanQuyen
    {
        [Key]
        [Column("MaPhanQuyen")]
        public int MaPhanQuyen { get; set; }

        [Column("MaVaiTro")]
        public int MaVaiTro { get; set; }

        [Column("MaQuyen")]
        public int MaQuyen { get; set; }

        [ForeignKey("MaVaiTro")]
        public virtual VaiTro VaiTro { get; set; }

        [ForeignKey("MaQuyen")]
        public virtual Quyen Quyen { get; set; }
    }
}
