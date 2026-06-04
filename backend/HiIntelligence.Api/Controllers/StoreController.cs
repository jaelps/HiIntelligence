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
    public class StoreController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StoreController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetStores(
            [FromQuery] string? search,
            [FromQuery] string? region,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var assignedRegion = User.FindFirst("AssignedRegion")?.Value;
            var assignedStoreId = User.FindFirst("AssignedStoreId")?.Value;

            var query = _context.Stores.AsQueryable();

            // 1. Role-based Security Filtering
            if (userRole == "StoreManager" && !string.IsNullOrEmpty(assignedStoreId))
            {
                int sId = int.Parse(assignedStoreId);
                query = query.Where(s => s.Id == sId);
            }
            else if (userRole == "RegionalManager" && !string.IsNullOrEmpty(assignedRegion))
            {
                query = query.Where(s => s.Region == assignedRegion);
            }

            // 2. Query Filters
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(s => s.Name.Contains(search) || s.Id.ToString() == search);
            }

            if (!string.IsNullOrEmpty(region) && (userRole != "RegionalManager" || region == assignedRegion))
            {
                query = query.Where(s => s.Region == region);
            }

            if (!string.IsNullOrEmpty(status))
            {
                if (Enum.TryParse<StoreHealthStatus>(status, true, out var healthStatus))
                {
                    query = query.Where(s => s.Status == healthStatus);
                }
            }

            // 3. Pagination
            int totalItems = await query.CountAsync();
            var stores = await query
                .OrderBy(s => s.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Fetch today's revenue for these stores to show live ticks
            DateTime today = DateTime.UtcNow.Date;
            var storeIds = stores.Select(s => s.Id).ToList();
            var todayRecords = await _context.FinancialRecords
                .Where(fr => storeIds.Contains(fr.StoreId) && fr.Date == today)
                .ToDictionaryAsync(fr => fr.StoreId);

            var storesWithRevenue = stores.Select(s => new
            {
                s.Id,
                s.Name,
                s.Region,
                s.TargetRevenue,
                s.HealthScore,
                Status = s.Status.ToString(),
                s.ManagerName,
                s.Address,
                TodayRevenue = todayRecords.TryGetValue(s.Id, out var fr) ? fr.Revenue : 0,
                TodaySales = todayRecords.TryGetValue(s.Id, out var fr2) ? fr2.SalesVolume : 0
            });

            return Ok(new
            {
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize,
                Stores = storesWithRevenue
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetStoreById(int id)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var assignedRegion = User.FindFirst("AssignedRegion")?.Value;
            var assignedStoreId = User.FindFirst("AssignedStoreId")?.Value;

            // Security check
            if (userRole == "StoreManager" && assignedStoreId != id.ToString())
            {
                return Forbid();
            }

            var store = await _context.Stores.FirstOrDefaultAsync(s => s.Id == id);
            if (store == null)
            {
                return NotFound(new { Message = $"Store with ID {id} not found." });
            }

            if (userRole == "RegionalManager" && store.Region != assignedRegion)
            {
                return Forbid();
            }

            // Get today's analytics
            DateTime today = DateTime.UtcNow.Date;
            var todayRecord = await _context.FinancialRecords
                .FirstOrDefaultAsync(fr => fr.StoreId == id && fr.Date == today);

            // Fetch past 7 days records for short-term KPIs averages
            DateTime sevenDaysAgo = today.AddDays(-7);
            var recentRecords = await _context.FinancialRecords
                .Where(fr => fr.StoreId == id && fr.Date >= sevenDaysAgo && fr.Date < today)
                .ToListAsync();

            decimal avgRevenue = recentRecords.Any() ? recentRecords.Average(r => r.Revenue) : 0;
            decimal avgTicket = recentRecords.Any() ? recentRecords.Average(r => r.AverageTicket) : 0;
            decimal avgConversion = recentRecords.Any() ? recentRecords.Average(r => r.ConversionRate) : 0;

            return Ok(new
            {
                Store = new
                {
                    store.Id,
                    store.Name,
                    store.Region,
                    store.TargetRevenue,
                    store.HealthScore,
                    Status = store.Status.ToString(),
                    store.ManagerName,
                    store.Address
                },
                TodayKpis = new
                {
                    Revenue = todayRecord?.Revenue ?? 0,
                    NetRevenue = todayRecord?.NetRevenue ?? 0,
                    NetProfit = todayRecord?.NetProfit ?? 0,
                    SalesVolume = todayRecord?.SalesVolume ?? 0,
                    AverageTicket = todayRecord?.AverageTicket ?? 0,
                    ConversionRate = todayRecord?.ConversionRate ?? 0
                },
                WeeklyAverages = new
                {
                    AverageDailyRevenue = Math.Round(avgRevenue, 2),
                    AverageTicket = Math.Round(avgTicket, 2),
                    ConversionRate = Math.Round(avgConversion, 2)
                }
            });
        }

        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetStoreHistory(int id, [FromQuery] int days = 30)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var assignedRegion = User.FindFirst("AssignedRegion")?.Value;
            var assignedStoreId = User.FindFirst("AssignedStoreId")?.Value;

            if (userRole == "StoreManager" && assignedStoreId != id.ToString())
            {
                return Forbid();
            }

            var store = await _context.Stores.FirstOrDefaultAsync(s => s.Id == id);
            if (store == null)
            {
                return NotFound();
            }

            if (userRole == "RegionalManager" && store.Region != assignedRegion)
            {
                return Forbid();
            }

            DateTime startDate = DateTime.UtcNow.Date.AddDays(-days);

            var history = await _context.FinancialRecords
                .Where(fr => fr.StoreId == id && fr.Date >= startDate)
                .OrderBy(fr => fr.Date)
                .Select(fr => new
                {
                    Date = fr.Date.ToString("yyyy-MM-dd"),
                    fr.Revenue,
                    fr.NetRevenue,
                    fr.GrossProfit,
                    fr.NetProfit,
                    fr.SalesVolume,
                    fr.AverageTicket,
                    fr.ConversionRate
                })
                .ToListAsync();

            return Ok(history);
        }
    }
}
