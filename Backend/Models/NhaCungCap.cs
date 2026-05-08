using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("NHACUNGCAP")]
    public class NhaCungCap
    {
        [Key]
        [Column("MaNhaCungCap")]
        public int MaNhaCungCap { get; set; }
        [Column("MaNCC")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaNCC { get; set; }
        [Column("TenNCC")]
        public string TenNCC { get; set; }
        [Column("NguoiLienHe")]
        public string? NguoiLienHe { get; set; }
        [Column("Sdt")]
        public string? Sdt { get; set; }
        [Column("Email")]
        public string? Email { get; set; }
        [Column("DiaChi")]
        public string? DiaChi { get; set; }
        [Column("ThanhPho")]
        public string? ThanhPho { get; set; }
        [Column("MaSoThue")]
        public string? MaSoThue { get; set; }
        [Column("TrangThai")]
        public bool TrangThai { get; set; }
        [Column("NgayTao")]
        public DateTime NgayTao { get; set; }
        [Column("NgayCapNhat")]
        public DateTime NgayCapNhat { get; set; }

        public virtual ICollection<PhieuNhap> PhieuNhaps { get; set; }
        public virtual ICollection<CongNo> CongNos { get; set; }
    }
}
