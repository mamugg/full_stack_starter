using ApiRest.Api.Models.Auth;

namespace ApiRest.Api.Services.Auth;

public interface IJwtTokenService
{
    (string Token, DateTime ExpiresAtUtc) CreateToken(User user);
}
