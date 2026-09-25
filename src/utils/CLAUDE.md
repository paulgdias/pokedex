# Utils

Project-wide context is in the root `CLAUDE.md`. Import via `@utils/...`. Everything is a named export. Files are pure functions/constants, except `useNavigateToPokemon.ts` (a hook) and `routes.tsx` (router factory).

## Files

| File | Exports |
|---|---|
| `routes.tsx` | `createAppRouter(queryClient)`. `dataRoute()` adds loader, `errorElement`, `HydrateFallback`. Route ids `"pokedex"` / `"pokemon"` are relied on by `Nav` via `useRouteLoaderData`. |
| `generations.ts` | `GENERATIONS` (ids 1-9, roman numeral, region), `getGeneration`, `countByGeneration`, `Generation` type. |
| `pokemon.ts` | `convertToPokemonDetailsArray` (GraphQL `Pokemon` -> `PokemonDetails`), `withEvolutions` (sets each pokémon's `evolutions` to its whole chain, sorted by `_id`). |
| `search.ts` | Filters: `PokedexFilters`, `EMPTY_FILTERS`, `POKEMON_TYPES`, `CATEGORIES`, `getFiltersFromURLParams`, `withFilters`, `matchesText`, `applyFilters`. Suggestions: `getFilterSuggestions`, `getPokemonSuggestions`. Formatting: `capitalize`, `formatPokedexNumber` (formats to `#0001`). |
| `sort.ts` | `DEFAULT_SORT`, `sortPokemon`, `getNextSort`, `getSortFromURLParams`, `withSort`. |
| `useNavigateToPokemon.ts` | Custom hook returning `(event, pokemon) => void`. Navigates to `/pokedex/:pokemonName` with `{ pokemon, previous }` router state (`PokemonLocationState`) so back navigation preserves previous filters and scroll. |

## Semantics that are easy to get wrong

**Sort** (`sort.ts`)
- Each comparator produces the natural `"asc"` order (1->N, A->Z, legendaries first); `"desc"` is its reverse.
- `DEFAULT_SORT` is `id:asc`, i.e. Bulbasaur first.
- Ties always fall back to ascending `_id` (`|| a._id - b._id`), regardless of direction.
- `type` sort compares only primary type (`types[0]`).
- `getNextSort` flips direction only when the same key is chosen again while it is `asc`; a new key starts at `asc`.
- Sort keys are defined in `src/types/SortingTypes.ts` (`SORT_KEYS`).

**Text search** (`matchesText`)
- A numeric query, with or without a leading `#`, matches the dex number by prefix after stripping leading zeros (`007` matches 7, 70-79, 700+).
- Anything else is a case-insensitive substring match on the name (search text is trimmed and lowercased; names are stored lowercase).

**Filters** (`applyFilters`)
- Types OR together (any selected type matches). Text, generation, category, and types AND together.
- `category` is a single value (`legendary` or `mythical`), not both.
- Invalid or empty URL params are dropped silently (bad `gen`/`type`/`only`/`sort` fall back to defaults; empty values are deleted from the URL by `withFilters`).
- URL param names: `q`, `gen`, `type`, `only` (`search.ts`); `sort` (`sort.ts`).

**Suggestions**
- `getFilterSuggestions` needs at least 2 characters and returns types, then generations (matching region prefix, `gen N` or `genN`), then categories. Already-applied filters are excluded. Applying one clears the text (`patch` sets `text: ""`).
- `getPokemonSuggestions` searches the whole dex, ignoring current filters, and caps at 5 by default.

**Generations**
- To support a new generation, add it to `GENERATIONS`. `getFiltersFromURLParams` only accepts ids in that table, and `Nav` builds its links and counts from it.

**Two data shapes**
- GraphQL `Pokemon` uses `id` and `specs.*`; app `PokemonDetails` uses `_id`, `generationId`, etc. The `_id` name is inherited from the old Mongo API. Convert at the loader boundary with `pokemon.ts`; don't leak the GraphQL shape into components.

## Adding a filter or sort key

- **Sort key**: add it to `SORT_KEYS` (`src/types/SortingTypes.ts`), add a comparator in `sort.ts` (it must return the natural `asc` order), and add an entry to `SORT_OPTIONS` in `src/components/SearchBar/index.tsx`.
- **Filter**: extend `PokedexFilters` and `EMPTY_FILTERS`, then update `getFiltersFromURLParams`, `withFilters` and `applyFilters` in `search.ts`, and surface it in `SearchBar` / `FilterChips`. Keep URL param parsing tolerant (invalid -> default).
