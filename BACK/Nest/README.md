# API Rest NestJS

Une API REST **NestJS** (Node.js + TypeScript), equivalent fonctionnel de
l'[API .NET](../Dotnet/README.md) du meme starter : meme contrat HTTP (routes,
formats JSON, codes de statut), pour pouvoir brancher indifferemment l'une ou
l'autre derriere le [front Angular](../../FRONT/Angular/README.md) sans rien
changer cote client. L'implementation, elle, est idiomatique NestJS plutot
qu'une traduction ligne a ligne du code .NET : modules/guards/pipes/DTOs,
Passport pour le JWT, class-validator pour la validation, etc.

## Structure du projet

```
src/
├── auth/
│   ├── auth.controller.ts      # POST /api/auth/login, GET /api/auth/me
│   ├── auth.service.ts          # Verification des identifiants + emission du JWT
│   ├── user-store.service.ts    # 2 utilisateurs de demo en memoire (bcrypt)
│   ├── jwt-auth.guard.ts        # Guard global (voir common/decorators/public.decorator.ts)
│   ├── strategies/jwt.strategy.ts
│   └── dto/                     # LoginDto (valide), LoginResponseDto
├── todos/
│   ├── todos.controller.ts      # CRUD protege, route "todoitems" (compat front Angular)
│   ├── todos.service.ts         # Stockage en memoire
│   └── dto/                     # CreateTodoDto, UpdateTodoDto (valides)
├── external/
│   ├── external.controller.ts   # Proxy vers l'API publique JSONPlaceholder
│   └── external.service.ts      # Client HTTP typé (@nestjs/axios) + retries
├── common/
│   ├── decorators/               # @Public(), @CurrentUser()
│   └── validation-exception.factory.ts  # Erreurs de validation -> { title, errors }
├── config/                       # Configuration typee + validee au demarrage (Joi)
├── app.module.ts                 # Assemblage des modules, rate limiting global
└── main.ts                       # Bootstrap : CORS, Helmet, ValidationPipe, Swagger

test/app.e2e-spec.ts              # Tests d'integration (Jest + Supertest)
```

Aucune base de donnees : comme la version .NET, les "todos" et les
utilisateurs sont en memoire (perdus au redemarrage) — volontaire pour se
concentrer sur le routing, l'authentification et les appels HTTP sortants.
Voir "Pistes pour aller plus loin" pour brancher une vraie persistance
(Prisma, TypeORM...).

## Lancer l'API

```bash
npm install
cp .env.example .env   # deja fourni avec des valeurs de dev fonctionnelles
npm run start:dev
```

L'API ecoute sur `http://localhost:3000` (voir `PORT` dans `.env`), toutes
les routes sous `/api`. Swagger UI (doc interactive) :
`http://localhost:3000/swagger`. **Swagger n'est expose qu'hors production**
(`NODE_ENV=production`), comme il se doit.

## Lancer les tests

```bash
npm test        # tests unitaires (Jest)
npm run test:e2e  # tests d'integration (Jest + Supertest, app Nest en memoire)
```

Les tests d'integration (`test/app.e2e-spec.ts`) couvrent login, routes
protegees, CRUD, validation et 401/404 — memes scenarios que la suite xUnit
de l'API .NET.

## Comptes de demonstration

| Username | Password    | Role  |
|----------|-------------|-------|
| admin    | Admin123!   | Admin |
| user     | User123!    | User  |

Les mots de passe sont hashes avec `bcrypt` — jamais stockes en clair, meme
en memoire.

## Routes disponibles

Identiques a l'API .NET (meme chemins, memes formats de requete/reponse) :

### Authentification

- `POST /api/auth/login` — envoie `{ "username": "...", "password": "..." }`,
  renvoie `{ token, expiresAtUtc, username, role }`. Limite a 5 tentatives/min
  par IP (protection basique contre le brute-force).
- `GET /api/auth/me` — **protegee**, renvoie `{ username, role, claims }`
  extraits du token. Sert a verifier que le token est valide.

### Todos (CRUD, toutes les routes sont **protegees**)

- `GET /api/todoitems`
- `GET /api/todoitems/{id}`
- `POST /api/todoitems` — `{ "title": "..." }`
- `PUT /api/todoitems/{id}` — `{ "title": "...", "isDone": true }`
- `DELETE /api/todoitems/{id}`

### Appels a une API publique (JSONPlaceholder)

- `GET /api/external/posts?userId=1` — publique, liste de posts
- `GET /api/external/posts/{id}` — publique, detail d'un post
- `GET /api/external/posts/{id}/with-comments` — **protegee**, combine deux
  appels externes (post + commentaires)

## Brancher le front Angular sur cette API

Le front pointe par defaut sur l'API .NET
(`FRONT/Angular/src/environments/environment.ts`, `apiBaseUrl:
'http://localhost:5259/api'`). Pour utiliser cette API NestJS a la place,
changez simplement cette valeur :

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',
};
```

Aucune autre modification n'est necessaire cote Angular : les deux API
exposent le meme contrat (routes, JSON en camelCase, codes de statut, forme
des erreurs de validation `{ title, errors }` consommee par
`extractErrorMessage`).

## Tester avec curl

```bash
# 1. Se connecter et recuperer un token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 2. Appeler une route protegee
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer $TOKEN"

# 3. Lister les todos
curl http://localhost:3000/api/todoitems -H "Authorization: Bearer $TOKEN"

# 4. Appeler l'API publique
curl "http://localhost:3000/api/external/posts?userId=1"
```

Vous pouvez aussi tout tester visuellement via Swagger UI
(http://localhost:3000/swagger) : cliquez sur "Authorize" et collez le token
JWT pour debloquer les routes protegees.

## Ce qui rend ce projet "production ready"

- **Configuration typee et validee au demarrage** — `config/env.validation.ts`
  utilise un schema Joi branche sur `ConfigModule.forRoot({ validationSchema
  })` : une config incomplete ou invalide fait echouer le demarrage
  immediatement, pas a la premiere requete.
- **Gestion des secrets** — `JWT_SECRET` dans `.env` est un placeholder de
  developpement clairement identifie. **`main.ts` refuse de demarrer en
  `NODE_ENV=production`** si cette valeur par defaut est encore utilisee. En
  production, il doit venir d'une variable d'environnement injectee par la
  plateforme d'hebergement ou un gestionnaire de secrets — jamais du code
  source ni d'un `.env` commite.
- **Rate limiting** — limite globale par IP (100 req/min, `@nestjs/throttler`
  en garde globale) + limite stricte sur `/api/auth/login` (5 req/min via
  `@Throttle`).
- **Reponses d'erreur standardisees** — `validationExceptionFactory` normalise
  les erreurs de validation `class-validator` en `{ title, errors }` (le
  format que le front Angular sait deja lire, cote .NET c'est un
  `ValidationProblemDetails`), sans fuite de detail d'implementation.
- **Validation automatique des entrees** — les DTOs (`LoginDto`,
  `CreateTodoDto`, ...) utilisent `class-validator` ; un `ValidationPipe`
  global rejette automatiquement les requetes invalides en 400.
- **Resilience sur les appels sortants** — le client vers JSONPlaceholder
  (`ExternalService`) applique un timeout et retente les erreurs reseau/5xx
  avec un backoff court, sans retenter les 4xx (un 404 est une reponse
  valide, pas une panne).
- **Guard JWT global** — toutes les routes sont protegees par defaut
  (`APP_GUARD` + `JwtAuthGuard`) ; seules les routes explicitement annotees
  `@Public()` (login, liste/detail des posts publics) sont accessibles sans
  token — echoue "ferme" par defaut plutot que d'oublier une route sensible.
- **Securite HTTP** — `helmet()` pour les en-tetes de securite standards
  (CSP, HSTS, nosniff, ...).
- **CORS explicite** — aucune origine autorisee par defaut ; a renseigner via
  `CORS_ALLOWED_ORIGINS` si un frontend doit consommer l'API depuis un
  navigateur.
- **Journalisation d'audit minimale** — tentatives de connexion reussies/
  echouees loguees (sans jamais journaliser le mot de passe).
- **Swagger restreint au developpement** — desactive par defaut en
  production pour ne pas exposer la surface de l'API publiquement.
- **Tests d'integration** — voir `test/app.e2e-spec.ts`, executes contre une
  vraie instance Nest en memoire (`@nestjs/testing` + Supertest).

Ce que ce projet ne fait volontairement **pas** (hors perimetre de ce
starter, mais a savoir pour un vrai systeme en production) :

- Stockage en memoire au lieu d'une vraie base de donnees (voir plus bas).
- Pas de refresh token : le JWT expire apres 60 minutes sans renouvellement.
- Pas de verrouillage de compte apres N echecs de connexion (seul le rate
  limiting protege contre le brute-force).
- Pas de telemetrie/observabilite (OpenTelemetry, etc.).

## Reperes d'architecture NestJS

- **Modules** (`@Module`) : chaque domaine (`auth`, `todos`, `external`) est
  un module autonome qui declare ses controllers et providers, importe dans
  `AppModule`.
- **Injection de dependances** : les controllers/services declarent leurs
  dependances dans le constructeur (`constructor(private readonly x: X) {}`),
  Nest les resout via son container IoC.
- **Guards** (`CanActivate`) : `JwtAuthGuard` intercepte chaque requete avant
  le controller pour verifier le token — enregistre globalement via
  `APP_GUARD`, contournable par route/controller avec `@Public()`.
- **Strategy Passport** (`JwtStrategy`) : delegue la verification du JWT
  (signature, expiration, issuer/audience) a `passport-jwt`.
- **Pipes** (`ValidationPipe`, `ParseIntPipe`) : transforment/valident les
  entrees avant qu'elles n'atteignent le controller.
- **DTOs + class-validator** : les regles de validation vivent en decorateurs
  sur des classes plutot que dans le code du controller.
- **`@nestjs/config` + Joi** : equivalent du pattern `IOptions<T>` de .NET —
  configuration typee, validee une seule fois au demarrage.
- **`@nestjs/axios`** (HttpService, base sur Axios/RxJS) : l'equivalent du
  `HttpClient` typé de .NET pour appeler une API externe.

## Pistes pour aller plus loin

- Remplacer le stockage en memoire par Prisma ou TypeORM + PostgreSQL/SQLite.
- Ajouter la pagination sur `GET /api/todoitems`.
- Ajouter un `RefreshToken` pour renouveler le JWT sans redemander le mot de
  passe.
- Restreindre certaines routes par role avec un `RolesGuard` +
  `@Roles('Admin')`.
- Ajouter de l'observabilite (OpenTelemetry) et un endpoint `/health`
  (`@nestjs/terminus`).
