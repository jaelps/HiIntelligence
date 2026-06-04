using System;
using System.Collections.Generic;
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
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("executive")]
        public async Task<IActionResult> GetExecutiveData()
        {
            // Apply regional manager security filter if applicable
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var assignedRegion = User.FindFirst("AssignedRegion")?.Value;

            DateTime today = DateTime.UtcNow.Date;
            DateTime yesterday = today.AddDays(-1);
            DateTime startOfCurrentWeek = today.AddDays(-7);
            DateTime startOfPrevWeek = today.AddDays(-14);

            // Fetch stores (filtered by region if regional manager)
            var storesQuery = _context.Stores.AsQueryable();
            if (userRole == "RegionalManager" && !string.IsNullOrEmpty(assignedRegion))
            {
                storesQuery = storesQuery.Where(s => s.Region == assignedRegion);
            }
            var stores = await storesQuery.ToListAsync();
            var storeIds = stores.Select(s => s.Id).ToList();

            if (!storeIds.Any())
            {
                return Ok(new { Message = "No stores assigned." });
            }

            // Fetch today's financial records
            var todayRecords = await _context.FinancialRecords
                .Where(r => storeIds.Contains(r.StoreId) && r.Date == today)
                .ToListAsync();

            // Fetch past 7 days records
            var weekRecords = await _context.FinancialRecords
                .Where(r => storeIds.Contains(r.StoreId) && r.Date >= startOfCurrentWeek && r.Date < today)
                .ToListAsync();

            // Fetch previous week records
            var prevWeekRecords = await _context.FinancialRecords
                .Where(r => storeIds.Contains(r.StoreId) && r.Date >= startOfPrevWeek && r.Date < startOfCurrentWeek)
                .ToListAsync();

            // Computations
            decimal totalRevenue = todayRecords.Sum(r => r.Revenue);
            decimal totalNetRevenue = todayRecords.Sum(r => r.NetRevenue);
            decimal grossProfit = todayRecords.Sum(r => r.GrossProfit);
            decimal netProfit = todayRecords.Sum(r => r.NetProfit);
            
            int totalStores = stores.Count;
            int activeAlerts = await _context.Alerts.CountAsync(a => storeIds.Contains(a.StoreId) && !a.IsAcknowledged);

            double overallPerformanceScore = stores.Any() ? stores.Average(s => s.HealthScore) : 0;
            
            decimal targetRevenueSum = stores.Sum(s => s.TargetRevenue);
            decimal goalAchievementPercent = targetRevenueSum > 0 ? (totalRevenue / targetRevenueSum) * 100 : 0;

            // Monthly/Weekly trends
            var currentWeekTrend = weekRecords
                .GroupBy(r => r.Date)
                .Select(g => new { Date = g.Key.ToString("yyyy-MM-dd"), Revenue = g.Sum(r => r.Revenue), Profit = g.Sum(r => r.NetProfit) })
                .OrderBy(x => x.Date)
                .ToList();

            var prevWeekTrend = prevWeekRecords
                .GroupBy(r => r.Date)
                .Select(g => new { Date = g.Key.AddDays(7).ToString("yyyy-MM-dd"), Revenue = g.Sum(r => r.Revenue) }) // offset to overlap charts
                .OrderBy(x => x.Date)
                .ToList();

            // Regional breakdowns (always useful)
            var regionalPerformance = weekRecords
                .Join(stores, r => r.StoreId, s => s.Id, (r, s) => new { s.Region, r.Revenue, r.NetProfit, s.TargetRevenue })
                .GroupBy(x => x.Region)
                .Select(g => new
                {
                    Region = g.Key,
                    Revenue = g.Sum(x => x.Revenue),
                    Profit = g.Sum(x => x.NetProfit),
                    Target = g.Average(x => x.TargetRevenue) * 7 // scaled target
                })
                .ToList();

            return Ok(new
            {
                Kpis = new
                {
                    TotalRevenue = totalRevenue,
                    NetRevenue = totalNetRevenue,
                    GrossProfit = grossProfit,
                    NetProfit = netProfit,
                    TotalStores = totalStores,
                    ActiveAlerts = activeAlerts,
                    PerformanceScore = Math.Round(overallPerformanceScore, 1),
                    GoalAchievement = Math.Round(goalAchievementPercent, 1)
                },
                Trends = new
                {
                    CurrentWeek = currentWeekTrend,
                    PreviousWeek = prevWeekTrend
                },
                Regions = regionalPerformance
            });
        }

        [HttpGet("regional")]
        public async Task<IActionResult> GetRegionalData([FromQuery] string? region)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var assignedRegion = User.FindFirst("AssignedRegion")?.Value;

            // Enforce security boundaries
            if (userRole == "RegionalManager" && !string.IsNullOrEmpty(assignedRegion))
            {
                region = assignedRegion;
            }

            if (string.IsNullOrEmpty(region))
            {
                region = "East"; // Default region for overview if none specified
            }

            DateTime today = DateTime.UtcNow.Date;
            DateTime startOfCurrentWeek = today.AddDays(-7);

            var stores = await _context.Stores
                .Where(s => s.Region == region)
                .ToListAsync();

            var storeIds = stores.Select(s => s.Id).ToList();

            if (!storeIds.Any())
            {
                return Ok(new { Region = region, Message = "No stores in this region." });
            }

            var weekRecords = await _context.FinancialRecords
                .Where(r => storeIds.Contains(r.StoreId) && r.Date >= startOfCurrentWeek)
                .ToListAsync();

            var todayRecords = await _context.FinancialRecords
                .Where(r => storeIds.Contains(r.StoreId) && r.Date == today)
                .ToListAsync();

            // Aggregates
            decimal regionalRevenue = todayRecords.Sum(r => r.Revenue);
            decimal targetRevenue = stores.Sum(s => s.TargetRevenue);
            int regionalAlerts = await _context.Alerts.CountAsync(a => storeIds.Contains(a.StoreId) && !a.IsAcknowledged);

            // Top and Bottom 5 store rankings by revenue (past week)
            var storeRankings = weekRecords
                .GroupBy(r => r.StoreId)
                .Select(g => new
                {
                    StoreId = g.Key,
                    StoreName = stores.First(s => s.Id == g.Key).Name,
                    TotalRevenue = g.Sum(r => r.Revenue),
                    AverageHealth = stores.First(s => s.Id == g.Key).HealthScore,
                    Status = stores.First(s => s.Id == g.Key).Status.ToString()
                })
                .OrderByDescending(x => x.TotalRevenue)
                .ToList();

            var topStores = storeRankings.Take(5).ToList();
            var bottomStores = storeRankings.OrderBy(x => x.TotalRevenue).Take(5).ToList();

            return Ok(new
            {
                Region = region,
                Kpis = new
                {
                    Revenue = regionalRevenue,
                    Target = targetRevenue,
                    GoalAchievement = targetRevenue > 0 ? Math.Round((regionalRevenue / targetRevenue) * 100, 1) : 0,
                    Alerts = regionalAlerts,
                    AverageHealth = stores.Any() ? Math.Round(stores.Average(s => s.HealthScore), 1) : 0
                },
                Rankings = new
                {
                    TopStores = topStores,
                    BottomStores = bottomStores
                }
            });
        }
    }
}
