using ApiRest.Api.Models.External;
using ApiRest.Api.Services.External;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiRest.Api.Controllers;

/// <summary>
/// Exemple de routes qui font appel à une API publique tierce (JSONPlaceholder,
/// https://jsonplaceholder.typicode.com) via un HttpClient typé (voir
/// Services/External/JsonPlaceholderClient.cs). Montre comment agréger/relayer des
/// données externes depuis notre propre API.
/// </summary>
[ApiController]
[Route("api/external")]
public class ExternalController : ControllerBase
{
    private readonly IJsonPlaceholderClient _client;

    public ExternalController(IJsonPlaceholderClient client)
    {
        _client = client;
    }

    /// <summary>Liste des posts de l'API publique, avec filtre optionnel par userId.</summary>
    [HttpGet("posts")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<ExternalPost>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ExternalPost>>> GetPosts(
        [FromQuery] int? userId, CancellationToken cancellationToken)
    {
        var posts = await _client.GetPostsAsync(userId, cancellationToken);
        return Ok(posts);
    }

    /// <summary>Détail d'un post de l'API publique.</summary>
    [HttpGet("posts/{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ExternalPost), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExternalPost>> GetPost(int id, CancellationToken cancellationToken)
    {
        var post = await _client.GetPostAsync(id, cancellationToken);
        return post is null ? NotFound() : Ok(post);
    }

    /// <summary>
    /// Route protégée qui combine deux appels externes (post + commentaires).
    /// Nécessite un token JWT : montre comment mixer authentification et appels sortants.
    /// </summary>
    [HttpGet("posts/{id:int}/with-comments")]
    [Authorize]
    [ProducesResponseType(typeof(PostWithComments), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PostWithComments>> GetPostWithComments(int id, CancellationToken cancellationToken)
    {
        var post = await _client.GetPostAsync(id, cancellationToken);
        if (post is null)
        {
            return NotFound();
        }

        var comments = await _client.GetCommentsForPostAsync(id, cancellationToken);
        return Ok(new PostWithComments(post, comments));
    }
}
