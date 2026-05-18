namespace BuildingMaterialAPI.DTOs
{
    public class OrderDto
    {
        public int MaHoaDon { get; set; }
        public required string MaHD { get; set; }
        public DateTime NgayLap { get; set; }
        public decimal? TongTien { get; set; }
        public decimal GiamGia { get; set; }
        public decimal? ThanhToan { get; set; }
        public string? TrangThai { get; set; }
        public string? PTTT { get; set; }
        public int MaNhanVien { get; set; }
        public int MaKhachHang { get; set; }
        public string? TenKhachHang { get; set; }
        public string? TenNhanVien { get; set; }
    }

    public class OrderCreateDto
    {
        public required string MaHD { get; set; }
        public int MaKhachHang { get; set; }
        public int MaNhanVien { get; set; }
        public string? PTTT { get; set; }
        public string? GhiChu { get; set; }
        public List<OrderDetailDto> ChiTiet { get; set; } = new List<OrderDetailDto>();
    }

    public class OrderDetailDto
    {
        public int MaSanPham { get; set; }
        public int SoLuong { get; set; }
        public decimal DonGia { get; set; }
        public decimal GiamGia { get; set; }
    }
}
