using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HiIntelligence.Api.Data;
using HiIntelligence.Api.Models;

namespace HiIntelligence.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AlertsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AlertsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAlerts(
            [FromQuery] bool? isAcknowledged,
            [FromQuery] string? severity,
            [FromQuery] int limit = 50)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var assignedRegion = User.FindFirst("AssignedRegion")?.Value;
            var assignedStoreId = User.FindFirst("AssignedStoreId")?.Value;

            var query = _context.Alerts.AsQueryable();

            // 1. Role-based filter
            if (userRole == "StoreManager" && !string.IsNullOrEmpty(assignedStoreId))
            {
                int sId = int.Parse(assignedStoreId);
                query = query.Where(a => a.StoreId == sId);
            }
            else if (userRole == "RegionalManager" && !string.IsNullOrEmpty(assignedRegion))
            {
                // Join stores to filter by region
                var regionalStoreIds = await _context.Stores
                    .Where(s => s.Region == assignedRegion)
                    .Select(s => s.Id)
                    .ToListAsync();
                
                query = query.Where(a => regionalStoreIds.Contains(a.StoreId));
            }

            // 2. Parameters
            if (isAcknowledged.HasValue)
            {
                query = query.Where(a => a.IsAcknowledged == isAcknowledged.Value);
            }

            if (!string.IsNullOrEmpty(severity))
            {
                if (Enum.TryParse<AlertSeverity>(severity, true, out var sev))
                {
                    query = query.Where(a => a.Severity == sev);
                }
            }

            var alerts = await query
                .OrderByDescending(a => a.Timestamp)
                .Take(limit)
                .Select(a => new
                {
                    a.Id,
                    a.StoreId,
                    a.StoreName,
                    a.Timestamp,
                    Severity = a.Severity.ToString(),
                    a.Type,
                    a.Message,
                    a.RecommendedAction,
                    a.IsAcknowledged
                })
                .ToListAsync();

            return Ok(alerts);
        }

        [HttpPost("{id}/acknowledge")]
        public async Task<IActionResult> AcknowledgeAlert(int id)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var assignedRegion = User.FindFirst("AssignedRegion")?.Value;
            var assignedStoreId = User.FindFirst("AssignedStoreId")?.Value;

            var alert = await _context.Alerts.FirstOrDefaultAsync(a => a.Id == id);
            if (alert == null)
            {
                return NotFound();
            }

            // Verify manager rights to acknowledge
            if (userRole == "StoreManager" && assignedStoreId != alert.StoreId.ToString())
            {
                return Forbid();
            }
            if (userRole == "RegionalManager")
            {
                var store = await _context.Stores.FirstOrDefaultAsync(s => s.Id == alert.StoreId);
                if (store == null || store.Region != assignedRegion)
                {
                    return Forbid();
                }
            }

            alert.IsAcknowledged = true;
            _context.Alerts.Update(alert);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Alert acknowledged successfully." });
        }
    }
}
