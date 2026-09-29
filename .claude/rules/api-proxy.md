---
paths:
  - "api/**"
  - "src/api/**"
---

# PokeAPI proxy (`api/`)

Project-wide context is in the root `CLAUDE.md`. The proxy is optional; the app works without it.

Local proxy (`api/src/pokeapiProxy.js`, mounted at `/pokeapi` on the Express server): `POST /pokeapi/graphql` forwards only the three dex operations to PokeAPI and caches the response on disk (`api/.cache/`, 24 h, stale on upstream failure, coalesced, retries 429s); `GET /pokeapi/assets/*` proxies sprites and cries from `raw.githubusercontent.com/PokeAPI/` with `Cache-Control: immutable`, and the GraphQL responses have those URLs rewritten to `/pokeapi/assets/`. It is a build-time switch: `npm run dev:proxy` defines `__POKEAPI_PROXY__` (`DefinePlugin`, `src/api/pokedex.ts` `POKEAPI_SOURCE`) and the dev server proxies `/pokeapi` to :3001. Restart the dev server to swap; proxied query keys get a trailing `"proxy"` so the persisted caches never mix and nothing needs clearing. Vitest, Storybook and e2e never define the flag. On startup the server evicts `api/.cache` files unused for 30 days (each asset hit refreshes its mtime, so anything still read is kept; GraphQL entries are not touched, since their mtime is the 24 h freshness clock); override with `POKEAPI_CACHE_MAX_AGE_DAYS` (ignored unless a positive number). Cache files are written to a temp file and renamed, GraphQL responses with `errors` or a non-JSON body are not cached, and documents with more than one operation get a 400. Tests: `api/src/pokeapiProxy.test.js` runs in the plain-Node Vitest project `api` (`npx vitest run --project api`), with the cache dir redirected through `POKEAPI_CACHE_DIR`; `pokeapiProxy.js` counts toward the coverage thresholds.

