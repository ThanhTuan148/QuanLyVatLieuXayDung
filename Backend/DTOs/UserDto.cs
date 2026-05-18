namespace BuildingMaterialAPI.DTOs
{
    public class LoginDto
    {
        public required string Username { get; set; }
        public required string Password { get; set; }
    }

    public class LoginResponseDto
    {
        public int Id { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
        public required string FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public required string RoleName { get; set; }
        public bool IsActive { get; set; }
    }

    public class RegisterDto
    {
        public required string Username { get; set; }
        public required string Password { get; set; }
        public required string Email { get; set; }
        public required string FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public int RoleId { get; set; }
    }
}
