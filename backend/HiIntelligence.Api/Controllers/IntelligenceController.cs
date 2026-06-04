using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HiIntelligence.Api.Data;

namespace HiIntelligence.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class IntelligenceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IntelligenceController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetInsights()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var assignedRegion = User.FindFirst("AssignedRegion")?.Value;
            var assignedStoreId = User.FindFirst("AssignedStoreId")?.Value;

            var query = _context.IntelligenceInsights.AsQueryable();

            // Apply role-based visibility filter
            if (userRole == "StoreManager" && !string.IsNullOrEmpty(assignedStoreId))
            {
                int sId = int.Parse(assignedStoreId);
                // Store managers see Executive overview and their store's insights
                query = query.Where(i => i.Scope == "Executive" || (i.Scope == "Store" && i.TargetId == sId));
            }
            else if (userRole == "RegionalManager" && !string.IsNullOrEmpty(assignedRegion))
            {
                // Regional managers see Executive overview, their regional insights, and stores in their region
                query = query.Where(i => 
                    i.Scope == "Executive" || 
                    (i.Scope == "Regional" && i.TargetName == assignedRegion) ||
                    (i.Scope == "Store" && _context.Stores.Any(s => s.Id == i.TargetId && s.Region == assignedRegion))
                );
            }

            var insights = await query
                .OrderByDescending(i => i.ImpactScore)
                .ThenByDescending(i => i.Timestamp)
                .ToListAsync();

            return Ok(insights);
        }
    }
}
