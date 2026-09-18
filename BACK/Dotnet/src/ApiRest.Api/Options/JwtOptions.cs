using System.ComponentModel.DataAnnotations;

namespace ApiRest.Api.Options;

/// <summary>
/// Configuration JWT liée à la section "Jwt" d'appsettings. Validée au démarrage
/// (voir Program.cs : ValidateDataAnnotations + ValidateOnStart) pour échouer
/// immédiatement si la config est incomplète plutôt qu'à la première requête.
/// </summary>
public class JwtOptions
{
    public const string SectionName = "Jwt";

    /// <summary>
    /// Valeur fournie par défaut dans appsettings.json pour que le projet fonctionne
    /// immédiatement après un clone, en développement uniquement. Program.cs refuse de
    /// démarrer en environnement Production si cette valeur est encore utilisée.
    /// </summary>
    public const string DevPlaceholderKey = "Cle-Secrete-Dev-DotNet-Changez-Moi-En-Production-1234567890";

    [Required]
    public string Issuer { get; set; } = string.Empty;

    [Required]
    public string Audience { get; set; } = string.Empty;

    /// <summary>
    /// Clé de signature HMAC-SHA256 : doit faire au moins 32 caractères (256 bits).
    /// En production, ne JAMAIS la laisser en dur dans appsettings.json : passer par
    /// une variable d'environnement (Jwt__Key), dotnet user-secrets en local, ou un
    /// gestionnaire de secrets (Key Vault, etc.).
    /// </summary>
    [Required]
    [MinLength(32, ErrorMessage = "Jwt:Key doit contenir au moins 32 caractères (256 bits) pour HMAC-SHA256.")]
    public string Key { get; set; } = string.Empty;

    [Range(1, 1440)]
    public int ExpiresMinutes { get; set; } = 60;
}
