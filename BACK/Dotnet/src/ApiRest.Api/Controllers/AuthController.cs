using System.Security.Claims;
using ApiRest.Api.Models.Auth;
using ApiRest.Api.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ApiRest.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserStore _userStore;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IUserStore userStore, IJwtTokenService jwtTokenService, ILogger<AuthController> logger)
    {
        _userStore = userStore;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    /// <summary>
    /// Authentifie un utilisateur de démo et renvoie un token JWT.
    /// Comptes disponibles : admin / Admin123! (rôle Admin) et user / User123! (rôle User).
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<LoginResponse> Login(LoginRequest request)
    {
        var user = _userStore.FindByUsername(request.Username);
        if (user is null || !_userStore.VerifyPassword(user, request.Password))
        {
            // On ne journalise jamais le mot de passe, et on renvoie un message générique
            // (ne pas révéler si c'est le username ou le password qui est incorrect).
            _logger.LogWarning("Échec de connexion pour l'utilisateur {Username}", request.Username);
            return Unauthorized(new { message = "Identifiants invalides." });
        }

        _logger.LogInformation("Connexion réussie pour l'utilisateur {Username}", user.Username);
        var (token, expiresAtUtc) = _jwtTokenService.CreateToken(user);
        return Ok(new LoginResponse(token, expiresAtUtc, user.Username, user.Role));
    }

    /// <summary>
    /// Route protégée : nécessite un token JWT valide (header Authorization: Bearer &lt;token&gt;).
    /// Permet de vérifier que le token est bien reconnu et d'inspecter ses claims.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<object> Me()
    {
        return Ok(new
        {
            Username = User.Identity?.Name,
            Role = User.FindFirstValue(ClaimTypes.Role),
            Claims = User.Claims.Select(c => new { c.Type, c.Value }),
        });
    }
}
