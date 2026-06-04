using Microsoft.EntityFrameworkCore;
using HiIntelligence.Api.Models;

namespace HiIntelligence.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Store> Stores => Set<Store>();
        public DbSet<FinancialRecord> FinancialRecords => Set<FinancialRecord>();
        public DbSet<Alert> Alerts => Set<Alert>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<IntelligenceInsight> IntelligenceInsights => Set<IntelligenceInsight>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Indexes for query optimization
            modelBuilder.Entity<Store>()
                .HasIndex(s => s.Region);

            modelBuilder.Entity<FinancialRecord>()
                .HasIndex(fr => new { fr.StoreId, fr.Date });

            modelBuilder.Entity<Alert>()
                .HasIndex(a => a.IsAcknowledged);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.IsRead);

            // Precision for decimals
            modelBuilder.Entity<FinancialRecord>()
                .Property(f => f.Revenue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<FinancialRecord>()
                .Property(f => f.NetRevenue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<FinancialRecord>()
                .Property(f => f.GrossProfit)
                .HasPrecision(18, 2);

            modelBuilder.Entity<FinancialRecord>()
                .Property(f => f.NetProfit)
                .HasPrecision(18, 2);

            modelBuilder.Entity<FinancialRecord>()
                .Property(f => f.AverageTicket)
                .HasPrecision(18, 2);

            modelBuilder.Entity<FinancialRecord>()
                .Property(f => f.ConversionRate)
                .HasPrecision(5, 2);

            modelBuilder.Entity<Store>()
                .Property(s => s.TargetRevenue)
                .HasPrecision(18, 2);
        }
    }
}
