# Project Structure

```
pokedex/
├── src/
│   ├── index.tsx               App entry point: QueryClient, persister, router, I18nProvider
│   ├── api/                    PokeAPI GraphQL layer
│   │   ├── pokedex.ts          Query documents, queryOptions factories, query key hashing
│   │   ├── pokedex.contract.ts Contract test helpers
│   │   └── allowedQueries.test.ts
│   ├── components/             Reusable UI components (see convention below)
│   │   ├── Buttons/
│   │   │   ├── Button/
│   │   │   └── ScrollTopButton/
│   │   ├── EvolutionChain/
│   │   ├── Icons/
│   │   │   ├── Logos/
│   │   │   └── Pokeball/
│   │   ├── LoadingSpinner/
│   │   ├── Nav/
│   │   ├── PageHeader/
│   │   ├── Panel/
│   │   ├── PokemonCard/
│   │   │   └── PlaceholderCard/
│   │   ├── PokemonDetail/      Components shown on the Pokemon detail page
│   │   │   ├── AbilityList/
│   │   │   ├── CryButton/
│   │   │   ├── InfoFacts/
│   │   │   ├── PokedexEntry/
│   │   │   ├── Section/
│   │   │   ├── StatBars/
│   │   │   └── TypeMatchups/
│   │   ├── PokemonList/        Card grid + sortable table
│   │   │   └── PokemonTable/
│   │   ├── SearchBar/          Search input, type filter, filter chips
│   │   │   ├── FilterChips/
│   │   │   └── TypeFilter/
│   │   ├── SectionLabel/
│   │   ├── SpriteToggle/
│   │   ├── ThemeToggle/
│   │   ├── __fixtures__/       Shared test fixtures (pokemon data, router wrapper, harnesses)
│   │   └── __tests__/          Cross-cutting structural tests (e.g. folder convention enforcement)
│   ├── pages/                  Route components (lazy-loaded by the router)
│   │   ├── Layout.tsx          Shell: Nav, Toaster, Outlet, loading overlay
│   │   ├── Home.tsx
│   │   ├── Pokedex.tsx         List page with search, filter, sort, view toggle
│   │   ├── Pokemon.tsx         Detail page
│   │   ├── Compare.tsx         Side-by-side comparison
│   │   └── TypeChart.tsx       Type effectiveness matrix
│   ├── styles/
│   │   ├── index.css           Tailwind entry, CSS custom properties, base styles
│   │   └── Pokedex.ts          Shared Tailwind class strings (e.g. type-colour mappings)
│   ├── types/                  TypeScript type definitions
│   │   ├── PokemonTypes.ts     Core domain types (PokemonDetails, PokemonInfo, etc.)
│   │   ├── PokemonCardTypes.ts
│   │   ├── SortingTypes.ts
│   │   └── assets.d.ts         Module declarations for image imports
│   └── utils/                  Pure helpers and hooks, each with a co-located test
│       ├── evolution/          Evolution chain building
│       ├── generations/        Generation metadata and lookup
│       ├── idbStorage/         IndexedDB adapter for TanStack Query persister
│       ├── pokedexLoader/      Shared route loader factory
│       ├── pokemon/            Raw API → domain type conversion
│       ├── routes/             Router creation and route definitions
│       ├── search/             Filter application and URL param serialisation
│       ├── sort/               Pokémon sort logic and URL param serialisation
│       ├── stats/              Stat helpers
│       ├── useNavigateToPokemon/ Hook for navigating to a Pokémon detail page
│       ├── useTheme/           Theme persistence and application
│       └── view/               View mode (grid / list) and URL param serialisation
├── api/                        Optional local PokeAPI caching proxy (Express)
├── e2e/                        Playwright end-to-end specs and PokeAPI mock
├── public/                     Static assets served as-is
├── .storybook/                 Storybook config and Vitest integration
├── .kiro/                      Kiro configuration
│   └── steering/               Steering documents (this folder)
├── biome.json                  Linter/formatter config
├── lefthook.yml                Git hook definitions
├── playwright.config.ts
├── postcss.config.ts
├── rspack.config.ts            Bundler config (dev server, aliases, DefinePlugin)
├── tsconfig.json
├── tsconfigAliases.cjs         Path alias definitions shared by rspack and ts
├── vitest.config.mts
└── vitest.setup.ts
```

## Component folder convention

Every component lives in its own folder under `src/components/`. The folder always contains:

- `index.tsx` — the component implementation and its named export
- `ComponentName.test.tsx` — Vitest browser tests (required; enforced by a structural test)
- `ComponentName.stories.tsx` — Storybook stories (run as Vitest tests)
- `ComponentName.mdx` — Storybook docs page

Optional:
- `utils.ts` / `utils.test.ts` — component-local helpers
- `__screenshots__/` — screenshot artefacts captured by browser tests
- `__snapshots__/` — Vitest HTML snapshots

## Path aliases

Defined in `tsconfigAliases.cjs` and applied to both TypeScript and Rspack:

| Alias            | Resolves to        |
| ---------------- | ------------------ |
| `@components/*`  | `src/components/*` |
| `@customTypes/*` | `src/types/*`      |
| `@utils/*`       | `src/utils/*`      |
| `@api/*`         | `src/api/*`        |

## Utils convention

Each utility module lives in its own folder under `src/utils/` and exports from `index.ts`. A co-located `<name>.test.ts` (or `.tsx`) covers it. Utilities are pure functions or hooks with no side effects on import.
