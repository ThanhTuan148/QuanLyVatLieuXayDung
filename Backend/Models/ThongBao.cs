using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("THONGBAO")]
    public class ThongBao
    {
        [Key]
        public int MaThongBao { get; set; }
        
        [Required]
        public string TieuDe { get; set; } = string.Empty;
        
        [Required]
        public string NoiDung { get; set; } = string.Empty;
        
        public DateTime NgayTao { get; set; } = DateTime.Now;
        
        public string? LoaiThongBao { get; set; } // HeThong, DonHang, KhuyenMai
        
        public string? MaNguoiNhan { get; set; } // Username or UserID
        
        public bool DaDoc { get; set; }
        
        public string? LienKet { get; set; }
    }
}
