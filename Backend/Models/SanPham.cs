using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace BuildingMaterialAPI.Models
{
    [Table("SANPHAM")]
    public class SanPham
    {
        [Key]
        [Column("MaSanPham")]
        public int MaSanPham { get; set; }
        [Column("MaSP")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string MaSP { get; set; } = null!;
        [Column("TenSP")]
        public string TenSP { get; set; } = null!;
        [Column("MoTa")]
        public string? MoTa { get; set; }
        [Column("HinhAnh")]
        public string? HinhAnh { get; set; }
        [Column("AnhPhu")]
        public string? AnhPhu { get; set; }
        [Column("DonViTinh")]
        public string? DonViTinh { get; set; }
        [Column("GiaBan")]
        public decimal GiaBan { get; set; }
        [Column("GiaNhap")]
        public decimal? GiaNhap { get; set; }
        [Column("MucTonToiThieu")]
        public int MucTonToiThieu { get; set; }
        [Column("ThuongHieu")]
        public string? ThuongHieu { get; set; }
        [Column("XuatXu")]
        public string? XuatXu { get; set; }
        [Column("GhiChu")]
        public string? GhiChu { get; set; }
        [Column("MaLoaiSP")]
        public int MaLoaiSP { get; set; }
        [Column("TrangThai")]
        public bool TrangThai { get; set; }
        [Column("TrongLuong")]
        public decimal? TrongLuong { get; set; } // Weight per unit
        [Column("DonViTrongLuong")]
        public string? DonViTrongLuong { get; set; } = "kg"; // kg, ton, m3...
        [Column("KichThuoc")]
        public string? KichThuoc { get; set; } // Dimensions: Dài x Rộng x Cao
        [Column("IsGift")]
        public bool IsGift { get; set; }
        [Column("NgayTao")]
        public DateTime NgayTao { get; set; }
        [Column("NgayCapNhat")]
        public DateTime NgayCapNhat { get; set; }

        [ForeignKey("MaLoaiSP")]
        public virtual LoaiSanPham LoaiSanPham { get; set; } = null!;
        public virtual ICollection<CTKhoHang> CTKhoHangs { get; set; } = new List<CTKhoHang>();
        public virtual ICollection<CTHD> CTHDs { get; set; } = new List<CTHD>();
        public virtual ICollection<CTPN> CTPNs { get; set; } = new List<CTPN>();
        public virtual ICollection<CTPhieuDoiTra> CTPhieuDoiTras { get; set; } = new List<CTPhieuDoiTra>();
        public virtual ICollection<KhuyenMaiDoiTuong> KhuyenMaiDoiTuongs { get; set; } = new List<KhuyenMaiDoiTuong>();
        public virtual ICollection<NhaCungCapSanPham> NhaCungCapSanPhams { get; set; } = new List<NhaCungCapSanPham>();
        public virtual ICollection<DanhGia> DanhGias { get; set; } = new List<DanhGia>();

    }
}
