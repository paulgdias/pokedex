# Pokedex

React 19 Pokédex practice app (a testbed for libraries and patterns). Client-side only; all data comes from the PokeAPI GraphQL endpoint (`https://beta.pokeapi.co/graphql/v1beta`). Official artwork is loaded from GitHub's CDN (`https://raw.githubusercontent.com/`).

Path-scoped rules (loaded only when working on matching files): [`.claude/rules/components.md`](.claude/rules/components.md) (`src/components/**`), [`.claude/rules/utils.md`](.claude/rules/utils.md) (`src/utils/**`).

## Commands

- `npm run dev`: rspack dev server on port 3000 (also type-checks via `TsCheckerRspackPlugin`). `npm run dev:proxy` is the same with `POKEAPI_PROXY=1`: PokeAPI requests go through the local caching proxy in `api/` (run it with `npm run api`, port 3001) instead of `beta.pokeapi.co`; see Data flow.
- `npm run build`: production build to `dist/` (gitignored). `npm start` serves the production build with `Cache-Control: immutable` (1 year) on content-hashed `.js`/`.css` and `no-cache` on everything else (`devServer.headers` in `rspack.config.ts`, production mode only); a real host must do the same or Lighthouse flags "Use efficient cache lifetimes".
- `npm run type-check`: `tsc --noEmit`
- `npm run biome:lint` / `npm run biome:lint:fix`: Biome linter over `src` and `api/src`.
- `npm run biome:format`: Biome formatter over `src` and `api/src` (one Biome config for both). Style: 4 spaces, double quotes, semicolons, width 80, ES5 trailing commas.
- `npm run biome:check:fix`: Biome linter, formatter, and organize-imports with safe auto-fixes over `src` and `api/src`.
- `npm test`: `vitest run` (all tests plus every story as a test). `npm run test:coverage`: same with v8 coverage over `src/components` and `src/utils`, failing under 90% for statements, branches, functions and lines. `npm run storybook`: Storybook on port 6006, with `@storybook/addon-docs` used only as the MDX engine (no autodocs): each component has a hand-written `Name.mdx` docs page beside it, and the intro page is `.storybook/Introduction.mdx`.
- Verify changes with `npm run biome:lint`, `npm run type-check`, `npm run build` and `npm run test:coverage`.

## Stack

React 19, react-router 7 (data router), TanStack Query 5 (cache persisted to IndexedDB, 1 day), Tailwind 4, react-aria-components, lucide-react, sonner (toasts), react-virtualized, react-error-boundary, Rspack, Biome.

Tailwind theme tokens live in the `@theme` block of `src/styles/index.css`. `tailwind.config.ts` is not where the theme is defined.

## Path aliases

`@api`, `@components`, `@styles`, `@customTypes` (-> `src/types`), `@utils`. They are declared in `tsconfig.json`, `rspack.config.ts` **and** `vitest.config.mts` (Storybook reuses the Vitest config's aliases in `.storybook/main.ts`); add new ones to all of them.

## Data flow

`src/index.tsx` (providers) -> `createAppRouter` in `src/utils/routes.tsx` -> route loaders call `queryClient.ensureQueryData(pokedexQueryOptions)` (`src/api/pokedex.ts`; the shared `pokedexLoader` lives in `src/utils/pokedexLoader.ts`) -> `convertToPokemonDetailsArray` + `withEvolutions` (`src/utils/pokemon.ts`) -> pages read `useLoaderData`.

- The whole dex is fetched once; search, filter, and sort all run client-side in memory.
- Route ids `"pokedex"` and `"pokemon"` matter: `Nav` reads them with `useRouteLoaderData`.
- Pages other than Home are code-split with React Router's `lazy` in `src/utils/routes.tsx` (`dataRoute` takes `() => import("../pages/X")`). The loader is passed statically, so data fetching runs in parallel with the page chunk. Import `react-virtualized` by deep path (`react-virtualized/dist/es/Grid`), not the barrel, which bundles the whole library; the sonner `Toaster` is lazy-loaded in `Layout`. `rspack.config.ts` splits `framework` (react, react-dom, react-router) into its own chunk and sets a size budget (`performance`); keep the entry under it.
- `/pokedex`, `/pokedex/:pokemon` and `/compare` share the same loader. `/types` (type chart) needs no dex data and has no loader.
- Sprite preconnections: `Pokedex.tsx` and `Pokemon.tsx` preconnect to `https://beta.pokeapi.co` and `https://raw.githubusercontent.com/` (harmless when the proxy is on).
- Optional local proxy (`api/src/pokeapiProxy.js`, mounted at `/pokeapi` on the Express server): `POST /pokeapi/graphql` forwards only the three dex operations to PokeAPI and caches the response on disk (`api/.cache/`, 24 h, stale on upstream failure, coalesced, retries 429s); `GET /pokeapi/assets/*` proxies sprites and cries from `raw.githubusercontent.com/PokeAPI/` with `Cache-Control: immutable`, and the GraphQL responses have those URLs rewritten to `/pokeapi/assets/`. It is a build-time switch: `npm run dev:proxy` defines `__POKEAPI_PROXY__` (`DefinePlugin`, `src/api/pokedex.ts` `POKEAPI_SOURCE`) and the dev server proxies `/pokeapi` to :3001. Restart the dev server to swap; proxied query keys get a trailing `"proxy"` so the persisted caches never mix and nothing needs clearing. Vitest, Storybook and e2e never define the flag. On startup the server evicts `api/.cache` files unused for 30 days (each hit refreshes its mtime, so anything still read is kept); override with `POKEAPI_CACHE_MAX_AGE_DAYS`.
- The dex query also carries base stats (`stats`, six numbers plus `statTotal` on `PokemonDetails`), evolution methods (`specs.evolution_methods`), `is_default` and the species id. `src/utils/evolution.ts` turns the evolution data into the lanes `EvolutionChain` renders. Changing the dex query shape requires bumping the `queryKey` (currently `["pokedex", "v5"]`) so the persisted cache is not reused. The dex JSON is ~960 KB. The React Query cache is persisted to IndexedDB (`src/utils/idbStorage.ts`, database `pokedex-cache`) rather than localStorage, so there is no ~5 MB quota; the old localStorage key is removed at startup. It includes the in-game (pixel) sprite URL (`inGameSprite`), so the detail page needs no extra request for it.
- Heavier per-pokémon data is fetched lazily on the detail page with `queryOptions` factories in `src/api/pokedex.ts`: `pokemonInfoQueryOptions` (size, abilities, entries, cry, species facts), and `typeEfficacyQueryOptions` (the 18×18 type chart, fetched once and shared by the matchups section and `/types`). The detail page debounces `pokemonInfoQueryOptions` (300 ms, `Pokemon.tsx`) so skimming with ←/→ does not send a request per stop (PokeAPI answers 429 Too Many Requests when hammered). Keep large datasets (moves, encounters) lazy.
- Theme: `data-theme="light|dark"` on `<html>`, set before first paint by an inline script in `public/index.html` and managed by `src/utils/useTheme.ts` (choice stored in localStorage under `theme`). Dark colors are token overrides in `src/styles/index.css`; the sidebar tokens are the same in both themes. Use tokens (`bg-surface`, `text-ink`, `shadow-hover` ...), not hex values.

## URL is the source of truth for Pokedex state

| Param | Meaning |
|---|---|
| `q` | search text (debounced 250ms before writing to URL; UI filters immediately with `useDeferredValue`) |
| `gen` | generation id 1-9 |
| `type` | comma-separated types |
| `only` | `legendary` or `mythical` |
| `sort` | `key:direction` (e.g., `id:asc`; keys include `total` and the six stats) |
| `view` | `list` for the table view; omitted for cards |

URL writes use `replace: true, preventScrollReset: true`. `Nav` preserves the query string on links. Navigating to a detail page passes `{ pokemon, previous: pathname + search }` in router state (`useNavigateToPokemon`) so back navigation returns to the exact same filters and query.

## Conventions

- PascalCase filenames, default-exported components, props inline-typed. Multi-file components are folders with `index.tsx`.
- React 19: `ref` is a plain prop, no `forwardRef`.
- Tailwind classes inline, `twMerge` so a `className` prop can override. Shared class strings are in `src/styles/*.ts`.
- Types live in `src/types/` (PascalCase files, imported via `@customTypes/...`).
- Pages (`src/pages`) default-export the component (they are lazy-loaded, so keep them default exports). Loaders for routes that share the dex live in `src/utils/pokedexLoader.ts`.

## Testing

- Vitest 4 in real Chromium (Playwright, headless): `react-virtualized` and axe color contrast need real layout. `vitest.config.mts` has two projects: `unit` (`*.test.ts(x)`, `vitest-browser-react`) and `storybook` (every `*.stories.tsx`, run through `@storybook/addon-vitest`). Rspack is untouched; Vite is only for tests and Storybook.
- Layout: every component and util is a folder. `Nav/index.tsx` + `Nav/Nav.test.tsx` + `Nav/Nav.stories.tsx`; `utils/sort/index.ts` + `utils/sort/sort.test.ts`. Import paths do not change (`@components/Nav`, `@utils/sort`). `src/components/__tests__/structure.test.ts` fails if a component or util lacks a test file, a component lacks stories, or a story lacks a `play` function that asserts.
- Every story runs its `play` function (interaction test) and an axe check (`@storybook/addon-a11y`). `.storybook/vitest.setup.ts` fails a story whose axe score (passes / (passes + violations)) is under 50%; `.storybook/a11yReporter.ts` prints every story's score after the run, labelled by project.
- Every story runs in both themes: `vitest.config.mts` has `storybook-light` and `storybook-dark` projects that differ only by `VITE_STORYBOOK_THEME`, which `.storybook/preview.tsx` turns into the `theme` global; a global decorator writes it to `data-theme` on `<html>`. In the Storybook UI the toolbar Theme menu switches it.
- Shared fixtures live in `src/components/__fixtures__/` (`makePokemon`, `DEX`, evolution lines, `TestRouter` memory router with a `LocationProbe` for asserting navigation). Sprites are inline SVG data URIs, so nothing touches the network.
- Dependencies are pre-bundled in `optimizeDeps.include` (`vitest.config.mts`). A dependency first seen mid-run makes Vite re-optimize and reload, which can duplicate React; add new runtime imports there if you see "Vite unexpectedly reloaded a test".
- Failure screenshots go to `__screenshots__/` (gitignored).
- E2E: `npm run e2e` (Playwright Test, Chromium, `e2e/*.spec.ts`; Vitest ignores `e2e/`). `playwright.config.ts` starts `npm run dev` on :3000, or reuses a server already running there. `e2e/mocks.ts` (`mockPokeApi`) answers the three GraphQL operations (`getPokedex`, `getPokemonInfo`, `getTypeEfficacy`) from a 22-pokémon dex and stubs sprites, so PokeAPI is never contacted. Each test has its own browser context, so the IndexedDB cache starts empty. Specs cover browse → detail → back, search/filter/sort, card ↔ list view, compare, the type chart and the detail page. The URL is percent-encoded (`sort=name%3Adesc`), so match `(:|%3A)` in URL regexes. The detail page's ←/→ handler re-registers after each render: wait for the adjacent-Pokémon buttons between key presses.

## Gotchas

- **Sort semantics**: Default sort is `id:asc` (Bulbasaur #1 first). Each comparator produces natural `"asc"` order; `"desc"` reverses it. Ties always fall back to ascending `id`. See `.claude/rules/utils.md`.
- **`Icons` vs `icons` casing**: The directory on disk is `src/components/Icons/`, but git tracks `src/components/icons/`. Imports use `@components/Icons/...`, which resolves on case-insensitive file systems (macOS) but fails on case-sensitive OS/CI environments (Linux).
- **`api/` server**: a small Express server (its own `package.json`; run `npm install` inside `api/`) that only hosts the optional PokeAPI proxy, no database. `api/` is tracked normally (only `/api/.cache` is gitignored, plus the generic `.env` and `node_modules` rules) and is linted and formatted by the root Biome. The old MongoDB routes and the `/teams` page were removed.

## Working agreements

- Run `npm run biome:lint`, `npm run type-check`, `npm run build`, and `npm run test:coverage` before calling work done.
- Don't push unless asked.
