using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/vouchers")]
    public class VoucherUuDaiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VoucherUuDaiController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<VoucherUuDai>>> GetVouchers()
        {
            return await _context.VoucherUuDais.OrderByDescending(v => v.NgayTao).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<VoucherUuDai>> GetVoucher(int id)
        {
            var voucher = await _context.VoucherUuDais.FindAsync(id);
            if (voucher == null) return NotFound();
            return voucher;
        }

        [HttpPost]
        public async Task<ActionResult<VoucherUuDai>> PostVoucher(VoucherUuDai voucher)
        {
            voucher.NgayTao = DateTime.Now;
            voucher.NgayCapNhat = DateTime.Now;
            voucher.SoLuongDaDung = 0;
            _context.VoucherUuDais.Add(voucher);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetVoucher", new { id = voucher.MaUUDAI }, voucher);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutVoucher(int id, VoucherUuDai voucher)
        {
            if (id != voucher.MaUUDAI) return BadRequest();

            voucher.NgayCapNhat = DateTime.Now;
            _context.Entry(voucher).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!VoucherExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVoucher(int id)
        {
            var voucher = await _context.VoucherUuDais.FindAsync(id);
            if (voucher == null) return NotFound();

            _context.VoucherUuDais.Remove(voucher);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("verify/{code}")]
        public async Task<IActionResult> VerifyVoucher(string code)
        {
            var now = DateTime.Now;
            var voucher = await _context.VoucherUuDais
                .FirstOrDefaultAsync(v => v.Code.ToLower() == code.ToLower() && v.TrangThai);

            if (voucher == null)
                return BadRequest(new { message = "Ưu đãi không tồn tại hoặc đã bị vô hiệu hóa." });

            if (now < voucher.NgayBatDau)
                return BadRequest(new { message = "Ưu đãi này chưa đến thời điểm sử dụng." });

            if (now > voucher.NgayKetThuc)
                return BadRequest(new { message = "Ưu đãi này đã hết hạn." });

            if (voucher.SoLuongToiDa.HasValue && voucher.SoLuongDaDung >= voucher.SoLuongToiDa.Value)
                return BadRequest(new { message = "Ưu đãi này đã hết lượt sử dụng." });

            return Ok(voucher);
        }

        private bool VoucherExists(int id)
        {
            return _context.VoucherUuDais.Any(e => e.MaUUDAI == id);
        }
    }
}
