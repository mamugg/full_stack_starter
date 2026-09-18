using System.ComponentModel.DataAnnotations;

namespace ApiRest.Api.Models.Auth;

public class LoginRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public record LoginResponse(
    string Token,
    DateTime ExpiresAtUtc,
    string Username,
    string Role);
