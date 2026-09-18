using System.Net.Http.Json;
using System.Text.Json;
using ApiRest.Api.Models.Auth;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ApiRest.Api.Tests;

/// <summary>
/// Héberge l'API en mémoire (TestServer) pour les tests d'intégration.
/// Partagée entre toutes les classes de test via une collection xUnit
/// (voir ApiCollection) pour ne démarrer l'hôte qu'une seule fois.
///
/// Fournit aussi un helper pour obtenir un token admin, mis en cache : la route
/// de login est protégée par un rate limiter (5 req/min, voir Program.cs), donc
/// les tests ne doivent pas se reconnecter à chaque fois sous peine de 429.
/// </summary>
public class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    // L'API sérialise en camelCase (JsonOptions par défaut d'ASP.NET Core) ; le client
    // System.Text.Json est case-sensitive par défaut, d'où ce mapping explicite.
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly SemaphoreSlim _loginLock = new(1, 1);
    private string? _cachedAdminToken;

    public async Task<string> GetAdminTokenAsync()
    {
        if (_cachedAdminToken is not null)
        {
            return _cachedAdminToken;
        }

        await _loginLock.WaitAsync();
        try
        {
            if (_cachedAdminToken is not null)
            {
                return _cachedAdminToken;
            }

            using var client = CreateClient();
            var response = await client.PostAsJsonAsync("/api/auth/login", new { username = "admin", password = "Admin123!" });
            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadFromJsonAsync<LoginResponse>(JsonOptions);
            _cachedAdminToken = payload!.Token;
            return _cachedAdminToken;
        }
        finally
        {
            _loginLock.Release();
        }
    }
}

[CollectionDefinition("Api")]
public class ApiCollection : ICollectionFixture<ApiWebApplicationFactory>;
