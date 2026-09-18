using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ApiRest.Api.Models;
using Xunit;

namespace ApiRest.Api.Tests;

[Collection("Api")]
public class TodoItemsEndpointsTests
{
    private readonly ApiWebApplicationFactory _factory;

    public TodoItemsEndpointsTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync()
    {
        var client = _factory.CreateClient();
        var token = await _factory.GetAdminTokenAsync();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    [Fact]
    public async Task GetAll_WithoutToken_ReturnsUnauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/todoitems");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithEmptyTitle_ReturnsBadRequest()
    {
        using var client = await CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/todoitems", new { title = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_ThenGetById_ReturnsTheCreatedItem()
    {
        using var client = await CreateAuthenticatedClientAsync();

        var createResponse = await client.PostAsJsonAsync("/api/todoitems", new { title = "Écrire des tests d'intégration" });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<TodoItem>(ApiWebApplicationFactory.JsonOptions);
        Assert.NotNull(created);
        Assert.True(created!.Id > 0);

        var getResponse = await client.GetAsync(createResponse.Headers.Location);
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        var fetched = await getResponse.Content.ReadFromJsonAsync<TodoItem>(ApiWebApplicationFactory.JsonOptions);
        Assert.Equal(created.Title, fetched!.Title);
    }

    [Fact]
    public async Task Update_ThenDelete_RoundTripsCorrectly()
    {
        using var client = await CreateAuthenticatedClientAsync();

        var createResponse = await client.PostAsJsonAsync("/api/todoitems", new { title = "Tâche à mettre à jour" });
        var created = await createResponse.Content.ReadFromJsonAsync<TodoItem>(ApiWebApplicationFactory.JsonOptions);

        var updateResponse = await client.PutAsJsonAsync($"/api/todoitems/{created!.Id}", new { title = "Tâche mise à jour", isDone = true });
        Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);

        var getResponse = await client.GetAsync($"/api/todoitems/{created.Id}");
        var updated = await getResponse.Content.ReadFromJsonAsync<TodoItem>(ApiWebApplicationFactory.JsonOptions);
        Assert.True(updated!.IsDone);
        Assert.Equal("Tâche mise à jour", updated.Title);

        var deleteResponse = await client.DeleteAsync($"/api/todoitems/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getAfterDelete = await client.GetAsync($"/api/todoitems/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getAfterDelete.StatusCode);
    }

    [Fact]
    public async Task GetById_WithUnknownId_ReturnsNotFound()
    {
        using var client = await CreateAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/todoitems/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
