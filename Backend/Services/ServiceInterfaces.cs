using BuildingMaterialAPI.Models;

namespace BuildingMaterialAPI.Services
{
    public interface IProductService
    {
        Task<IEnumerable<SanPham>> GetAllAsync();
        Task<SanPham?> GetByIdAsync(int id);
        Task<SanPham> CreateAsync(SanPham sanPham);
        Task<SanPham> UpdateAsync(SanPham sanPham);
        Task<bool> DeleteAsync(int id);
    }

    public interface IOrderService
    {
        Task<IEnumerable<HoaDon>> GetAllAsync();
        Task<HoaDon?> GetByIdAsync(int id);
        Task<HoaDon> CreateAsync(HoaDon hoaDon);
        Task<HoaDon> UpdateAsync(HoaDon hoaDon);
        Task<bool> DeleteAsync(int id);
    }

    public interface IUserService
    {
        Task<IEnumerable<TaiKhoan>> GetAllAsync();
        Task<TaiKhoan?> GetByIdAsync(int id);
    }

    public interface IInventoryService
    {
        Task<IEnumerable<CTKhoHang>> GetAllAsync();
        Task<CTKhoHang?> GetByIdAsync(int id);
        Task<CTKhoHang> CreateAsync(CTKhoHang ct);
        Task<CTKhoHang> UpdateAsync(CTKhoHang ct);
    }

    public interface IDeliveryService
    {
        Task<IEnumerable<PhieuGiaoHang>> GetAllAsync();
        Task<PhieuGiaoHang?> GetByIdAsync(int id);
        Task<PhieuGiaoHang> CreateAsync(PhieuGiaoHang pgh);
        Task<PhieuGiaoHang> UpdateAsync(PhieuGiaoHang pgh);
    }
}
