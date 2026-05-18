using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("KHACHHANG")]
    public class KhachHang
    {
        [Key]
        [Column("MaKhachHang")]
        public int MaKhachHang { get; set; }

        [Column("MaKH")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaKH { get; set; } = null!;

        [Column("TenKH")]
        public string TenKH { get; set; } = null!;

        [Column("Sdt")]
        public string? Sdt { get; set; }

        [Column("Email")]
        public string? Email { get; set; }

        [Column("DiaChi")]
        public string? DiaChi { get; set; }

        [Column("LoaiKH")]
        public string? LoaiKH { get; set; }

        [Column("MaSoThue")]
        public string? MaSoThue { get; set; }

        [Column("NguoiLienHe")]
        public string? NguoiLienHe { get; set; }

        [Column("MaTaiKhoan")]
        public int? MaTaiKhoan { get; set; }

        [Column("TrangThai")]
        public bool TrangThai { get; set; }

        [Column("NgaySinh")]
        public DateTime? NgaySinh { get; set; }

        [Column("NgayTao")]
        public DateTime NgayTao { get; set; }

        [Column("NgayCapNhat")]
        public DateTime NgayCapNhat { get; set; }

        [Column("HangThanhVien")]
        public string HangThanhVien { get; set; } = "Đồng";

        [Column("AnhDaiDien")]
        public string? AnhDaiDien { get; set; }

        [Column("GioiTinh")]
        public string? GioiTinh { get; set; }

        [Column("CCCD")]
        public string? CCCD { get; set; }

        [Column("TongChiTieu")]
        public decimal TongChiTieu { get; set; } = 0;

        [ForeignKey("MaTaiKhoan")]
        public virtual TaiKhoan TaiKhoan { get; set; } = null!;

        public virtual ICollection<HoaDon> HoaDons { get; set; } = new List<HoaDon>();

        public virtual ICollection<CongNo> CongNos { get; set; } = new List<CongNo>();
        public virtual ICollection<DanhGia> DanhGias { get; set; } = new List<DanhGia>();
    }
}
