---

inclusion: fileMatch
fileMatchPattern: "{api/**,src/api/**}"
---

# PokeAPI Layer and Proxy Guide

The proxy is optional — the app works without it. Project-wide context is in the other steering docs.

## `src/api/` — the app's GraphQL layer

`src/api/pokedex.ts` defines three `queryOptions` factories:

| Export                        | Purpose                                                                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `pokedexQueryOptions`         | Full dex fetch (`getPokedex`): all Pokémon with stats, sprites, types, species, and evolution data. Fetched once; cached 1 day in IndexedDB. |
| `pokemonInfoQueryOptions(id)` | Per-Pokémon detail (`getPokemonInfo`): abilities, size, species facts, Pokédex entries, cry. `staleTime: Infinity`.                          |
| `typeEfficacyQueryOptions`    | 18×18 type chart (`getTypeEfficacy`): fetched once, shared by the matchups section and `/types`. `staleTime: Infinity`.                      |

Query keys include `queryHash(queryDocument)` (FNV-1a of the query string), so editing a query automatically invalidates its persisted cache entry — no version to bump.

`src/api/allowedQueries.test.ts` fails if the app's query documents drift from `api/src/allowedQueries.json` (whitespace-collapsed). Editing a query in `src/api/pokedex.ts` means updating that JSON too.

## `api/` — the optional local caching proxy

An Express server (`api/src/pokeapiProxy.js`) mounted at `/pokeapi`. Run with `npm run api` (port 3001); use with `npm run dev:proxy`.

### How it works

- `POST /pokeapi/graphql` — forwards only the three allowed operations to PokeAPI. Any other document (unknown operation name, same name with a different selection, appended second operation) gets a 400.
- `getPokemonInfo` accepts only an integer `id` between 1 and 100000; the other two operations take no variables.
- Responses are cached to disk (`api/.cache/`, 24 h TTL). Stale entries are served on upstream failure. Concurrent identical requests are coalesced. 429 responses are retried. Upstream attempts time out after 15 s (`POKEAPI_UPSTREAM_TIMEOUT_MS`) so a hung PokeAPI falls back to the stale entry.
- Responses with `errors`, a non-JSON body, a null `data`, or an empty required list (`pokemon` for the dex; `efficacy` and `types` for the type chart) are not cached. Cache files are written to a temp file then renamed atomically.
- `GET /pokeapi/assets/*` — proxies sprites and cries from `raw.githubusercontent.com/PokeAPI/` with `Cache-Control: immutable`. GraphQL responses have their sprite/cry URLs rewritten to `/pokeapi/assets/` so the browser fetches them same-origin.
- On startup, the server evicts `api/.cache` files unused for 30 days (each asset hit refreshes its mtime; GraphQL entries use a fixed 24 h freshness clock, so their mtime is not bumped on reads). Override the eviction age with `POKEAPI_CACHE_MAX_AGE_DAYS` (must be a positive number).

### Build-time switch

`npm run dev:proxy` defines `__POKEAPI_PROXY__` via Rspack `DefinePlugin`. `src/api/pokedex.ts` reads this flag (`POKEAPI_SOURCE`) and switches the GraphQL endpoint to `/pokeapi/graphql`. Restart the dev server to swap modes.

Proxied query keys get a trailing `"proxy"` element, so proxied and upstream caches are always separate and nothing needs clearing when switching.

Vitest, Storybook, and the Playwright e2e tests never define the flag and always talk to (or mock) PokeAPI directly.

### Tests

`api/src/pokeapiProxy.test.js` runs in the plain-Node Vitest project (`npx vitest run --project api`). The cache directory is redirected via `POKEAPI_CACHE_DIR` so tests never touch `api/.cache`. `pokeapiProxy.js` counts toward the 90% coverage thresholds.
