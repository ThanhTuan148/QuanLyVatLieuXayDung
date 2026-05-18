using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("UUDAI")]
    public class VoucherUuDai
    {
        [Key]
        [Column("MaUUDAI")]
        public int MaUUDAI { get; set; }

        [Column("MaVCDD")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string? MaVCDD { get; set; }

        [Required]
        [Column("TenUuDai")]
        [StringLength(255)]
        public string TenUuDai { get; set; } = null!;

        [Required]
        [Column("Code")]
        [StringLength(50)]
        public string Code { get; set; } = null!;

        [Column("MoTa")]
        public string? MoTa { get; set; }

        [Required]
        [Column("LoaiUuDai")]
        [StringLength(20)]
        public string LoaiUuDai { get; set; } = null!; // 'PhanTram', 'SoTien', 'Freeship'

        [Column("GiaTriGiam")]
        public decimal GiaTriGiam { get; set; }

        [Column("DonHangToiThieu")]
        public decimal DonHangToiThieu { get; set; }

        [Column("GiamToiDa")]
        public decimal? GiamToiDa { get; set; }

        [Column("NgayBatDau")]
        public DateTime NgayBatDau { get; set; }

        [Column("NgayKetThuc")]
        public DateTime NgayKetThuc { get; set; }

        [Column("SoLuongToiDa")]
        public int? SoLuongToiDa { get; set; }

        [Column("SoLuongDaDung")]
        public int SoLuongDaDung { get; set; }

        [Column("TrangThai")]
        public bool TrangThai { get; set; } = true;

        [Column("HinhAnh")]
        [StringLength(500)]
        public string? HinhAnh { get; set; }

        [Column("NgayTao")]
        public DateTime NgayTao { get; set; } = DateTime.Now;

        [Column("NgayCapNhat")]
        public DateTime NgayCapNhat { get; set; } = DateTime.Now;
    }
}
