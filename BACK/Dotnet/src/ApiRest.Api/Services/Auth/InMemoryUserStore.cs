using ApiRest.Api.Models.Auth;
using Microsoft.AspNetCore.Identity;

namespace ApiRest.Api.Services.Auth;

/// <summary>
/// Deux utilisateurs de démo, en mémoire. Les mots de passe sont hashés avec
/// PasswordHasher&lt;T&gt; (le même algorithme que ASP.NET Core Identity) : jamais de mot
/// de passe en clair, même dans un starter.
/// Identifiants de test : admin / Admin123! et user / User123!
/// </summary>
public class InMemoryUserStore : IUserStore
{
    private readonly PasswordHasher<User> _hasher = new();
    private readonly List<User> _users;

    public InMemoryUserStore()
    {
        _users = new List<User>
        {
            new() { Id = 1, Username = "admin", Role = "Admin" },
            new() { Id = 2, Username = "user", Role = "User" },
        };

        _users[0].PasswordHash = _hasher.HashPassword(_users[0], "Admin123!");
        _users[1].PasswordHash = _hasher.HashPassword(_users[1], "User123!");
    }

    public User? FindByUsername(string username) =>
        _users.FirstOrDefault(u => string.Equals(u.Username, username, StringComparison.OrdinalIgnoreCase));

    public bool VerifyPassword(User user, string password) =>
        _hasher.VerifyHashedPassword(user, user.PasswordHash, password) != PasswordVerificationResult.Failed;
}
