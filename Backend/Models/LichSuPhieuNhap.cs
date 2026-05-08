using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("LICHSUPHIEUNHAP")]
    public class LichSuPhieuNhap
    {
        [Key]
        public int MaLichSu { get; set; }
        
        public int MaPhieuNhap { get; set; }
        
        public string? TrangThaiCu { get; set; }
        
        public string? TrangThaiMoi { get; set; }
        
        public string? NoiDungThayDoi { get; set; }
        
        public DateTime NgayThayDoi { get; set; } = DateTime.Now;
        
        public int? MaNguoiThucHien { get; set; }

        [ForeignKey("MaNguoiThucHien")]
        public virtual NhanVien? NhanVienThucHien { get; set; }
        
        [ForeignKey("MaPhieuNhap")]
        public virtual PhieuNhap? PhieuNhap { get; set; }
    }
}
