using System.Text;
using System.Threading.RateLimiting;
using ApiRest.Api.Options;
using ApiRest.Api.Services.Auth;
using ApiRest.Api.Services.External;
using ApiRest.Api.Services.Todos;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// --- Services applicatifs (en mémoire) ---
builder.Services.AddSingleton<ITodoService, TodoService>();
builder.Services.AddSingleton<IUserStore, InMemoryUserStore>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

// --- Client HTTP typé vers l'API publique JSONPlaceholder, avec la résilience standard
// .NET (retries avec backoff, circuit breaker, timeout par tentative et global) pour
// encaisser les pannes transitoires d'un service tiers sans faire planter nos routes. ---
var externalApiBaseUrl = builder.Configuration["ExternalApis:JsonPlaceholder"]
    ?? "https://jsonplaceholder.typicode.com/";
builder.Services.AddHttpClient<IJsonPlaceholderClient, JsonPlaceholderClient>(client =>
{
    client.BaseAddress = new Uri(externalApiBaseUrl);
}).AddStandardResilienceHandler();

// --- Configuration JWT : liée + validée au démarrage (fail fast si incomplète/invalide) ---
builder.Services
    .AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException($"Section de configuration '{JwtOptions.SectionName}' manquante.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

builder.Services.AddAuthorization();

// --- CORS : aucune origine autorisée par défaut ; à renseigner via Cors:AllowedOrigins
// (ex. appsettings.Development.json) pour un frontend qui consommerait l'API depuis un navigateur. ---
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("Default", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
        }
    });
});

// --- Rate limiting : limite globale anti-abus + limite stricte sur le login anti brute-force ---
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));

    options.AddPolicy("login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));
});

builder.Services.AddControllers();

// --- Réponses d'erreur standardisées (application/problem+json) pour les exceptions
// non gérées et les erreurs de validation de modèle. ---
builder.Services.AddProblemDetails();

// --- Swagger / OpenAPI, avec support du bouton "Authorize" pour tester le JWT ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "API Rest .NET",
        Version = "v1",
        Description = "CRUD en mémoire, login JWT, appels vers une API publique.",
    });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Entrer le token JWT précédé de 'Bearer '. Exemple : Bearer eyJhbGciOi...",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" },
    };
    options.AddSecurityDefinition("Bearer", securityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() },
    });
});

var app = builder.Build();

// --- Filet de sécurité : refuse de démarrer en Production avec la clé JWT de
// développement fournie par défaut dans appsettings.json. ---
if (app.Environment.IsProduction() && jwtOptions.Key == JwtOptions.DevPlaceholderKey)
{
    throw new InvalidOperationException(
        "Jwt:Key utilise encore la valeur de développement fournie par défaut. " +
        "Définissez une clé secrète unique (variable d'environnement Jwt__Key ou gestionnaire de secrets) avant de démarrer en production.");
}

// --- Pipeline HTTP ---
app.UseExceptionHandler();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "API Rest v1");
    });
}

app.UseCors("Default");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Rend Program accessible aux tests d'intégration (WebApplicationFactory<Program>).
public partial class Program;
