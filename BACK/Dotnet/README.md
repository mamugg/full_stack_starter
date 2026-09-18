# API Rest .NET

Une API REST ASP.NET Core (.NET 10) : routing par contrôleurs, injection de
dépendances, authentification JWT, appel d'une API publique tierce via
`HttpClient`, et les pratiques de base pour amener un projet .NET vers un
niveau "production ready".

## Structure du projet

```
src/ApiRest.Api/
├── Controllers/
│   ├── AuthController.cs         # POST /api/auth/login, GET /api/auth/me
│   ├── TodoItemsController.cs    # CRUD protégé (ressource en mémoire)
│   └── ExternalController.cs     # Appels vers l'API publique JSONPlaceholder
├── Models/
│   ├── TodoItem.cs                # Entité + DTOs validés (DataAnnotations)
│   ├── Auth/                      # User, LoginRequest (validé), LoginResponse
│   └── External/                  # DTOs pour les réponses de l'API publique
├── Options/
│   └── JwtOptions.cs               # Config JWT fortement typée, validée au démarrage
├── Services/
│   ├── Todos/                      # ITodoService + implémentation en mémoire (thread-safe)
│   ├── Auth/                       # IUserStore, IJwtTokenService
│   └── External/                   # IJsonPlaceholderClient (HttpClient typé + résilience)
└── Program.cs                      # DI, sécurité, JWT, Swagger, pipeline HTTP

tests/ApiRest.Api.Tests/            # Tests d'intégration (xUnit + WebApplicationFactory)
```

Aucune base de données : les "todos" et les utilisateurs sont stockés en
mémoire (perdus au redémarrage). C'est volontaire pour se concentrer sur le
routing, l'authentification et les appels HTTP sortants sans la complexité
d'un ORM — voir "Pistes pour aller plus loin" pour brancher une vraie
persistance.

## Lancer l'API

```bash
cd "src/ApiRest.Api"
dotnet run
```

L'API écoute sur `http://localhost:5259` (et `https://localhost:7021` en HTTPS).
Swagger UI (documentation interactive) : http://localhost:5259/swagger
**Swagger n'est exposé qu'en environnement Development**, comme il se doit en production.

## Lancer les tests

```bash
dotnet test
```

10 tests d'intégration (login, routes protégées, CRUD, validation, 401/404)
tournent contre une instance en mémoire de l'API (`WebApplicationFactory`),
sans dépendance réseau ni base de données externe.

## Comptes de démonstration

| Username | Password    | Rôle  |
|----------|-------------|-------|
| admin    | Admin123!   | Admin |
| user     | User123!    | User  |

Les mots de passe sont hashés avec `PasswordHasher<T>` (même algorithme que
ASP.NET Core Identity) — jamais stockés en clair, même en mémoire.

## Routes disponibles

### Authentification

- `POST /api/auth/login` — envoie `{ "username": "...", "password": "..." }`,
  renvoie un token JWT. Limité à 5 tentatives/minute par IP (protection
  basique contre le brute-force).
- `GET /api/auth/me` — **protégée**, renvoie les informations extraites du
  token (claims). Sert à vérifier que le token est valide.

### Todos (CRUD, toutes les routes sont **protégées**)

- `GET /api/todoitems`
- `GET /api/todoitems/{id}`
- `POST /api/todoitems` — `{ "title": "..." }`
- `PUT /api/todoitems/{id}` — `{ "title": "...", "isDone": true }`
- `DELETE /api/todoitems/{id}`

### Appels à une API publique (JSONPlaceholder)

- `GET /api/external/posts?userId=1` — publique, liste de posts
- `GET /api/external/posts/{id}` — publique, détail d'un post
- `GET /api/external/posts/{id}/with-comments` — **protégée**, combine deux
  appels externes (post + commentaires) pour montrer comment mélanger
  authentification et appels sortants

## Tester avec curl

```bash
# 1. Se connecter et récupérer un token
TOKEN=$(curl -s -X POST http://localhost:5259/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 2. Appeler une route protégée
curl http://localhost:5259/api/auth/me -H "Authorization: Bearer $TOKEN"

# 3. Lister les todos
curl http://localhost:5259/api/todoitems -H "Authorization: Bearer $TOKEN"

# 4. Appeler l'API publique
curl "http://localhost:5259/api/external/posts?userId=1"
```

Un fichier [`src/ApiRest.Api/ApiRest.Api.http`](src/ApiRest.Api/ApiRest.Api.http)
contient toutes les requêtes prêtes à l'emploi (utilisable directement dans
VS Code avec l'extension "REST Client", ou dans Visual Studio/Rider).

Vous pouvez aussi tout tester visuellement via Swagger UI
(http://localhost:5259/swagger) : cliquez sur "Authorize" et collez
`Bearer <votre_token>` pour débloquer les routes protégées.

## Ce qui rend ce projet "production ready"

Ce starter n'a pas besoin de toute la complexité d'un vrai système en
production, mais applique volontairement des pratiques qu'on retrouve dans
une vraie API .NET :

- **Configuration fortement typée et validée au démarrage** — [Options/JwtOptions.cs](src/ApiRest.Api/Options/JwtOptions.cs)
  est lié via `AddOptions<T>().Bind().ValidateDataAnnotations().ValidateOnStart()` :
  une config JWT incomplète ou invalide fait échouer le démarrage immédiatement,
  pas à la première requête.
- **Gestion des secrets** — la clé JWT dans `appsettings.json` est un
  placeholder de développement clairement identifié. **Program.cs refuse de
  démarrer en environnement `Production`** si cette valeur par défaut est
  encore utilisée (voir le garde-fou juste après `builder.Build()`). En
  production, elle doit venir d'une variable d'environnement (`Jwt__Key`) ou
  d'un gestionnaire de secrets — jamais du code source. En développement,
  l'alternative recommandée est `dotnet user-secrets` :
  ```bash
  cd src/ApiRest.Api
  dotnet user-secrets init
  dotnet user-secrets set "Jwt:Key" "une-cle-generee-aleatoirement-32-caracteres-minimum"
  ```
- **Rate limiting** — limite globale par IP (100 req/min) + limite stricte
  sur `/api/auth/login` (5 req/min) via `Microsoft.AspNetCore.RateLimiting`,
  pour limiter les attaques par force brute sur le login.
- **Réponses d'erreur standardisées** — `AddProblemDetails()` +
  `UseExceptionHandler()` : les exceptions non gérées et les erreurs de
  validation renvoient toutes du `application/problem+json` cohérent, sans
  fuite de stack trace en production.
- **Validation automatique des entrées** — les DTOs (`LoginRequest`,
  `CreateTodoItemDto`, ...) utilisent `DataAnnotations` ; `[ApiController]`
  rejette automatiquement les requêtes invalides en 400, sans code de
  validation dupliqué dans chaque contrôleur.
- **Résilience sur les appels sortants** — le client vers JSONPlaceholder
  utilise `AddStandardResilienceHandler()` (retries avec backoff, circuit
  breaker, timeouts) pour ne pas planter si l'API tierce est lente ou
  temporairement indisponible.
- **Swagger restreint au développement** — désactivé par défaut en
  production pour ne pas exposer la surface de l'API publiquement.
- **HSTS** activé hors développement, en plus de la redirection HTTPS.
- **CORS explicite** — aucune origine autorisée par défaut ; à renseigner
  via `Cors:AllowedOrigins` si un frontend doit consommer l'API depuis un
  navigateur.
- **Journalisation d'audit minimale** — tentatives de connexion réussies/
  échouées loguées (sans jamais journaliser le mot de passe).
- **Tests d'intégration** — voir `tests/ApiRest.Api.Tests`, exécutés contre
  une vraie instance de l'API en mémoire.
- **Warnings traités comme des erreurs** ([Directory.Build.props](Directory.Build.props))
  pour ne jamais laisser un avertissement du compilateur s'accumuler silencieusement.

Ce que ce projet ne fait volontairement **pas** (hors périmètre de ce starter,
mais à savoir pour un vrai système en production) :

- Stockage en mémoire au lieu d'une vraie base de données (voir plus bas).
- Pas de refresh token : le JWT expire après 60 minutes sans renouvellement.
- Pas de verrouillage de compte après N échecs de connexion (seul le rate
  limiting protège contre le brute-force).
- Pas de télémétrie/observabilité (OpenTelemetry, Application Insights, etc.).

## Repères d'architecture .NET

- **Program.cs** (minimal hosting model) : c'est ici que tout se configure —
  injection de dépendances (`builder.Services.Add...`), authentification,
  Swagger, et le pipeline de middlewares (`app.Use...`), dans un ordre précis
  (l'ordre des `app.Use...` détermine l'ordre d'exécution des middlewares).
- **Contrôleurs** (`[ApiController]`, `[Route]`, `[HttpGet]`, etc.) : chaque
  méthode publique devient une route HTTP.
- **Injection de dépendances** : les contrôleurs ne créent jamais leurs
  dépendances (`ITodoService`, `IJwtTokenService`, ...), elles sont injectées
  via le constructeur et enregistrées dans `Program.cs`.
- **JWT** : `AuthController` génère un token signé (`JwtTokenService`),
  `Program.cs` configure `AddJwtBearer` pour le valider automatiquement sur
  toute route marquée `[Authorize]`.
- **HttpClient typé** (`IHttpClientFactory` via `AddHttpClient<TInterface, TImplementation>`) :
  la bonne pratique pour appeler une API externe, évite les fuites de sockets
  liées à l'instanciation manuelle de `HttpClient`.
- **Options pattern** (`IOptions<T>`) : au lieu de lire `IConfiguration`
  directement partout, on lie une section de config à une classe typée,
  validée une seule fois au démarrage.

## Pistes pour aller plus loin

- Remplacer le stockage en mémoire par Entity Framework Core + SQLite/PostgreSQL.
- Ajouter la pagination sur `GET /api/todoitems`.
- Ajouter un `RefreshToken` pour renouveler le JWT sans redemander le mot de passe.
- Restreindre certaines routes par rôle avec `[Authorize(Roles = "Admin")]`.
- Ajouter de l'observabilité (OpenTelemetry) et un endpoint `/health`
  (`AddHealthChecks()`).
