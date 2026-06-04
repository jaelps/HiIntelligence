using System.ComponentModel.DataAnnotations;

namespace HiIntelligence.Api.Models
{
    public enum AlertSeverity
    {
        Critical,
        Warning,
        Informational
    }

    public class Alert
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int StoreId { get; set; }

        [Required]
        [MaxLength(100)]
        public string StoreName { get; set; } = string.Empty;

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [Required]
        public AlertSeverity Severity { get; set; }

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty; // e.g., "RevenueDrop"

        [Required]
        [MaxLength(500)]
        public string Message { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string RecommendedAction { get; set; } = string.Empty;

        public bool IsAcknowledged { get; set; } = false;
    }
}
