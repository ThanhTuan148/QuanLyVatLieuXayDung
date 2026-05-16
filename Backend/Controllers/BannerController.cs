using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/banner")]
    public class BannerController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public BannerController(ApplicationDbContext ctx) { _ctx = ctx; }

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _ctx.Banners.OrderBy(b => b.OrderIndex).ToListAsync());

        [HttpGet("active")]
        public async Task<IActionResult> GetActive() =>
            Ok(await _ctx.Banners.Where(b => b.IsActive).OrderBy(b => b.OrderIndex).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var banner = await _ctx.Banners.FindAsync(id);
            return banner == null ? NotFound() : Ok(banner);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Banner dto)
        {
            if (dto == null) return BadRequest();
            _ctx.Banners.Add(dto);
            await _ctx.SaveChangesAsync();
            return Ok(dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Banner dto)
        {
            var banner = await _ctx.Banners.FindAsync(id);
            if (banner == null) return NotFound();

            banner.Title = dto.Title ?? banner.Title;
            banner.Desc = dto.Desc ?? banner.Desc;
            banner.Src = dto.Src ?? banner.Src;
            banner.Bg = dto.Bg ?? banner.Bg;
            banner.Panel = dto.Panel ?? banner.Panel;
            banner.IsActive = dto.IsActive;
            banner.OrderIndex = dto.OrderIndex;

            await _ctx.SaveChangesAsync();
            return Ok(banner);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var banner = await _ctx.Banners.FindAsync(id);
            if (banner == null) return NotFound();

            _ctx.Banners.Remove(banner);
            await _ctx.SaveChangesAsync();
            return NoContent();
        }
    }
}
