# Pokedex API

A small Express 5 server that hosts an optional local caching proxy for PokeAPI (below). There is no database. The Pokédex reads from PokeAPI directly unless it is started with `npm run dev:proxy`.

## Setup

Requires Node.js 18 or higher.

```bash
cd api
npm install
```

Set `PORT` in the environment to change the port (defaults to 3001).

## Scripts

- `npm start`: run the server
- `npm run dev`: run with nodemon

Linting and formatting come from the root Biome config (`npm run biome:lint` / `biome:format` in the repo root cover `api/src`).

## PokeAPI proxy

Mounted at `/pokeapi`. It avoids PokeAPI's rate limits and gives sprites and cries a long cache lifetime.

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
