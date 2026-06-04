using System.ComponentModel.DataAnnotations;

namespace HiIntelligence.Api.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public AlertSeverity Severity { get; set; }

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public int? StoreId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Message { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string RecommendedAction { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;
    }
}
