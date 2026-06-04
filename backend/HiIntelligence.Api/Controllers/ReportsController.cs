using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HiIntelligence.Api.Data;
using HiIntelligence.Api.Services;

namespace HiIntelligence.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportReport(
            [FromQuery] string reportType,
            [FromQuery] string format,
            [FromQuery] string? region = null,
            [FromQuery] int? storeId = null,
            [FromQuery] int days = 30)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var assignedRegion = User.FindFirst("AssignedRegion")?.Value;
            var assignedStoreId = User.FindFirst("AssignedStoreId")?.Value;

            // 1. Role-based overrides / Security filters
            if (userRole == "StoreManager" && !string.IsNullOrEmpty(assignedStoreId))
            {
                storeId = int.Parse(assignedStoreId);
                reportType = "store"; // Force store type
            }
            else if (userRole == "RegionalManager" && !string.IsNullOrEmpty(assignedRegion))
            {
                region = assignedRegion; // Force their region
                if (reportType == "executive")
                {
                    reportType = "regional"; // Force regional report
                }
            }

            DateTime startDate = DateTime.UtcNow.Date.AddDays(-days);
            byte[] fileBytes;
            string contentType;
            string fileName;

            if (reportType.ToLower() == "executive")
            {
                var query = _context.FinancialRecords
                    .Include(fr => fr.Store)
                    .Where(fr => fr.Date >= startDate);

                if (!string.IsNullOrEmpty(region))
                {
                    query = query.Where(fr => fr.Store!.Region == region);
                }

                var rawData = await query
                    .OrderByDescending(fr => fr.Date)
                    .Select(fr => new
                    {
                        fr.Date,
                        fr.StoreId,
                        StoreName = fr.Store!.Name,
                        fr.Store.Region,
                        fr.Revenue,
                        fr.NetRevenue,
                        fr.GrossProfit,
                        fr.NetProfit,
                        fr.SalesVolume,
                        fr.AverageTicket,
                        fr.ConversionRate
                    })
                    .ToListAsync();

                fileBytes = GenerateFormattedFile(rawData, "Executive", format, region ?? "All Regions");
            }
            else if (reportType.ToLower() == "regional")
            {
                var stores = _context.Stores.AsQueryable();
                if (!string.IsNullOrEmpty(region))
                {
                    stores = stores.Where(s => s.Region == region);
                }

                var storesList = await stores.ToListAsync();
                var sIds = storesList.Select(s => s.Id).ToList();

                var records = await _context.FinancialRecords
                    .Where(fr => sIds.Contains(fr.StoreId) && fr.Date >= startDate)
                    .ToListAsync();

                var rawData = records
                    .Join(storesList, fr => fr.StoreId, s => s.Id, (fr, s) => new { s.Region, fr.Revenue, fr.SalesVolume, s.HealthScore, s.TargetRevenue })
                    .GroupBy(x => x.Region)
                    .Select(g => new
                    {
                        Region = g.Key,
                        StoresCount = storesList.Count(s => s.Region == g.Key),
                        TotalRevenue = g.Sum(x => x.Revenue),
                        TargetRevenue = g.Sum(x => x.TargetRevenue) / 30, // daily target scaled
                        AverageHealthScore = g.Average(x => x.HealthScore),
                        TotalSalesVolume = g.Sum(x => x.SalesVolume)
                    })
                    .ToList<dynamic>();

                fileBytes = GenerateFormattedFile(rawData, "Regional", format, region ?? "All Regions");
            }
            else // Store report
            {
                if (storeId == null)
                {
                    // If no store specified, take the first store in the query/region
                    var firstStore = await _context.Stores
                        .Where(s => string.IsNullOrEmpty(region) || s.Region == region)
                        .FirstOrDefaultAsync();
                    
                    if (firstStore == null)
                    {
                        return BadRequest(new { Message = "No stores found to generate report." });
                    }
                    storeId = firstStore.Id;
                }

                var store = await _context.Stores.FindAsync(storeId);
                if (store == null || (userRole == "RegionalManager" && store.Region != assignedRegion))
                {
                    return Forbid();
                }

                var rawData = await _context.FinancialRecords
                    .Where(fr => fr.StoreId == storeId && fr.Date >= startDate)
                    .OrderByDescending(fr => fr.Date)
                    .Select(fr => new
                    {
                        fr.Date,
                        fr.Revenue,
                        fr.NetRevenue,
                        fr.GrossProfit,
                        fr.NetProfit,
                        fr.SalesVolume,
                        fr.AverageTicket,
                        fr.ConversionRate
                    })
                    .ToListAsync();

                fileBytes = GenerateFormattedFile(rawData, "Store", format, store.Name);
            }

            // Mappings for return format
            if (format.ToLower() == "csv")
            {
                contentType = "text/csv";
                fileName = $"HiIntelligence_{reportType}_report_{DateTime.Now:yyyyMMdd}.csv";
            }
            else if (format.ToLower() == "excel")
            {
                // We serve as TSV with .xls extension, Excel opens it perfectly
                contentType = "application/vnd.ms-excel";
                fileName = $"HiIntelligence_{reportType}_report_{DateTime.Now:yyyyMMdd}.xls";
            }
            else // PDF (Returned as HTML formatted print-ready file)
            {
                contentType = "text/html";
                fileName = $"HiIntelligence_{reportType}_report_{DateTime.Now:yyyyMMdd}.html";
            }

            return File(fileBytes, contentType, fileName);
        }

        private byte[] GenerateFormattedFile(IEnumerable<dynamic> data, string reportType, string format, string entityName)
        {
            if (format.ToLower() == "csv")
            {
                return ReportGenerator.GenerateCsv(reportType.ToLower(), data);
            }
            else if (format.ToLower() == "excel")
            {
                return ReportGenerator.GenerateExcel(reportType.ToLower(), data);
            }
            else // HTML representing PDF
            {
                return ReportGenerator.GenerateHtmlPdf(reportType, entityName, data);
            }
        }
    }
}
