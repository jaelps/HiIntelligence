using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using HiIntelligence.Api.Data;
using HiIntelligence.Api.Hubs;
using HiIntelligence.Api.Models;

namespace HiIntelligence.Api.Services
{
    public class StoreDataGenerator : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHubContext<AnalyticsHub> _hubContext;
        private readonly ILogger<StoreDataGenerator> _logger;
        private readonly Random _random = new();

        private static readonly string[] Regions = { "North", "South", "East", "West", "Central" };
        private static readonly string[] ManagerNames = { "Alice Silva", "Bob Souza", "Carlos Lima", "Diana Costa", "Eduardo Santos", "Fernanda Oliveira", "Gabriel Rocha", "Helena Martins" };

        public StoreDataGenerator(
            IServiceScopeFactory scopeFactory,
            IHubContext<AnalyticsHub> hubContext,
            ILogger<StoreDataGenerator> logger)
        {
            _scopeFactory = scopeFactory;
            _hubContext = hubContext;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Store Data Generator starting...");

            // Step 1: Ensure DB is seeded
            await SeedInitialDataAsync();

            _logger.LogInformation("Store Data Generator seeding complete. Entering simulation loop.");

            // Step 2: Continuous real-time simulation
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(4000, stoppingToken);
                    await SimulateRealTimeSalesAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during real-time store simulation");
                }
            }
        }

        private async Task SeedInitialDataAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Ensure database is created
            await db.Database.EnsureCreatedAsync();

            // If we already have stores, skip seeding
            if (await db.Stores.AnyAsync())
            {
                _logger.LogInformation("Database already contains store data. Skipping seed.");
                return;
            }

            _logger.LogInformation("Database is empty. Seeding 500+ stores and historical records...");

            // 1. Seed Demo Users
            var users = new List<User>
            {
                new() { Username = "admin", PasswordHash = BCryptNetMock("admin123"), Role = UserRole.Administrator },
                new() { Username = "regional_east", PasswordHash = BCryptNetMock("east123"), Role = UserRole.RegionalManager, AssignedRegion = "East" },
                new() { Username = "regional_west", PasswordHash = BCryptNetMock("west123"), Role = UserRole.RegionalManager, AssignedRegion = "West" },
                new() { Username = "store_101", PasswordHash = BCryptNetMock("store123"), Role = UserRole.StoreManager, AssignedStoreId = 101 }
            };
            db.Users.AddRange(users);
            await db.SaveChangesAsync();

            // 2. Generate 520 Stores
            var stores = new List<Store>();
            int storeIdCounter = 100;
            
            for (int i = 0; i < 520; i++)
            {
                storeIdCounter++;
                string region = Regions[i % Regions.Length];
                decimal target = _random.Next(15000, 45000);

                var store = new Store
                {
                    Id = storeIdCounter,
                    Name = $"Store #{storeIdCounter} - {region}",
                    Region = region,
                    TargetRevenue = target,
                    ManagerName = ManagerNames[_random.Next(ManagerNames.Length)],
                    Address = $"Avenida Paulista, {100 + i * 5}, São Paulo - SP",
                    HealthScore = _random.Next(70, 100)
                };
                
                // Set status based on HealthScore
                store.Status = CalculateHealthStatus(store.HealthScore);
                stores.Add(store);
            }

            db.Stores.AddRange(stores);
            await db.SaveChangesAsync();

            // 3. Generate Historical Data for past 30 days
            _logger.LogInformation("Generating 30 days of historical records for 520 stores (15,600 records)...");
            var historicalRecords = new List<FinancialRecord>();
            DateTime startDate = DateTime.UtcNow.Date.AddDays(-30);

            // Set up batching to avoid running out of memory
            int batchSize = 1000;

            for (int day = 0; day <= 30; day++)
            {
                DateTime currentDate = startDate.AddDays(day);

                foreach (var store in stores)
                {
                    var record = GenerateHistoricalRecord(store, currentDate);
                    historicalRecords.Add(record);

                    if (historicalRecords.Count >= batchSize)
                    {
                        db.FinancialRecords.AddRange(historicalRecords);
                        await db.SaveChangesAsync();
                        historicalRecords.Clear();
                    }
                }
            }

            if (historicalRecords.Count > 0)
            {
                db.FinancialRecords.AddRange(historicalRecords);
                await db.SaveChangesAsync();
            }

            _logger.LogInformation("Historical seeding finished successfully!");
        }

        private FinancialRecord GenerateHistoricalRecord(Store store, DateTime date)
        {
            // Seasonality factor based on day of week (weekends have higher sales)
            double dayOfWeekFactor = (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday) ? 1.4 : 0.95;
            
            // Random performance factor for this store
            double storeFactor = 0.7 + (_random.NextDouble() * 0.6); // 0.7 to 1.3
            
            decimal baseRevenue = store.TargetRevenue * (decimal)(dayOfWeekFactor * storeFactor);
            decimal revenue = Math.Round(baseRevenue * (decimal)(0.9 + _random.NextDouble() * 0.2), 2); // +/- 10%
            
            // Add a small general downward trend for Store 154 to match the prompt example!
            if (store.Id == 154 && date > DateTime.UtcNow.Date.AddDays(-15))
            {
                revenue *= 0.77m; // 23% drop
            }

            decimal netRevenue = Math.Round(revenue * 0.82m, 2); // 18% taxes/returns
            decimal grossProfit = Math.Round(netRevenue * 0.55m, 2); // 55% gross margin
            decimal netProfit = Math.Round(grossProfit * 0.28m, 2); // 28% net margin of gross profit
            
            int salesVolume = _random.Next(250, 750);
            if (store.Id == 154 && date > DateTime.UtcNow.Date.AddDays(-15))
            {
                salesVolume = (int)(salesVolume * 0.9); // conversion stable, ticket down
            }

            decimal averageTicket = salesVolume > 0 ? Math.Round(revenue / salesVolume, 2) : 0;
            decimal conversionRate = Math.Round(2.5m + (decimal)(_random.NextDouble() * 3.5), 2); // 2.5% to 6%

            return new FinancialRecord
            {
                StoreId = store.Id,
                Date = date,
                Revenue = revenue,
                NetRevenue = netRevenue,
                GrossProfit = grossProfit,
                NetProfit = netProfit,
                SalesVolume = salesVolume,
                AverageTicket = averageTicket,
                ConversionRate = conversionRate
            };
        }

        private async Task SimulateRealTimeSalesAsync(CancellationToken stoppingToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            DateTime today = DateTime.UtcNow.Date;
            var stores = await db.Stores.ToListAsync(stoppingToken);

            var liveUpdates = new List<object>();

            // Get or create today's financial records
            var todayRecords = await db.FinancialRecords
                .Where(fr => fr.Date == today)
                .ToDictionaryAsync(fr => fr.StoreId, stoppingToken);

            int updatesCount = 0;
            
            foreach (var store in stores)
            {
                // We update all stores slightly, but we broadcast in bulk or select 10 stores to broadcast individual ticks to avoid over-flooding
                todayRecords.TryGetValue(store.Id, out var record);

                bool isNew = false;
                if (record == null)
                {
                    isNew = true;
                    record = new FinancialRecord
                    {
                        StoreId = store.Id,
                        Date = today,
                        Revenue = 0,
                        NetRevenue = 0,
                        GrossProfit = 0,
                        NetProfit = 0,
                        SalesVolume = 0,
                        AverageTicket = 0,
                        ConversionRate = Math.Round(2.5m + (decimal)(_random.NextDouble() * 3.5), 2)
                    };
                }

                // Simulate new transaction
                int newSales = _random.Next(0, 3); // 0, 1 or 2 new sales
                if (newSales > 0)
                {
                    decimal newRev = Math.Round((decimal)(15 + _random.NextDouble() * 120) * newSales, 2);
                    record.Revenue += newRev;
                    record.NetRevenue += Math.Round(newRev * 0.82m, 2);
                    record.GrossProfit += Math.Round(newRev * 0.45m, 2);
                    record.NetProfit += Math.Round(newRev * 0.15m, 2);
                    record.SalesVolume += newSales;
                    record.AverageTicket = record.SalesVolume > 0 ? Math.Round(record.Revenue / record.SalesVolume, 2) : 0;
                    
                    updatesCount++;

                    if (isNew)
                    {
                        db.FinancialRecords.Add(record);
                        todayRecords[store.Id] = record;
                    }
                    else
                    {
                        db.FinancialRecords.Update(record);
                    }

                    // Dynamically recalculate health score
                    decimal targetProgress = store.TargetRevenue > 0 ? (record.Revenue / store.TargetRevenue) * 100 : 0;
                    // Current progress should scale by time of day, but for simulation let's do a dynamic score:
                    int growthFactor = record.AverageTicket > 60 ? 15 : 0;
                    int revenueFactor = Math.Min(60, (int)targetProgress);
                    int volumeFactor = Math.Min(25, record.SalesVolume / 10);
                    
                    int health = 40 + revenueFactor + volumeFactor + growthFactor;
                    store.HealthScore = Math.Clamp(health, 0, 100);
                    store.Status = CalculateHealthStatus(store.HealthScore);
                    db.Stores.Update(store);

                    // 1% chance of triggering an Alert/Notification for a random store
                    if (_random.Next(0, 100) == 7 && record.Revenue > 1000)
                    {
                        await TriggerRandomAlertAsync(db, store, record, stoppingToken);
                    }

                    // Add to live updates payload (limit to first 15 for SignalR performance)
                    if (liveUpdates.Count < 15)
                    {
                        liveUpdates.Add(new
                        {
                            StoreId = store.Id,
                            StoreName = store.Name,
                            Region = store.Region,
                            Revenue = record.Revenue,
                            SalesVolume = record.SalesVolume,
                            AverageTicket = record.AverageTicket,
                            HealthScore = store.HealthScore,
                            Status = store.Status.ToString()
                        });
                    }
                }
            }

            if (updatesCount > 0)
            {
                await db.SaveChangesAsync(stoppingToken);

                // Aggregate and push stats via SignalR
                var totalRevenue = await db.FinancialRecords.Where(fr => fr.Date == today).SumAsync(fr => fr.Revenue, stoppingToken);
                var totalSales = await db.FinancialRecords.Where(fr => fr.Date == today).SumAsync(fr => fr.SalesVolume, stoppingToken);
                var activeAlertsCount = await db.Alerts.CountAsync(a => !a.IsAcknowledged, stoppingToken);

                await _hubContext.Clients.All.SendAsync("ReceiveLiveUpdates", new
                {
                    Timestamp = DateTime.UtcNow,
                    TotalRevenue = totalRevenue,
                    TotalSales = totalSales,
                    ActiveAlerts = activeAlertsCount,
                    StoreUpdates = liveUpdates
                }, stoppingToken);
            }
        }

        private async Task TriggerRandomAlertAsync(AppDbContext db, Store store, FinancialRecord record, CancellationToken stoppingToken)
        {
            // Alert type selection
            int alertTypeIdx = _random.Next(0, 3);
            AlertSeverity severity = alertTypeIdx == 0 ? AlertSeverity.Critical : AlertSeverity.Warning;
            string type = "";
            string message = "";
            string action = "";

            if (alertTypeIdx == 0)
            {
                type = "RevenueDrop";
                message = $"Store {store.Id} has experienced a sharp 25% revenue drop relative to today's project target trajectory.";
                action = "Verify staff attendance, local promotions, and check if checkout terminals are functional.";
            }
            else if (alertTypeIdx == 1)
            {
                type = "TicketDrop";
                message = $"Average ticket at Store {store.Id} decreased by 18% in the last 2 hours.";
                action = "Initiate upselling promotions at cashier terminals and verify inventory of high-value items.";
            }
            else
            {
                type = "UnusualSales";
                message = $"Unusual transaction density detected at Store {store.Id}. High sales count with extremely low conversion rate.";
                action = "Check for possible pricing errors in POS systems or abnormal sensor readings at store entrance.";
            }

            var alert = new Alert
            {
                StoreId = store.Id,
                StoreName = store.Name,
                Severity = severity,
                Type = type,
                Message = message,
                RecommendedAction = action,
                Timestamp = DateTime.UtcNow,
                IsAcknowledged = false
            };

            db.Alerts.Add(alert);

            var notification = new Notification
            {
                Title = $"Alert: {type} at {store.Name}",
                Message = message,
                Severity = severity,
                StoreId = store.Id,
                RecommendedAction = action,
                Timestamp = DateTime.UtcNow,
                IsRead = false
            };

            db.Notifications.Add(notification);
            await db.SaveChangesAsync(stoppingToken);

            // Broadcast alert real-time
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
            {
                Id = notification.Id,
                Title = notification.Title,
                Message = notification.Message,
                Severity = notification.Severity.ToString(),
                StoreId = notification.StoreId,
                RecommendedAction = notification.RecommendedAction,
                Timestamp = notification.Timestamp
            }, stoppingToken);
        }

        private StoreHealthStatus CalculateHealthStatus(int score)
        {
            if (score >= 85) return StoreHealthStatus.Excellent;
            if (score >= 70) return StoreHealthStatus.Good;
            if (score >= 50) return StoreHealthStatus.Attention;
            return StoreHealthStatus.Critical;
        }

        private string BCryptNetMock(string password)
        {
            // Simple mock hashing since we don't need real bcrypt verification if we mock it,
            // but we can just save it. For testing, we will do a simple string equality or hash representation.
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(password));
        }
    }
}
