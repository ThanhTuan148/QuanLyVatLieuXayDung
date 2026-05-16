using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingMaterialAPI.Models
{
    [Table("ChatMessages")]
    public class ChatMessage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string CustomerId { get; set; } = ""; // MaKhachHang or GuestId

        [Required]
        [MaxLength(50)]
        public string SenderRole { get; set; } = "Customer"; // "Customer" or "Staff"

        public int? StaffId { get; set; } // MaNhanVien (if Staff sent it)

        [Required]
        public string Message { get; set; } = "";

        public DateTime Timestamp { get; set; } = DateTime.Now;

        public bool IsRead { get; set; } = false;
    }
}
