using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace HiIntelligence.Api.Models
{
    public enum StoreHealthStatus
    {
        Excellent,
        Good,
        Attention,
        Critical
    }

    public class Store
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Region { get; set; } = string.Empty;

        [Required]
        public decimal TargetRevenue { get; set; }

        public int HealthScore { get; set; } = 100;

        public StoreHealthStatus Status { get; set; } = StoreHealthStatus.Excellent;

        [MaxLength(100)]
        public string ManagerName { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Address { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        [JsonIgnore]
        public ICollection<FinancialRecord> FinancialRecords { get; set; } = new List<FinancialRecord>();
    }
}
