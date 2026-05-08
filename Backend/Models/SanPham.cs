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
        public string MaSP { get; set; }
        [Column("TenSP")]
        public string TenSP { get; set; }
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
        public virtual LoaiSanPham LoaiSanPham { get; set; }
        public virtual ICollection<CTKhoHang> CTKhoHangs { get; set; }
        public virtual ICollection<CTHD> CTHDs { get; set; }
        public virtual ICollection<CTPN> CTPNs { get; set; }
        public virtual ICollection<CTPhieuDoiTra> CTPhieuDoiTras { get; set; }
        public virtual ICollection<KhuyenMaiDoiTuong> KhuyenMaiDoiTuongs { get; set; }
        public virtual ICollection<NhaCungCapSanPham> NhaCungCapSanPhams { get; set; }
        public virtual ICollection<DanhGia> DanhGias { get; set; }

    }
}
