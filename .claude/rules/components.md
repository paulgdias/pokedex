---
paths:
  - "src/components/**"
---

# Components

Project-wide context is in the root `CLAUDE.md`. Data/filter/sort logic lives in `src/utils` (see the `utils` rule, `.claude/rules/utils.md`); components mostly render and wire it up.

## Inventory

| Path | Purpose |
|---|---|
| `Nav/` | Sidebar (desktop) / top bar (mobile): logo, nav items (Home, Pokédex, Compare, Type chart), theme toggle, generation links with per-generation counts. Reads loader data via `useRouteLoaderData` (route ids `"pokedex"`, `"pokemon"`). |
| `LoadingSpinner/` | Spinning Pokeball animation; used as the router `HydrateFallback`. |
| `Buttons/ScrollTopButton/` | Fixed "scroll to top" button (`onPress`). |
| `Icons/Pokeball/`, `Icons/Logos/` | SVG icons; `Logos` also exports `githubUrl` / `linkedinUrl`. *(Note: directory is `Icons/` on disk but tracked as `icons/` in git).* |
| `PokemonCard/` | Card: official art (with `preload` hint), dex number watermark, type pills, legendary/mythical badge. Supports `size="large" \| "default"`. Optional `sprite` prop overrides the image and `children` render as an overlay in the art area (used by the detail page for `SpriteToggle`). When `navigateCallback` is passed, wraps in an `<a>` tag for accessibility/links while triggering the callback. Prop types in `@customTypes/PokemonCardTypes`. |
| `PokemonCard/PlaceholderCard/` | Skeleton card reusing the card classes; optional `animated`. |
| `PokemonList/` | Virtualized grid (`react-virtualized` `Grid` + `AutoSizer`). Pulls `-mr-4` to absorb trailing grid gap. Scrolls to top when the list changes. `isLoading` renders placeholder cards. |
| `PokemonList/PokemonTable/` | List view: virtualized table (`react-virtualized` `List`) with sortable column headers (`aria-sort`), type dots and the six stats plus total (stats hidden below `md`). ARIA: `table` > `rowgroup` > `row` > `cell`; the `List` sets `containerRole="presentation"` and `aria-readonly={null}` because `aria-readonly` is invalid on a rowgroup. The name link is stretched over the row (`after:absolute after:inset-0`). |
| `PokemonList/utils.ts` | `getPokemonGridProps`: column/row math (gap 16, min card width 190, card height 232, overscan 2). Keep card height in sync with `PokemonCard`. |
| `EvolutionChain/` | Evolution chain on the detail page: compact cards in stages joined by arrows with trigger pills (`Lv. 16`), a dashed "Other forms" box for Mega/Gigantamax, and one lane per regional variant (Alola, Galar, ...). The current pokémon or form gets the accent border and `aria-current`. Stacks vertically below `md`. Data comes from `buildEvolutionLanes` (`@utils/evolution`). |
| `SpriteToggle/` | "Artwork" / "In-Game" segmented control (react-aria `ToggleButtonGroup`) overlaid on the detail page's large card. "In-Game" is the 96px pixel sprite (`front_default`), drawn by `PokemonCard` with `pixelated` (`image-rendering: pixelated`, at 2× so pixels stay whole); disabled when the pokémon has no such sprite. |
| `ThemeToggle/` | Light / system / dark control (`useTheme`); lives in the sidebar and the mobile top bar, styled with the (theme-independent) sidebar tokens. |
| `PokemonDetail/*` | Detail-page sections: `Section` (+ `InfoSection`, which shows loading/error for the lazy info query), `StatBars`, `AbilityList`, `PokedexEntry` (game-version select), `CryButton`, `InfoFacts`, `TypeMatchups`. The detail page tints its header and the large card's art by the pokémon's types (`--card-art`, `color-mix` against the theme tokens); `←` / `→` keys and the header buttons move between neighbours in national dex order. |
| `SearchBar/` | Toolbar: search combobox with keyboard-navigable suggestions (ArrowUp/ArrowDown, Enter, Esc), sort select (its leading icon mirrors the active sort), generation dropdown (mobile), category toggle, result count. Owns `SORT_OPTIONS`. |
| `SearchBar/FilterChips/`, `SearchBar/TypeFilter/` | Active-filter chips and the multi-select type filter popover. |

## Conventions

- Default export per component; PascalCase names; every component is a folder: `Name/index.tsx`, `Name/Name.test.tsx`, `Name/Name.stories.tsx`, `Name/Name.mdx` (hand-written docs page). Sub-components nest as folders (`PokemonCard/PlaceholderCard/`); non-component helpers sit beside `index.tsx` with their own test (`PokemonList/utils.ts`, `utils.test.ts`).
- Cross-folder imports use `@components/...`; siblings use relative paths.
- Props are typed inline unless shared (`PokemonCard`).
- `react-aria-components` (`Button`, `ToggleButton`, `ToggleButtonGroup`) for interactive primitives; icons from `lucide-react`.
- React 19: `ref` is passed directly as a prop (no `forwardRef`).

## Styling

- Tailwind utilities inline; `twMerge` so callers can override via `className`.
- Shared class strings: `src/styles/Pokedex.ts`, `src/styles/Carousel.ts`.
- Tokens (in `src/styles/index.css` `@theme`): `paper`, `surface`, `sand`, `track`, `chip`, `chip-hover`, `wash`, `ink`, `muted`, `subtle`, `line`, `line-strong`, `accent`, `accent-strong`, `sidebar-*`, and one color per Pokémon type (`bg-fire`, ...). Fonts: `font-display`, `font-sans`, `font-mono`.
- `typeColors` in `@customTypes/PokemonTypes` maps type name -> `bg-*` class and is also the source of the type list (`POKEMON_TYPES`). Adding a type color requires both the map entry and the `@theme` token in `src/styles/index.css`.
- Focus: the global `:focus-visible` outline (accent, `src/styles/index.css`) is drawn outside the element, so inside scroll containers (`Nav` generation list, virtualized grid) it is clipped or overlaps neighbours. Nav rows use `focus-visible:-outline-offset-2`; cards draw a 2px `::after` border instead (see `cardClass`).
- `.pokedex-scroll` styles scrollbars for the virtualized grid and overflow containers.

## Loading, empty, error states

- Route loading: `LoadingSpinner` via `HydrateFallback`. The loader awaits data, so `PlaceholderCard` / `isLoading` in `PokemonList` are currently not hit during initial route hydration on the Pokedex page.
- Empty results: inline `EmptyState` in `src/pages/Pokedex.tsx`.
- Errors: `ErrorBoundary` in `Layout` (around the outlet) and around the list in `Pokedex` and `Teams`. Toasts via `sonner`.

## Adding a component

1. Create `Name/index.tsx`, default export, Tailwind + `twMerge`, plus `Name/Name.test.tsx` (behavior, callbacks, edge cases), `Name/Name.stories.tsx` (at least one story with a `play` function that asserts; it also gets the axe check) and `Name/Name.mdx` (`<Meta of={Stories} />`, a short description, behaviour, props via `<ArgTypes of={Stories} />`, and a `<Canvas>` per story; point `<ArgTypes of={Component} />` at the real component when the story's `component` is a wrapper, and hand-write the props as an HTML `<table>` when the props type lives in `src/types`, as for `PokemonCard`; Storybook's MDX has no GFM, so `| pipe |` tables render as plain text). `__tests__/structure.test.ts` enforces this.
2. Use react-aria primitives for anything interactive to preserve accessibility and keyboard behavior.
3. Put filtering/sorting/URL logic in `src/utils`, not inside the component.
4. Run `npm run biome:lint`, `npm run type-check`, `npm run build`, and `npm run test:coverage`.
