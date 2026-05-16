using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("TEAM_MEMBER")]
    public class TeamMember
    {
        [Key]
        [Column("MaThanhVien")]
        public int MaThanhVien { get; set; }

        [Column("Name")]
        public string Name { get; set; } = "";

        [Column("StudentId")]
        public string StudentId { get; set; } = "";

        [Column("Role")]
        public string Role { get; set; } = "";

        [Column("Avatar")]
        public string Avatar { get; set; } = "";

        [Column("Bg")]
        public string Bg { get; set; } = "";

        [Column("OrderIndex")]
        public int OrderIndex { get; set; } = 0;
    }
}
