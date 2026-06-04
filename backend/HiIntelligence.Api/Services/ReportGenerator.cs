using System;
using System.Collections.Generic;
using System.Text;
using HiIntelligence.Api.Models;

namespace HiIntelligence.Api.Services
{
    public class ReportGenerator
    {
        public static byte[] GenerateCsv(string reportType, IEnumerable<dynamic> data)
        {
            var sb = new StringBuilder();

            if (reportType == "executive")
            {
                sb.AppendLine("Date,StoreId,StoreName,Region,Revenue,NetRevenue,GrossProfit,NetProfit,SalesVolume,AverageTicket,ConversionRate");
                foreach (var item in data)
                {
                    sb.AppendLine($"{item.Date:yyyy-MM-dd},{item.StoreId},{EscapeCsv(item.StoreName)},{EscapeCsv(item.Region)},{item.Revenue},{item.NetRevenue},{item.GrossProfit},{item.NetProfit},{item.SalesVolume},{item.AverageTicket},{item.ConversionRate}");
                }
            }
            else if (reportType == "regional")
            {
                sb.AppendLine("Region,StoresCount,TotalRevenue,TargetRevenue,AverageHealthScore,TotalSalesVolume");
                foreach (var item in data)
                {
                    sb.AppendLine($"{EscapeCsv(item.Region)},{item.StoresCount},{item.TotalRevenue},{item.TargetRevenue},{item.AverageHealthScore},{item.TotalSalesVolume}");
                }
            }
            else // store report
            {
                sb.AppendLine("Date,Revenue,NetRevenue,GrossProfit,NetProfit,SalesVolume,AverageTicket,ConversionRate");
                foreach (var item in data)
                {
                    sb.AppendLine($"{item.Date:yyyy-MM-dd},{item.Revenue},{item.NetRevenue},{item.GrossProfit},{item.NetProfit},{item.SalesVolume},{item.AverageTicket},{item.ConversionRate}");
                }
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        public static byte[] GenerateExcel(string reportType, IEnumerable<dynamic> data)
        {
            // We use Tab-Separated Values (TSV) with a UTF-8 BOM, which Excel opens perfectly.
            var sb = new StringBuilder();
            
            // Add UTF-8 BOM so Excel opens it with correct encoding
            sb.Append((char)0xFEFF);

            if (reportType == "executive")
            {
                sb.AppendLine("Date\tStore ID\tStore Name\tRegion\tRevenue\tNet Revenue\tGross Profit\tNet Profit\tSales Volume\tAverage Ticket\tConversion Rate");
                foreach (var item in data)
                {
                    sb.AppendLine($"{item.Date:yyyy-MM-dd}\t{item.StoreId}\t{item.StoreName}\t{item.Region}\t{item.Revenue}\t{item.NetRevenue}\t{item.GrossProfit}\t{item.NetProfit}\t{item.SalesVolume}\t{item.AverageTicket}\t{item.ConversionRate}");
                }
            }
            else if (reportType == "regional")
            {
                sb.AppendLine("Region\tStores Count\tTotal Revenue\tTarget Revenue\tAverage Health Score\tTotal Sales Volume");
                foreach (var item in data)
                {
                    sb.AppendLine($"{item.Region}\t{item.StoresCount}\t{item.TotalRevenue}\t{item.TargetRevenue}\t{item.AverageHealthScore}\t{item.TotalSalesVolume}");
                }
            }
            else // store report
            {
                sb.AppendLine("Date\tRevenue\tNet Revenue\tGross Profit\tNet Profit\tSales Volume\tAverage Ticket\tConversion Rate");
                foreach (var item in data)
                {
                    sb.AppendLine($"{item.Date:yyyy-MM-dd}\t{item.Revenue}\t{item.NetRevenue}\t{item.GrossProfit}\t{item.NetProfit}\t{item.SalesVolume}\t{item.AverageTicket}\t{item.ConversionRate}");
                }
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        public static byte[] GenerateHtmlPdf(string reportType, string entityName, IEnumerable<dynamic> data)
        {
            var sb = new StringBuilder();
            sb.AppendLine("<!DOCTYPE html>");
            sb.AppendLine("<html>");
            sb.AppendLine("<head>");
            sb.AppendLine("<meta charset='utf-8' />");
            sb.AppendLine("<title>HiIntelligence Financial Report</title>");
            sb.AppendLine("<style>");
            sb.AppendLine("body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; margin: 30px; }");
            sb.AppendLine(".header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 30px; }");
            sb.AppendLine(".logo { font-size: 24px; font-weight: bold; color: #0f172a; }");
            sb.AppendLine(".logo span { color: #2563eb; }");
            sb.AppendLine(".title { font-size: 18px; text-transform: uppercase; color: #64748b; text-align: right; }");
            sb.AppendLine("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
            sb.AppendLine("th { background-color: #f1f5f9; color: #0f172a; font-weight: 600; text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e1; }");
            sb.AppendLine("td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }");
            sb.AppendLine("tr:nth-child(even) { background-color: #f8fafc; }");
            sb.AppendLine(".footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }");
            sb.AppendLine(".total-row { font-weight: bold; background-color: #e2e8f0 !important; }");
            sb.AppendLine("</style>");
            sb.AppendLine("</head>");
            sb.AppendLine("<body>");

            // Header
            sb.AppendLine("<div class='header'>");
            sb.AppendLine("  <div class='logo'>Hi<span>Intelligence</span></div>");
            sb.AppendLine($"  <div class='title'>{reportType} Financial Report<br/><span style='font-size: 12px; text-transform: none;'>Generated on: {DateTime.Now:yyyy-MM-dd HH:mm}</span></div>");
            sb.AppendLine("</div>");

            if (!string.IsNullOrEmpty(entityName))
            {
                sb.AppendLine($"<h3>Target: {entityName}</h3>");
            }

            // Table Content
            sb.AppendLine("<table>");

            if (reportType == "Executive")
            {
                sb.AppendLine("  <thead>");
                sb.AppendLine("    <tr>");
                sb.AppendLine("      <th>Date</th><th>Store ID</th><th>Store Name</th><th>Region</th><th>Revenue</th><th>Net Profit</th><th>Sales</th>");
                sb.AppendLine("    </tr>");
                sb.AppendLine("  </thead>");
                sb.AppendLine("  <tbody>");
                
                decimal totRev = 0, totProf = 0;
                int totSales = 0;
                
                foreach (var item in data)
                {
                    sb.AppendLine("    <tr>");
                    sb.AppendLine($"      <td>{item.Date:yyyy-MM-dd}</td><td>{item.StoreId}</td><td>{item.StoreName}</td><td>{item.Region}</td><td>{item.Revenue:C2}</td><td>{item.NetProfit:C2}</td><td>{item.SalesVolume}</td>");
                    sb.AppendLine("    </tr>");
                    totRev += item.Revenue;
                    totProf += item.NetProfit;
                    totSales += item.SalesVolume;
                }
                sb.AppendLine("    <tr class='total-row'>");
                sb.AppendLine($"      <td colspan='4'>TOTALS</td><td>{totRev:C2}</td><td>{totProf:C2}</td><td>{totSales}</td>");
                sb.AppendLine("    </tr>");
            }
            else if (reportType == "Regional")
            {
                sb.AppendLine("  <thead>");
                sb.AppendLine("    <tr>");
                sb.AppendLine("      <th>Region</th><th>Stores Count</th><th>Total Revenue</th><th>Target Revenue</th><th>Avg Health</th><th>Sales Volume</th>");
                sb.AppendLine("    </tr>");
                sb.AppendLine("  </thead>");
                sb.AppendLine("  <tbody>");
                
                decimal totRev = 0, totTarget = 0;
                int totSales = 0;
                
                foreach (var item in data)
                {
                    sb.AppendLine("    <tr>");
                    sb.AppendLine($"      <td>{item.Region}</td><td>{item.StoresCount}</td><td>{item.TotalRevenue:C2}</td><td>{item.TargetRevenue:C2}</td><td>{item.AverageHealthScore:F1}</td><td>{item.TotalSalesVolume}</td>");
                    sb.AppendLine("    </tr>");
                    totRev += item.TotalRevenue;
                    totTarget += item.TargetRevenue;
                    totSales += item.TotalSalesVolume;
                }
                sb.AppendLine("    <tr class='total-row'>");
                sb.AppendLine($"      <td>TOTALS</td><td>-</td><td>{totRev:C2}</td><td>{totTarget:C2}</td><td>-</td><td>{totSales}</td>");
                sb.AppendLine("    </tr>");
            }
            else // Store
            {
                sb.AppendLine("  <thead>");
                sb.AppendLine("    <tr>");
                sb.AppendLine("      <th>Date</th><th>Revenue</th><th>Net Revenue</th><th>Gross Profit</th><th>Net Profit</th><th>Sales</th><th>Avg Ticket</th><th>Conv. Rate</th>");
                sb.AppendLine("    </tr>");
                sb.AppendLine("  </thead>");
                sb.AppendLine("  <tbody>");
                
                decimal totRev = 0, totNet = 0, totGross = 0, totNetProf = 0;
                int totSales = 0;
                
                foreach (var item in data)
                {
                    sb.AppendLine("    <tr>");
                    sb.AppendLine($"      <td>{item.Date:yyyy-MM-dd}</td><td>{item.Revenue:C2}</td><td>{item.NetRevenue:C2}</td><td>{item.GrossProfit:C2}</td><td>{item.NetProfit:C2}</td><td>{item.SalesVolume}</td><td>{item.AverageTicket:C2}</td><td>{item.ConversionRate}%</td>");
                    sb.AppendLine("    </tr>");
                    totRev += item.Revenue;
                    totNet += item.NetRevenue;
                    totGross += item.GrossProfit;
                    totNetProf += item.NetProfit;
                    totSales += item.SalesVolume;
                }
                sb.AppendLine("    <tr class='total-row'>");
                sb.AppendLine($"      <td>TOTALS</td><td>{totRev:C2}</td><td>{totNet:C2}</td><td>{totGross:C2}</td><td>{totNetProf:C2}</td><td>{totSales}</td><td>-</td><td>-</td>");
                sb.AppendLine("    </tr>");
            }

            sb.AppendLine("  </tbody>");
            sb.AppendLine("</table>");

            // Footer
            sb.AppendLine("<div class='footer'>");
            sb.AppendLine("  <p>HiIntelligence platform - Enterprise-Grade Store Financial Analytics.</p>");
            sb.AppendLine("  <p>&copy; 2026 HiIntelligence Corp. Confidential document.</p>");
            sb.AppendLine("</div>");

            sb.AppendLine("</body>");
            sb.AppendLine("</html>");

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        private static string EscapeCsv(string str)
        {
            if (string.IsNullOrEmpty(str)) return "";
            if (str.Contains(",") || str.Contains("\"") || str.Contains("\n") || str.Contains("\r"))
            {
                return "\"" + str.Replace("\"", "\"\"") + "\"";
            }
            return str;
        }
    }
}
