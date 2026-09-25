# Pokedex

React 19 Pokédex practice app (a testbed for libraries and patterns). Client-side only; all data comes from the PokeAPI GraphQL endpoint (`https://beta.pokeapi.co/graphql/v1beta`). Official artwork sprites are loaded from GitHub's CDN (`https://raw.githubusercontent.com/`).

Scoped docs: [`src/components/CLAUDE.md`](src/components/CLAUDE.md), [`src/utils/CLAUDE.md`](src/utils/CLAUDE.md).

## Commands

- `npm run dev`: rspack dev server on port 3000 (also type-checks via `TsCheckerRspackPlugin`).
- `npm run build`: production build to `dist/` (gitignored). `npm start` serves the production build.
- `npm run type-check`: `tsc --noEmit`
- `npm run biome:lint` / `npm run biome:lint:fix`: Biome linter over `src`.
- `npm run biome:format`: Biome formatter over `src`. Style: 4 spaces, double quotes, semicolons, width 80, ES5 trailing commas.
- `npm run biome:check:fix`: Biome linter, formatter, and organize-imports with safe auto-fixes over `src`.
- There are no automated tests. Verify changes with `npm run biome:lint`, `npm run type-check`, and `npm run build`.

## Stack

React 19, react-router 7 (data router), TanStack Query 5 (cache persisted to localStorage, 1 day), Tailwind 4, react-aria-components, lucide-react, sonner (toasts), react-virtualized, react-error-boundary, Rspack, Biome.

Tailwind theme tokens live in the `@theme` block of `src/styles/index.css`. `tailwind.config.ts` is not where the theme is defined.

## Path aliases

`@api`, `@components`, `@styles`, `@customTypes` (-> `src/types`), `@utils`. They are declared in **both** `tsconfig.json` and `rspack.config.ts`; add new ones to both.

## Data flow

`src/index.tsx` (providers) -> `createAppRouter` in `src/utils/routes.tsx` -> route loaders call `queryClient.ensureQueryData(pokedexQueryOptions)` (`src/api/pokedex.ts`) -> `convertToPokemonDetailsArray` + `withEvolutions` (`src/utils/pokemon.ts`) -> pages read `useLoaderData`.

- The whole dex is fetched once; search, filter, and sort all run client-side in memory.
- Route ids `"pokedex"` and `"pokemon"` matter: `Nav` reads them with `useRouteLoaderData`.
- `/pokedex` and `/pokedex/:pokemon` share the same loader.
- Sprite preconnections: `Pokedex.tsx` and `Pokemon.tsx` preconnect to `https://beta.pokeapi.co` and `https://raw.githubusercontent.com/`.

## URL is the source of truth for Pokedex state

| Param | Meaning |
|---|---|
| `q` | search text (debounced 250ms before writing to URL; UI filters immediately with `useDeferredValue`) |
| `gen` | generation id 1-9 |
| `type` | comma-separated types |
| `only` | `legendary` or `mythical` |
| `sort` | `key:direction` (e.g., `id:asc`) |

URL writes use `replace: true, preventScrollReset: true`. `Nav` preserves the query string on links. Navigating to a detail page passes `{ pokemon, previous: pathname + search }` in router state (`useNavigateToPokemon`) so back navigation returns to the exact same filters and query.

## Conventions

- PascalCase filenames, default-exported components, props inline-typed. Multi-file components are folders with `index.tsx`.
- React 19: `ref` is a plain prop, no `forwardRef`.
- Tailwind classes inline, `twMerge` so a `className` prop can override. Shared class strings are in `src/styles/*.ts`.
- Types live in `src/types/` (PascalCase files, imported via `@customTypes/...`).
- Pages (`src/pages`) default-export the component and, for data routes, a `loader(queryClient)` factory.

## Gotchas

- **Sort semantics**: Default sort is `id:asc` (Bulbasaur #1 first). Each comparator produces natural `"asc"` order; `"desc"` reverses it. Ties always fall back to ascending `_id`. See `src/utils/CLAUDE.md`.
- **`Icons` vs `icons` casing**: The directory on disk is `src/components/Icons/`, but git tracks `src/components/icons/`. Imports use `@components/Icons/...`, which resolves on case-insensitive file systems (macOS) but fails on case-sensitive OS/CI environments (Linux).
- **`api/` & Teams route**: `api/` is a legacy Express + MongoDB server. The root `/api` is in `.gitignore` (anchored, so it does not match `src/api/`) but its files are tracked in git. The Pokédex itself does not use it. The `/teams` route exists in `src/utils/routes.tsx` but is hidden in `Nav.tsx` because it requires the local Express server on `http://localhost:3001`.
- **`postcss.config.ts`**: points at `./tailwindcss-config.ts`, which does not exist (Tailwind 4 uses `@theme` in CSS).

## Working agreements

- Run `npm run biome:lint`, `npm run type-check`, and `npm run build` before calling work done.
- Don't push unless asked.
