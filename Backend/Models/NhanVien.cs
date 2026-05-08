using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("NHANVIEN")]
    public class NhanVien
    {
        [Key]
        [Column("MaNhanVien")]
        public int MaNhanVien { get; set; }

        [Column("MaNV")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaNV { get; set; }

        [Column("TenNV")]
        public string TenNV { get; set; }

        [Column("Sdt")]
        public string? Sdt { get; set; }

        [Column("Email")]
        public string? Email { get; set; }

        [Column("DiaChi")]
        public string? DiaChi { get; set; }

        [Column("MaTaiKhoan")]
        public int? MaTaiKhoan { get; set; }

        [Column("TrangThai")]
        public bool TrangThai { get; set; }

        [Column("NgayTao")]
        public DateTime NgayTao { get; set; }

        [Column("NgayCapNhat")]
        public DateTime NgayCapNhat { get; set; }

        [Column("SucChuaToiDa")]
        public string? SucChuaToiDa { get; set; }

        [ForeignKey("MaTaiKhoan")]
        public virtual TaiKhoan TaiKhoan { get; set; }

        public virtual ICollection<HoaDon> HoaDons { get; set; }
        public virtual ICollection<PhieuNhap> PhieuNhaps { get; set; }
        public virtual ICollection<PhieuDoiTra> PhieuDoiTras { get; set; }
        public virtual ICollection<PhieuGiaoHang> PhieuGiaoHangs { get; set; }
        public virtual ICollection<ChiTietTraNo> ChiTietTraNos { get; set; }

    }
}
