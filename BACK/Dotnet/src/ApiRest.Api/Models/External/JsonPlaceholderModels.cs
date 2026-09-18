namespace ApiRest.Api.Models.External;

public record ExternalPost(int UserId, int Id, string Title, string Body);

public record ExternalComment(int PostId, int Id, string Name, string Email, string Body);

public record PostWithComments(ExternalPost Post, IReadOnlyList<ExternalComment> Comments);
