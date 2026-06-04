using System.ComponentModel.DataAnnotations;

namespace HiIntelligence.Api.Models
{
    public class IntelligenceInsight
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string Scope { get; set; } = "Executive"; // Executive, Regional, Store

        public int? TargetId { get; set; }

        [MaxLength(100)]
        public string TargetName { get; set; } = string.Empty;

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(1000)]
        public string Summary { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string RootCause { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string RecommendedActions { get; set; } = string.Empty;

        [MaxLength(20)]
        public string TrendDirection { get; set; } = "Stable"; // Up, Down, Stable

        public int ImpactScore { get; set; } // 0 - 100 indicator of how critical this action is
    }
}
