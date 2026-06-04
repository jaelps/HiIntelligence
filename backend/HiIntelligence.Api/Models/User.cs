using System.ComponentModel.DataAnnotations;

namespace HiIntelligence.Api.Models
{
    public enum UserRole
    {
        Administrator,
        RegionalManager,
        StoreManager
    }

    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; }

        // If RegionalManager, filters by region name (e.g. "North", "South")
        public string? AssignedRegion { get; set; }

        // If StoreManager, filters by store ID
        public int? AssignedStoreId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
