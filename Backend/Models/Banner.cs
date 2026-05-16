using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("BANNER")]
    public class Banner
    {
        [Key]
        [Column("MaBanner")]
        public int MaBanner { get; set; }

        [Column("Title")]
        public string Title { get; set; } = "";

        [Column("Desc")]
        public string Desc { get; set; } = "";

        [Column("Src")]
        public string Src { get; set; } = "";

        [Column("Bg")]
        public string Bg { get; set; } = "";

        [Column("Panel")]
        public string Panel { get; set; } = "";

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("OrderIndex")]
        public int OrderIndex { get; set; } = 0;
    }
}
