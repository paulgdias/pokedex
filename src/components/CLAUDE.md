# Components

Project-wide context is in the root `CLAUDE.md`. Data/filter/sort logic lives in `src/utils` (see `src/utils/CLAUDE.md`); components mostly render and wire it up.

## Inventory

| Path | Purpose |
|---|---|
| `Nav.tsx` | Sidebar (desktop) / top bar (mobile): logo, nav items, generation links with per-generation counts. Reads loader data via `useRouteLoaderData` (route ids `"pokedex"`, `"pokemon"`). |
| `LoadingSpinner.tsx` | Spinning Pokeball animation; used as the router `HydrateFallback`. |
| `Buttons/ScrollTopButton.tsx` | Fixed "scroll to top" button (`onPress`). |
| `Icons/Pokeball.tsx`, `Icons/Logos.tsx` | SVG icons; `Logos` also exports `githubUrl` / `linkedinUrl`. *(Note: directory is `Icons/` on disk but tracked as `icons/` in git).* |
| `PokemonCard/index.tsx` | Card: official art (with `preload` hint), dex number watermark, type pills, legendary/mythical badge. Supports `size="large" \| "default"`. When `navigateCallback` is passed, wraps in an `<a>` tag for accessibility/links while triggering the callback. Prop types in `@customTypes/PokemonCardTypes`. |
| `PokemonCard/PlaceholderCard.tsx` | Skeleton card reusing the card classes; optional `animated`. |
| `PokemonList/index.tsx` | Virtualized grid (`react-virtualized` `Grid` + `AutoSizer`). Pulls `-mr-4` to absorb trailing grid gap. Scrolls to top when the list changes. `isLoading` renders placeholder cards. |
| `PokemonList/utils.ts` | `getPokemonGridProps`: column/row math (gap 16, min card width 190, card height 232, overscan 2). Keep card height in sync with `PokemonCard`. |
| `SearchBar/index.tsx` | Toolbar: search combobox with keyboard-navigable suggestions (ArrowUp/ArrowDown, Enter, Esc), sort select, generation dropdown (mobile), category toggle, result count. Owns `SORT_OPTIONS`. |
| `SearchBar/FilterChips.tsx`, `SearchBar/TypeFilter.tsx` | Active-filter chips and the multi-select type filter popover. |

## Conventions

- Default export per component; PascalCase filenames; folder + `index.tsx` when a component has sub-parts.
- Cross-folder imports use `@components/...`; siblings use relative paths.
- Props are typed inline unless shared (`PokemonCard`).
- `react-aria-components` (`Button`, `ToggleButton`, `ToggleButtonGroup`) for interactive primitives; icons from `lucide-react`.
- React 19: `ref` is passed directly as a prop (no `forwardRef`).

## Styling

- Tailwind utilities inline; `twMerge` so callers can override via `className`.
- Shared class strings: `src/styles/Pokedex.ts`, `src/styles/Carousel.ts`.
- Tokens (in `src/styles/index.css` `@theme`): `paper`, `surface`, `sand`, `track`, `chip`, `chip-hover`, `wash`, `ink`, `muted`, `subtle`, `line`, `line-strong`, `accent`, `accent-strong`, `sidebar-*`, and one color per Pokémon type (`bg-fire`, ...). Fonts: `font-display`, `font-sans`, `font-mono`.
- `typeColors` in `@customTypes/PokemonTypes` maps type name -> `bg-*` class and is also the source of the type list (`POKEMON_TYPES`). Adding a type color requires both the map entry and the `@theme` token in `src/styles/index.css`.
- `.pokedex-scroll` styles scrollbars for the virtualized grid and overflow containers.

## Loading, empty, error states

- Route loading: `LoadingSpinner` via `HydrateFallback`. The loader awaits data, so `PlaceholderCard` / `isLoading` in `PokemonList` are currently not hit during initial route hydration on the Pokedex page.
- Empty results: inline `EmptyState` in `src/pages/Pokedex.tsx`.
- Errors: `ErrorBoundary` in `Layout` (around the outlet) and around the list in `Pokedex` and `Teams`. Toasts via `sonner`.

## Adding a component

1. Create `Name.tsx` (or `Name/index.tsx`), default export, Tailwind + `twMerge`.
2. Use react-aria primitives for anything interactive to preserve accessibility and keyboard behavior.
3. Put filtering/sorting/URL logic in `src/utils`, not inside the component.
4. Run `npm run biome:lint`, `npm run type-check`, and `npm run build`.
