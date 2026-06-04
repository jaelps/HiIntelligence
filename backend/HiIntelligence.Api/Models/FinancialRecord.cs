using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HiIntelligence.Api.Models
{
    public class FinancialRecord
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int StoreId { get; set; }

        [ForeignKey("StoreId")]
        public Store? Store { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Revenue { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal NetRevenue { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal GrossProfit { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal NetProfit { get; set; }

        [Required]
        public int SalesVolume { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal AverageTicket { get; set; }

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal ConversionRate { get; set; } // e.g. 3.25%
    }
}
