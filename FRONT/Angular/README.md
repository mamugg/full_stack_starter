# web — Angular Starter

Application Angular 22 qui consomme l'API REST du dépôt — au choix,
[.NET](../../BACK/Dotnet/README.md) ou [NestJS](../../BACK/Nest/README.md) : les deux exposent
le même contrat HTTP, rien à changer côté Angular à part `apiBaseUrl` (voir
"Lancer le projet" ci-dessous). Pensée comme base de départ pour de futurs
projets full-stack : architecture propre, exemples variés, sans surcharge inutile.

## Stack et choix techniques

- **Angular 22**, **standalone** (pas de NgModules), **zoneless** (`provideBrowserGlobalErrorListeners`
  sans `zone.js`) et **signals** pour tout l'état applicatif.
- **Vitest** (via `@angular/build:unit-test`) comme test runner — pas de Karma/Jasmine.
- **`httpResource`** (nouvelle API signals d'Angular pour les requêtes GET réactives) pour la
  page "Articles", en complément d'un **NgRx SignalStore** (`@ngrx/signals`) pour les "Tâches"
  (CRUD complet) — les deux approches modernes de gestion d'état sont volontairement
  représentées côte à côte.
- **Router avec `withComponentInputBinding()`** : les paramètres de route (`:id`) sont injectés
  directement dans les `input()` des composants, sans `ActivatedRoute` manuel.
- **Interceptors fonctionnels** (`HttpInterceptorFn`) pour l'injection du JWT et la
  déconnexion automatique sur 401.
- **Reactive Forms** pour les formulaires (login, création de tâche).
- **[spartan/ui](https://spartan.ng)** (Tailwind CSS v4 + composants headless de
  `@spartan-ng/brain`) comme librairie de composants — voir "UI : spartan/ui" ci-dessous.

## Structure

```
src/app/
├── core/                    # Transverse : auth, config, http
│   ├── auth/                 # AuthService (signals), guards, TokenStorageService
│   ├── config/                # API_BASE_URL (InjectionToken lié à environment)
│   └── http/                  # Intercepteurs (JWT, expiration de session)
├── features/
│   ├── auth/login-page/       # Formulaire de connexion
│   ├── todos/
│   │   ├── data-access/       # TodoStore (NgRx SignalStore) + modèles
│   │   └── feature/            # Page + composants UI (todo-item, todo-form)
│   └── posts/
│       ├── data-access/       # Modèles (ExternalPost, PostWithComments)
│       └── feature/            # post-list-page (httpResource + filtre auteur + recherche)
│                                # post-detail-page (route protégée + commentaires)
├── layout/
│   ├── shell/                  # Header/nav + router-outlet
│   └── not-found-page/
├── shared/
│   ├── ui/                     # Composants dumb réutilisables (spinner, alerte d'erreur)
│   └── utils/                   # extractErrorMessage (ProblemDetails → message lisible)
└── app.routes.ts               # Routes lazy-loadées, guards

libs/ui/                        # Composants spartan/ui (button, input, label, card, alert, spinner)
                                 # — code source copié dans le repo, pas un node_modules figé
```

Chaque brique testée a son fichier `*.spec.ts` à côté (Vitest + `TestBed`,
`HttpTestingController` pour les services HTTP).

## Lancer le projet

Nécessite une des deux API démarrée (CORS déjà configuré pour
`http://localhost:4200` en développement) :

- [API .NET](../../BACK/Dotnet/README.md) sur `http://localhost:5259` — c'est la valeur
  par défaut de `apiBaseUrl` (voir `src/environments/environment.ts`).
- [API NestJS](../../BACK/Nest/README.md) sur `http://localhost:3000` — changez alors
  `apiBaseUrl` en `http://localhost:3000/api`.

```bash
npm install
npm start      # http://localhost:4200
npm test       # Vitest (50 tests)
npm run build  # build de production
```

> **Note environnement** : sous Node ≥ 22, le `localStorage` natif expérimental de Node
> peut entrer en conflit avec celui fourni par jsdom pendant les tests. Le script `test`
> désactive ce comportement via `NODE_OPTIONS=--no-experimental-webstorage` (voir
> `package.json`) — rien à faire de plus, `npm test` fonctionne tel quel.

## Comptes de démo

Communs aux deux backends : `admin / Admin123!` ou `user / User123!`.

## Fonctionnalités couvertes (exemples pour un starter)

- **Auth JWT** : login, stockage du token, guard de route, déconnexion automatique sur
  expiration/401, garde "invité" (redirige un utilisateur déjà connecté loin de `/login`).
- **CRUD protégé** : tâches (créer, lister, cocher/décocher, supprimer) sur une ressource
  en mémoire côté API, géré par un **NgRx SignalStore** (`TodoStore` — `withState`,
  `withComputed`, `withMethods`, `rxMethod` pour le chargement).
- **Consommation d'API publique** : liste d'articles filtrable par auteur **et** par
  recherche texte (client-side sur le titre), avec route publique et route protégée
  combinant deux appels externes (post + commentaires).
- **Gestion d'erreurs** homogène (`extractErrorMessage`) pour les erreurs de validation
  ASP.NET (`ValidationProblemDetails`) et les erreurs réseau.

## Pourquoi deux approches d'état différentes ?

- **`TodoStore`** (NgRx SignalStore) : montre le pattern "store" dédié — utile dès que l'état
  doit être manipulé par plusieurs méthodes (create/toggle/remove) avec des mutations
  optimistes du même tableau. `load` utilise `rxMethod` (annule un chargement précédent en
  cours via `switchMap`) ; `create`/`toggle`/`remove` restent des méthodes classiques
  (`patchState` + `subscribe`) — chaque appel est indépendant, pas de flux à annuler.
- **`httpResource`** (page Articles) : montre l'alternative "sans store" pour un simple
  GET réactif (pas de mutation) — la requête se refait automatiquement quand le signal
  dont elle dépend change, sans service ni souscription manuelle.

Pour un vrai projet : commencez par des signals simples dans un service (état privé +
`asReadonly()` + méthodes qui appellent `.set()`/`.update()`) ; passez à un store dédié
(NgRx SignalStore) seulement quand l'état est partagé entre plusieurs features ou que la
logique de mutation devient difficile à suivre dans un service "à plat".

## UI : spartan/ui

Le starter utilise [spartan/ui](https://spartan.ng) (l'équivalent Angular de shadcn/ui) plutôt
qu'une lib "boîte noire" comme Angular Material. Deux couches :

- **`@spartan-ng/brain`** (npm) — primitives headless (accessibilité, comportement), jamais
  modifiées directement.
- **`libs/ui/*`** (code copié dans le repo par le CLI) — le style Tailwind de chaque composant
  (`hlm-*`), que vous êtes censé éditer librement pour l'adapter à votre design.

Composants déjà installés : `button`, `input`, `label`, `card`, `alert`, `spinner`. Ils
s'utilisent comme des attributs sur les éléments natifs (`<button hlmBtn>`, `<input hlmInput>`,
`<div hlmCard>`…) — voir `login-page` pour l'exemple le plus complet (carte + champs + bouton).

Pour ajouter un composant supplémentaire (liste complète sur
[spartan.ng/components](https://spartan.ng/components)) :

```bash
npx ng generate @spartan-ng/cli:ui <nom-du-composant>
# ex. npx ng generate @spartan-ng/cli:ui dialog
```

Le thème (couleurs, rayons de bordure, dark mode) vit dans `src/styles.css` sous forme de
variables CSS (`--primary`, `--card`, `--border`, …) — c'est la **même** palette que le reste
de l'app (voir le commentaire dans `styles.css`) : rien à mapper, tout composant existant ou
nouveau lit les mêmes tokens, dark mode compris (`<html class="dark">` bascule tout le thème,
non câblé sur un bouton pour l'instant — à ajouter si besoin).

## Pistes pour aller plus loin

- Pagination sur la liste des tâches côté API + UI.
- Rafraîchissement de token (refresh token) côté API et intercepteur associé.
- Tests e2e (Playwright) en complément des tests unitaires.
- Bouton de bascule dark mode (`document.documentElement.classList.toggle('dark')`) — le
  thème est prêt, il ne manque qu'un interrupteur dans le header.
