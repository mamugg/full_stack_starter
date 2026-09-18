using ApiRest.Api.Models.External;

namespace ApiRest.Api.Services.External;

public interface IJsonPlaceholderClient
{
    Task<IReadOnlyList<ExternalPost>> GetPostsAsync(int? userId, CancellationToken cancellationToken);

    Task<ExternalPost?> GetPostAsync(int id, CancellationToken cancellationToken);

    Task<IReadOnlyList<ExternalComment>> GetCommentsForPostAsync(int postId, CancellationToken cancellationToken);
}
