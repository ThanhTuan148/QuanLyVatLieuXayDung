using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("TAIKHOAN")]
    public class TaiKhoan
    {
        [Key]
        [Column("MaTaiKhoan")]
        public int MaTaiKhoan { get; set; }

        [Column("MaTK")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaTK { get; set; }

        [Column("TenTK")]
        public string TenTK { get; set; }

        [Column("MatKhau")]
        public string MatKhau { get; set; }

        [Column("Email")]
        public string Email { get; set; }

        [Column("MaVaiTro")]
        public int MaVaiTro { get; set; }

        [Column("TrangThai")]
        public bool TrangThai { get; set; }

        [Column("NgayTao")]
        public DateTime NgayTao { get; set; }

        [Column("NgayCapNhat")]
        public DateTime NgayCapNhat { get; set; }

        [Column("DangNhapCuoi")]
        public DateTime? DangNhapCuoi { get; set; }

        [Column("ResetOTP")]
        public string? ResetOTP { get; set; }

        [Column("OTPExpiry")]
        public DateTime? OTPExpiry { get; set; }

        [ForeignKey("MaVaiTro")]
        public virtual VaiTro VaiTro { get; set; }

        public virtual NhanVien NhanVien { get; set; }
        public virtual KhachHang KhachHang { get; set; }
        public virtual ICollection<NhatKy> NhatKys { get; set; }
    }
}
