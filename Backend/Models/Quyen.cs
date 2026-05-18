using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("QUYEN")]
    public class Quyen
    {
        [Key]
        [Column("MaQuyen")]
        public int MaQuyen { get; set; }

        [Column("MaQ")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaQ { get; set; } = null!;

        [Column("TenQ")]
        public string TenQ { get; set; } = null!;

        [Column("MoTa")]
        public string? MoTa { get; set; }

        [Column("NgayTao")]
        public DateTime NgayTao { get; set; }

        public virtual ICollection<PhanQuyen> PhanQuyens { get; set; }
    }
}
