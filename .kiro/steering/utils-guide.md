---

inclusion: fileMatch
fileMatchPattern: "src/utils/**"
---

# Utils Guide

Each util is a folder: `name/index.ts(x)` with `name/name.test.ts(x)` beside it. All exports are named. Files are pure functions/constants, except `useNavigateToPokemon` (a hook) and `routes` (router factory). Import via `@utils/...`.

## Module inventory

| Module                  | Exports and purpose                                                                                                                                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pokedexLoader/`        | `pokedexLoader(queryClient)`: loader shared by `/pokedex`, `/pokedex/:pokemon`, and `/compare`. Fetches from the query cache → `PokemonDetails[]` with evolutions. Kept outside lazy pages so it starts immediately.                                                                                  |
| `routes/`               | `createAppRouter(queryClient)`. `dataRoute()` takes a page import (`() => import(...)`), loader, `errorElement`, and `HydrateFallback`. Home and Layout are in the entry chunk. Route ids `"pokedex"` / `"pokemon"` are relied on by `Nav` via `useRouteLoaderData`.                                  |
| `generations/`          | `GENERATIONS` (ids 1-9, roman numeral, region name), `getGeneration`, `countByGeneration`, `Generation` type.                                                                                                                                                                                         |
| `pokemon/`              | `convertToPokemonDetailsArray` (GraphQL `Pokemon` → `PokemonDetails`, including `stats` / `statTotal`), `convertToPokemonInfo` (lazy detail query → `PokemonInfo`), `withEvolutions` (sets each Pokémon's `evolutions` to its whole chain, sorted by `id`).                                           |
| `evolution/`            | `getPokemonForm` (name → `mega` / `gmax` / region / `other`), `formatEvolutionMethod` (PokeAPI row → label such as `Lv. 16`), `buildEvolutionLanes` (chain → lanes of ordered stages).                                                                                                                |
| `search/`               | Types: `PokedexFilters`, `EMPTY_FILTERS`, `POKEMON_TYPES`, `CATEGORIES`. URL: `getFiltersFromURLParams`, `withFilters`. Filtering: `matchesText`, `applyFilters`. Suggestions: `getFilterSuggestions`, `getPokemonSuggestions`. Formatting: `capitalize`, `formatPokedexNumber` (formats to `#0001`). |
| `sort/`                 | `DEFAULT_SORT`, `sortPokemon`, `getNextSort`, `getSortFromURLParams`, `withSort`, `getSortLabel`.                                                                                                                                                                                                     |
| `stats/`                | `STAT_LABELS`, `MAX_STAT`, `TYPE_ORDER`; formatters (`formatName`, `formatFlavorText`, `formatHeight`, `formatWeight`, `getFemaleShare`); `getTypeMatchups` (a defender's damage taken, dual types multiplied), `getOffense` (what an attacker hits), `describeMatchup` (one-line summary).           |
| `view/`                 | `PokedexView` (`cards` / `list`), `getViewFromURLParams`, `withView` (URL param `view`).                                                                                                                                                                                                              |
| `idbStorage/`           | `idbStorage` (async `getItem` / `setItem` / `removeItem` on IndexedDB, failures swallowed) and `removeLegacyLocalStorageCache`.                                                                                                                                                                       |
| `useTheme/`             | `useTheme` (preference `light` / `dark` / `system`, resolved theme, setter) and `initTheme` (call once at startup; follows OS changes while on `system`).                                                                                                                                             |
| `useNavigateToPokemon/` | Hook returning `(event, pokemon) => void`. Navigates to `/pokedex/:pokemonName` with `{ pokemon, previous }` in router state so back navigation preserves filters and scroll.                                                                                                                         |

## Semantics that are easy to get wrong

### Sort

- Each comparator produces natural `"asc"` order (1→N, A→Z, legendaries first); `"desc"` reverses it.
- `DEFAULT_SORT` is `id:asc` (Bulbasaur first).
- Ties always fall back to ascending `id` (`|| a.id - b.id`), regardless of direction.
- `type` sort compares only the primary type (`types[0]`).
- `getNextSort` flips direction only when the same key is chosen again while already `asc`; a new key always starts `asc`.
- Stat/total columns in the list view start `desc` on first click.
- Sort keys are in `src/types/SortingTypes.ts` (`SORT_KEYS`; `STAT_SORT_KEYS` maps to indexes of `PokemonDetails.stats`).

### Text search

- A numeric query (with or without a leading `#`) matches the dex number by prefix after stripping leading zeros (`007` matches 7, 70-79, 700+).
- Anything else is a case-insensitive substring match on the name (search text is trimmed and lowercased; names are stored lowercase).

### Filters

- Types OR together (any selected type matches). Text, generation, category, and types AND together.
- `category` is a single value (`legendary` or `mythical`), not both at once.
- Invalid or empty URL params are dropped silently (bad `gen`/`type`/`only`/`sort` fall back to defaults; empty values are deleted from the URL by `withFilters`).
- URL param names: `q`, `gen`, `type`, `only` (`search`); `sort` (`sort`); `view` (`view`).

### Suggestions

- `getFilterSuggestions` needs at least 2 characters and returns types → generations (matching region prefix, `gen N`, or `genN`) → categories. Already-applied filters are excluded. Applying a suggestion clears the text (`patch` sets `text: ""`).
- `getPokemonSuggestions` searches the whole dex ignoring current filters, capped at 5 by default.

### Evolution lanes

- PokeAPI stores evolutions per species, not per form. `speciesId` groups a species' forms; `evolvesFromId` is a species id.
- Stage = depth via `evolvesFromId`. Mega/Gmax forms become `forms` of their species' step (default lane only); other alternates (costumes, `other`) are dropped.
- A regional form is a name ending in the region (`meowth-alola`; `pikachu-alola-cap` is a costume). A species that debuted in a region's generation (or later) and evolves from a species with that regional form belongs to that region's lane. The latest matching region wins.
- With several evolution rows on a species, lane N uses row N (Persian: row 0 Kanto, row 1 Alola), falling back to row 0. This is a heuristic — check unusual chains.

### Generations

- To support a new generation, add it to `GENERATIONS`. `getFiltersFromURLParams` only accepts ids in that table, and `Nav` builds its links and counts from it.

### Two data shapes

- GraphQL `Pokemon` uses `id` and `specs.*`; app `PokemonDetails` is a flat shape. Convert at the loader boundary with `pokemon/`; don't leak the GraphQL shape into components.

## Adding a filter or sort key

**Sort key**: add to `SORT_KEYS` in `src/types/SortingTypes.ts`, add a comparator in `sort/` (must return natural `asc` order), add an entry to `SORT_OPTIONS` in `src/components/SearchBar/index.tsx`.

**Filter**: extend `PokedexFilters` and `EMPTY_FILTERS`, then update `getFiltersFromURLParams`, `withFilters`, and `applyFilters` in `search/`, and surface it in `SearchBar` / `FilterChips`. Keep URL param parsing tolerant (invalid → default).

## Testing utils

A util's test is the single owner of its rules. Use fixtures where each branch matters, do not assert constants the type checker already guarantees, and do not test states the loader cannot produce. See "Writing tests" in `testing-standards.md`.
