---
name: pokeapi-contract
description: Run the live PokeAPI contract test (npm run test:contract) and diagnose a failure. Use after changing the GraphQL queries in src/api/pokedex.ts, PokemonTypes.ts or convertToPokemonInfo, after changing the PokeAPI URL (POKEAPI_UPSTREAM_URL, api/src/pokeapiProxy.js), or when the app suddenly fails to load data (401, CORS error, empty dex).
---

# PokeAPI contract test

Every other test uses fixtures or mocks, so none of them notice when PokeAPI moves its endpoint or changes its schema. `src/api/pokedex.contract.ts` runs the app's real queries (`pokedexQuery`, `infoQuery`, `efficacyQuery`, exported from `src/api/pokedex.ts`) against `POKEAPI_UPSTREAM_URL` and checks the response shape and the CORS preflight. It needs the network and is not part of `npm run verify`; CI runs it weekly and on manual dispatch (`contract` job in `.github/workflows/verify.yml`).

## Steps

1. Run `npm run test:contract`.
2. If it passes, report that and stop.
3. If it fails, find which kind of failure it is before changing anything:
   - **401 or 404 on all four tests**: the endpoint moved or was retired. Probe the URL with `curl -s -i -X POST <url> -H "content-type: application/json" -d '{"query":"{__typename}"}'` and look for the current endpoint in PokeAPI's GraphQL docs. Update `POKEAPI_UPSTREAM_URL` in `src/api/pokedex.ts`, `GRAPHQL_URL` in `api/src/pokeapiProxy.js`, `api/src/pokeapiProxy.test.js` and `e2e/mocks.ts`, the `preconnect` hosts in `src/pages/*.tsx`, and the URL in `CLAUDE.md` and `api/README.md`.
   - **CORS test fails but the queries pass**: PokeAPI stopped sending `Access-Control-Allow-Origin`. The browser cannot call it directly any more, so the app must use the proxy path (`dev:proxy`) or a different host. Report this to the user rather than working around it.
   - **A GraphQL validation error ("field ... not found")**: the schema changed. Introspect it (`{__type(name:"pokemon"){fields{name}}}`) for the failing type, rename the field in the query, then update the matching type in `src/types/PokemonTypes.ts`, `convertToPokemonInfo`/the converters in `src/utils/pokemon`, and the e2e mock responses (`e2e/mocks.ts`).
   - **Shape assertion fails (for example the dex has fewer than 1000 Pokémon, or `sprites[0].default` is not a GitHub URL)**: the query is valid but the data changed. Check the live response by hand before editing the test; do not loosen an assertion just to make it pass.
4. After any query shape change, bump the persisted query key (the `bump-query-key` skill, if present), then run `npm run verify`.
5. Do not add the contract test to `verify` or a git hook: a PokeAPI outage must not block commits or merges.
