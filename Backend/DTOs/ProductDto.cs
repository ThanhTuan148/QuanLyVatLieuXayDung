namespace BuildingMaterialAPI.DTOs
{
    public class ProductDto
    {
        public int MaSanPham { get; set; }
        public string MaSP { get; set; }
        public string TenSP { get; set; }
        public string? MoTa { get; set; }
        public string? HinhAnh { get; set; }
        public string? DonViTinh { get; set; }
        public decimal GiaBan { get; set; }
        public decimal? GiaNhap { get; set; }
        public int MucTonToiThieu { get; set; }
        public int MaLoaiSP { get; set; }
        public string? TenLoai { get; set; }
        public bool TrangThai { get; set; }
    }

    public class ProductCreateDto
    {
        public string MaSP { get; set; }
        public string TenSP { get; set; }
        public string? MoTa { get; set; }
        public string? HinhAnh { get; set; }
        public string? DonViTinh { get; set; }
        public decimal GiaBan { get; set; }
        public decimal? GiaNhap { get; set; }
        public int MucTonToiThieu { get; set; }
        public int MaLoaiSP { get; set; }
    }
}
