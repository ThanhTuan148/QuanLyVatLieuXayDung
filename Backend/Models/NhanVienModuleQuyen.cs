using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("NHANVIEN_MODULE_QUYEN")]
    public class NhanVienModuleQuyen
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Column("MaNhanVien")]
        public int MaNhanVien { get; set; }

        [Column("Module")]
        public string Module { get; set; } = "";

        [Column("TenModule")]
        public string TenModule { get; set; } = "";

        [Column("CoTheXem")]
        public bool CoTheXem { get; set; }

        [Column("CoTheTao")]
        public bool CoTheTao { get; set; }

        [Column("CoTheSua")]
        public bool CoTheSua { get; set; }

        [Column("CoTheXoa")]
        public bool CoTheXoa { get; set; }

        [Column("NgayCapNhat")]
        public DateTime NgayCapNhat { get; set; }

        [ForeignKey("MaNhanVien")]
        public virtual NhanVien NhanVien { get; set; } = null!;
    }
}
