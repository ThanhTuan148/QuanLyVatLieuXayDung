using BuildingMaterialAPI.Data;
using BuildingMaterialAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Controllers
{
    [ApiController]
    [Route("api/team")]
    public class TeamController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public TeamController(ApplicationDbContext ctx) { _ctx = ctx; }

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _ctx.TeamMembers.OrderBy(t => t.OrderIndex).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var member = await _ctx.TeamMembers.FindAsync(id);
            return member == null ? NotFound() : Ok(member);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TeamMember dto)
        {
            if (dto == null) return BadRequest();
            _ctx.TeamMembers.Add(dto);
            await _ctx.SaveChangesAsync();
            return Ok(dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TeamMember dto)
        {
            var member = await _ctx.TeamMembers.FindAsync(id);
            if (member == null) return NotFound();

            member.Name = dto.Name ?? member.Name;
            member.StudentId = dto.StudentId ?? member.StudentId;
            member.Role = dto.Role ?? member.Role;
            member.Avatar = dto.Avatar ?? member.Avatar;
            member.Bg = dto.Bg ?? member.Bg;
            member.OrderIndex = dto.OrderIndex;

            await _ctx.SaveChangesAsync();
            return Ok(member);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var member = await _ctx.TeamMembers.FindAsync(id);
            if (member == null) return NotFound();

            _ctx.TeamMembers.Remove(member);
            await _ctx.SaveChangesAsync();
            return NoContent();
        }
    }
}
