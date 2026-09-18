# Full Stack Starter

Starter full-stack pense comme base reutilisable pour de futurs projets. Deux
backends equivalents (meme contrat HTTP) sont fournis au choix, a brancher
sur le meme front Angular :

- [`BACK/Dotnet/`](BACK/Dotnet/README.md) — API REST ASP.NET Core (.NET 10) : JWT, CRUD en memoire, appel d'une API tierce.
- [`BACK/Nest/`](BACK/Nest/README.md) — API REST NestJS (Node.js/TypeScript), equivalent fonctionnel du backend .NET.
- [`FRONT/Angular/`](FRONT/Angular/README.md) — Application Angular (v22, signals, zoneless, Vitest) qui consomme l'une ou l'autre API.

## Demarrage rapide

```bash
# Terminal 1 — API .NET (http://localhost:5259) ...
cd BACK/Dotnet/src/ApiRest.Api
dotnet run

# ... OU API NestJS (http://localhost:3000)
cd BACK/Nest
npm install
npm run start:dev

# Terminal 2 — Front (http://localhost:4200)
cd FRONT/Angular
npm install
npm start
```

Par defaut, le front pointe sur l'API .NET
(`FRONT/Angular/src/environments/environment.ts`). Pour utiliser l'API
NestJS a la place, changez `apiBaseUrl` en `http://localhost:3000/api` — voir
["Brancher le front Angular sur cette API"](BACK/Nest/README.md#brancher-le-front-angular-sur-cette-api).
Aucune autre modification n'est necessaire : les deux backends exposent le
meme contrat (routes, JSON, codes de statut, forme des erreurs).

Comptes de demo : `admin / Admin123!` ou `user / User123!`.

Voir le README de chaque projet pour le detail (architecture, tests, endpoints).
