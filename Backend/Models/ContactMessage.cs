using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("ContactMessages")]
    public class ContactMessage
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        [Column("Name")]
        public string Name { get; set; } = "";

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        [Column("Email")]
        public string Email { get; set; } = "";

        [Required]
        [MaxLength(500)]
        [Column("Subject")]
        public string Subject { get; set; } = "";

        [Required]
        [Column("Message")]
        public string Message { get; set; } = "";

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Column("IsRead")]
        public bool IsRead { get; set; } = false;

        [Column("ReplyMessage")]
        public string? ReplyMessage { get; set; }

        [Column("RepliedAt")]
        public DateTime? RepliedAt { get; set; }
    }
}
