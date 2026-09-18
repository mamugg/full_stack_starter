using ApiRest.Api.Models.Auth;

namespace ApiRest.Api.Services.Auth;

public interface IUserStore
{
    User? FindByUsername(string username);
    bool VerifyPassword(User user, string password);
}
