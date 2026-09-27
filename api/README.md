# Pokedex API (legacy)

A small Express 5 server. It has two jobs: the legacy MongoDB routes behind the hidden `/teams` page (`http://localhost:3001/api/v1/pokemon/teams`), and an optional local caching proxy for PokeAPI (below). The Pokédex reads from PokeAPI directly unless it is started with `npm run dev:proxy`.

## Setup

Requires Node.js 18 or higher and access to the MongoDB cluster.

```bash
cd api
npm install
```

Create `api/.env` (gitignored):

```
PORT=3001            # optional, defaults to 3001
MONGODB_USERNAME=...
MONGODB_PASSWORD=...
MONGODB_DB=...
```

## Scripts

- `npm start`: run the server
- `npm run dev`: run with nodemon

Linting and formatting come from the root Biome config (`npm run biome:lint` / `biome:format` in the repo root cover `api/src`).

## Endpoints

All routes are `GET` and prefixed with `/api/v1/pokemon`:

| Route | Description |
|---|---|
| `/all` | all Pokémon |
| `/search=:search` | search by text |
| `/id/:id` | by id |
| `/name/:name` | by name |
| `/type/:type` | by type |
| `/gen/:number` | by generation |
| `/teams` | teams |

## PokeAPI proxy

Mounted at `/pokeapi` (no MongoDB credentials needed). It avoids PokeAPI's rate limits and gives sprites and cries a long cache lifetime.

| Route | Description |
|---|---|
| `POST /pokeapi/graphql` | Forwards the app's `getPokedex`, `getPokemonInfo` and `getTypeEfficacy` queries to `https://beta.pokeapi.co/graphql/v1beta` (other operations get a 400). Responses are cached on disk for 24 h, served stale if PokeAPI is down, and identical concurrent requests share one upstream call. 429s are retried honouring `Retry-After`. |
| `GET /pokeapi/assets/*` | Sprites and cries from `raw.githubusercontent.com/PokeAPI/`, cached on disk and served with `Cache-Control: public, max-age=31536000, immutable`. |

The GraphQL responses have their `raw.githubusercontent.com/PokeAPI/` URLs rewritten to `/pokeapi/assets/`, so the browser loads them same-origin. Cached files live in `api/.cache/` (gitignored); delete it to refetch everything.

Use it from the frontend (repo root), in two terminals:

```bash
npm run api          # this server on :3001
npm run dev:proxy    # dev server on :3000 that sends /pokeapi to :3001
```

`npm run dev` talks to `beta.pokeapi.co` directly. Swapping means restarting the dev server; nothing needs clearing because the two modes use separate query keys.
