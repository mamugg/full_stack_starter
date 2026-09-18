using System.Net;
using System.Net.Http.Json;
using ApiRest.Api.Models.External;

namespace ApiRest.Api.Services.External;

/// <summary>
/// Client HTTP typé vers l'API publique gratuite https://jsonplaceholder.typicode.com
/// (aucune clé API requise). Enregistré via AddHttpClient dans Program.cs, ce qui gère
/// pour nous le cycle de vie du HttpClient (pool de connexions, DNS, etc.).
/// </summary>
public class JsonPlaceholderClient : IJsonPlaceholderClient
{
    private readonly HttpClient _httpClient;

    public JsonPlaceholderClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IReadOnlyList<ExternalPost>> GetPostsAsync(int? userId, CancellationToken cancellationToken)
    {
        var url = userId is null ? "posts" : $"posts?userId={userId}";
        var posts = await _httpClient.GetFromJsonAsync<List<ExternalPost>>(url, cancellationToken);
        return posts ?? [];
    }

    public async Task<ExternalPost?> GetPostAsync(int id, CancellationToken cancellationToken)
    {
        var response = await _httpClient.GetAsync($"posts/{id}", cancellationToken);
        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<ExternalPost>(cancellationToken);
    }

    public async Task<IReadOnlyList<ExternalComment>> GetCommentsForPostAsync(int postId, CancellationToken cancellationToken)
    {
        var comments = await _httpClient.GetFromJsonAsync<List<ExternalComment>>($"posts/{postId}/comments", cancellationToken);
        return comments ?? [];
    }
}
