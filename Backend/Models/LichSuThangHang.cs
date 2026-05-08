using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("LICHSUTHANGHANG")]
    public class LichSuThangHang
    {
        [Key]
        [Column("MaLichSu")]
        public int MaLichSu { get; set; }

        [Column("MaKhachHang")]
        public int MaKhachHang { get; set; }

        [Column("HangCu")]
        public string? HangCu { get; set; }

        [Column("HangMoi")]
        public string? HangMoi { get; set; }

        [Column("TongChiTieuHienTai")]
        public decimal TongChiTieuHienTai { get; set; }

        [Column("LyDo")]
        public string? LyDo { get; set; }

        [Column("NgayThayDoi")]
        public DateTime NgayThayDoi { get; set; } = DateTime.UtcNow;

        [ForeignKey("MaKhachHang")]
        public virtual KhachHang? KhachHang { get; set; }
    }
}
