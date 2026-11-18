---

inclusion: fileMatch
fileMatchPattern: "src/pages/**"
---

# Pages Guide

Pages are route components in `src/pages/`. They are **default exports** — the router lazy-loads them with `() => import("../../pages/X")`, so a named export would not be picked up. Keep them as default exports.

Data for pages that need the full Pokédex is provided by the shared `pokedexLoader` in `src/utils/pokedexLoader/`. The loader is passed to the route statically (not inside the lazy import) so fetching starts while the page chunk downloads.

## Route map

| Page            | Path                | Needs dex loader | Purpose                                            |
| --------------- | ------------------- | ---------------- | -------------------------------------------------- |
| `Layout.tsx`    | `/` (wrapper)       | No               | Shell: `Nav`, `Toaster`, `Outlet`, loading overlay |
| `Home.tsx`      | `/` (index)         | No               | Profile card and entry point                       |
| `Pokedex.tsx`   | `/pokedex`          | Yes              | Full list with search, filter, sort, view toggle   |
| `Pokemon.tsx`   | `/pokedex/:pokemon` | Yes              | Detail page                                        |
| `Compare.tsx`   | `/compare`          | Yes              | Side-by-side stat comparison (up to 3)             |
| `TypeChart.tsx` | `/types`            | No               | 18×18 type effectiveness matrix                    |

Route ids `"pokedex"` and `"pokemon"` are significant — `Nav` reads loader data from both via `useRouteLoaderData`.

## URL search params (Pokédex)

All Pokédex filter, sort, and view state lives in URL params. Every write uses `{ replace: true, preventScrollReset: true }`.

| Param  | Values                                      | Meaning                                                                                                                                                                                        |
| ------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `q`    | string                                      | Search text. Debounced 250ms before writing to URL; UI filters immediately via `useDeferredValue`. On browser back/forward (`useNavigationType === "POP"`), local state re-syncs from the URL. |
| `gen`  | 1–9                                         | Generation filter                                                                                                                                                                              |
| `type` | comma-separated type names                  | Type filter (OR logic)                                                                                                                                                                         |
| `only` | `legendary` or `mythical`                   | Category filter                                                                                                                                                                                |
| `sort` | `key:direction` e.g. `id:asc`, `total:desc` | Sort state                                                                                                                                                                                     |
| `view` | `list` (omit for cards)                     | Card grid vs. sortable table                                                                                                                                                                   |

## Page-specific patterns

### Pokedex (`Pokedex.tsx`)

- Receives the full `PokemonDetails[]` from `useLoaderData`.
- Filtering and sorting run entirely in the browser (`applyFilters`, `sortPokemon` from `@utils/search` and `@utils/sort`).
- `useDeferredValue` on filters keeps the UI responsive while the list re-renders.
- Preconnects to `https://graphql.pokeapi.co` and `https://raw.githubusercontent.com/` to warm the sprite CDN connection.
- Empty results show an inline `EmptyState` component (defined in the same file).

### Pokemon (`Pokemon.tsx`)

- Navigates to `/pokedex` (replace) if the Pokémon name from the URL is not found in the loaded dex.
- Prev/next neighbours are computed from default-form Pokémon sorted by `id`. Alternate forms share their base form's position.
- ←/→ keyboard navigation uses `useEffectEvent` and skips when the target is a text input or the key has modifier keys. Held keys use `replace: true` to avoid stacking history entries.
- **Info request debounce**: `pokemonInfoQueryOptions` is enabled only when `useDebounce(id, 300)` has settled on the current Pokémon's id. This prevents a request per stop when skimming with ←/→ or the evolution chain. Cached data still shows immediately.
- `typeEfficacyQueryOptions` is fetched eagerly (no debounce) since it is shared across pages and cached after the first load.
- Passes `{ pokemon, previous }` in router state when navigating to Compare, so Back from Compare returns to the detail page rather than the Pokédex list.
- Preconnects to `https://graphql.pokeapi.co` and `https://raw.githubusercontent.com/`.
- Preloads the in-game sprite with `preload(inGameSprite, { as: "image" })` when it exists.
- Scrolls to top on Pokémon change via a `ref` on the scroll container.

### Compare (`Compare.tsx`)

- Selected Pokémon ids are stored in the `ids` URL param (comma-separated integers, max 3, deduplicated).
- `pokemonInfoQueryOptions` is fetched for each selected Pokémon via `useQueries`.
- Info cells show `…` while loading and `—` on error.
- The highest value in each stat row is highlighted in accent (only when values actually differ).
- Preserves `state.previous` when updating the `ids` param so editing the selection doesn't lose where the user came from.
- Preconnects to `https://graphql.pokeapi.co` and `https://raw.githubusercontent.com/`.

### Layout (`Layout.tsx`)

- The loading overlay appears on `<main>` when `useNavigation().state === "loading"` and the destination pathname differs from the current one. It fades in after 200ms so cached navigations don't flash it.
- `Toaster` (Sonner) is lazy-loaded to keep the entry chunk lean.
- `useTheme` is called here to keep the resolved theme in sync for the Toaster's `theme` prop.

### Home (`Home.tsx`)

- No dex data needed. Preloads the profile image with `preload(logo, { as: "image" })`.
- Uses `buttonClass` from `@components/Buttons/Button/utils` on a `<Link>` to style it as a primary button without using `<Button>` (which renders a `<button>`, not an anchor).
