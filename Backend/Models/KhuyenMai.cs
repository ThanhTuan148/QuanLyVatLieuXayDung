using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("KHUYENMAI")]
    public class KhuyenMai
    {
        [Key][Column("MaKhuyenMai")] public int MaKhuyenMai { get; set; }
        
        [Column("MaKM")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string? MaKM { get; set; }

        [Column("LoaiKM")] public string LoaiKM { get; set; } = null!; // 'Voucher', 'SanPham', 'GiaSoc', 'ThanhVien'
        [Column("TenKM")] public string TenKM { get; set; } = null!;
        [Column("MoTa")] public string? MoTa { get; set; }
        [Column("MaApDung")] public string? MaApDung { get; set; }
        [Column("LoaiGiamGia")] public string LoaiGiamGia { get; set; } = null!; // 'PhanTram', 'SoTien', 'Freeship'
        [Column("GiaTriGiam")] public decimal GiaTriGiam { get; set; }
        [Column("GiamToiDa")] public decimal? GiamToiDa { get; set; }
        [Column("DonHangToiThieu")] public decimal DonHangToiThieu { get; set; }
        [Column("ThoiGianBatDau")] public DateTime ThoiGianBatDau { get; set; }
        [Column("ThoiGianKetThuc")] public DateTime ThoiGianKetThuc { get; set; }
        [Column("SoLuongToiDa")] public int? SoLuongToiDa { get; set; }
        [Column("SoLuongDaDung")] public int SoLuongDaDung { get; set; }
        [Column("HangThanhVien")] public string? HangThanhVien { get; set; }
        [Column("HinhAnh")] public string? HinhAnh { get; set; }
        [Column("TrangThai")] public bool TrangThai { get; set; } = true;
        [Column("NgayTao")] public DateTime NgayTao { get; set; } = DateTime.Now;
        [Column("NgayCapNhat")] public DateTime NgayCapNhat { get; set; } = DateTime.Now;

        public virtual ICollection<KhuyenMaiDoiTuong> KhuyenMaiDoiTuongs { get; set; } = new List<KhuyenMaiDoiTuong>();
    }

    [Table("KHUYENMAI_DOITUONG")]
    public class KhuyenMaiDoiTuong
    {
        [Key][Column("MaKMDT")] public int MaKMDT { get; set; }
        [Column("MaKhuyenMai")] public int MaKhuyenMai { get; set; }
        [Column("MaSanPham")] public int? MaSanPham { get; set; }
        [Column("MaLoaiSP")] public int? MaLoaiSP { get; set; }
        [Column("GiaKhuyenMai")] public decimal? GiaKhuyenMai { get; set; }
        [Column("SoLuongKhuyenMai")] public int? SoLuongKhuyenMai { get; set; }
        [Column("SoLuongDaBan")] public int SoLuongDaBan { get; set; }

        [ForeignKey("MaKhuyenMai")] public virtual KhuyenMai KhuyenMai { get; set; } = null!;
        [ForeignKey("MaSanPham")] public virtual SanPham? SanPham { get; set; }
        [ForeignKey("MaLoaiSP")] public virtual LoaiSanPham? LoaiSanPham { get; set; }
    }
}

