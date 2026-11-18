# Technology Stack and Patterns

## Core runtime

| Concern                 | Library                                                                            | Notes                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| UI framework            | React 19                                                                           | Functional components, hooks                                                             |
| Routing                 | React Router 7                                                                     | `createBrowserRouter`, nested routes, lazy pages                                         |
| Data fetching & caching | TanStack Query 5                                                                   | `queryOptions`, `ensureQueryData`, `staleTime: Infinity` for per-pokémon data            |
| Cache persistence       | `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister` | Persisted to IndexedDB (not localStorage) for quota headroom                             |
| GraphQL client          | `graphql-request`                                                                  | Used directly inside `queryFn`; no Apollo, no codegen                                    |
| Styling                 | Tailwind CSS 4                                                                     | Utility classes; shared class strings extracted to `src/styles/`                         |
| Accessible components   | React Aria Components 1                                                            | Buttons, combobox, tabs, toggles; `tailwindcss-react-aria-components` for state variants |
| Icons                   | Lucide React                                                                       |                                                                                          |
| Toast notifications     | Sonner                                                                             | Lazy-loaded in `Layout.tsx`                                                              |
| Virtualised list        | react-virtualized                                                                  | Used for the Pokémon card grid                                                           |
| Hooks utility           | `@uidotdev/usehooks`                                                               | `useDebounce`                                                                            |

## Build and tooling

| Concern              | Tool             | Notes                                                                        |
| -------------------- | ---------------- | ---------------------------------------------------------------------------- |
| Bundler              | Rspack 2         | Dev server on port 3000; `ts-checker-rspack-plugin` for type errors in dev   |
| Language             | TypeScript 7     | Strict; path aliases configured in `tsconfig.json` and `tsconfigAliases.cjs` |
| Linting & formatting | Biome 2          | Replaces ESLint and Prettier; `biome.json` at root                           |
| Git hooks            | Lefthook         | Pre-commit: Biome on staged files + type-check. Pre-push: `npm run verify`   |
| Node requirement     | ≥22.18 or ≥24.11 | `.nvmrc` provided                                                            |
| Package manager      | npm 10           | `package-lock.json` committed                                                |

## Testing

| Layer             | Tool                                 | Notes                                                                   |
| ----------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| Unit / component  | Vitest 5 + vitest-browser-react      | Tests run in real Chromium via Playwright; `vitest.config.mts`          |
| Visual regression | Vitest browser screenshots           | `__screenshots__/` folders next to test files                           |
| Snapshot          | Vitest snapshots                     | `__snapshots__/` folders                                                |
| Component docs    | Storybook 10                         | Stories run as Vitest tests via `@storybook/addon-vitest`               |
| End-to-end        | Playwright 1                         | PokeAPI mocked; starts its own dev server on port 3100; specs in `e2e/` |
| Coverage          | `@vitest/coverage-v8`                | 90% threshold for statements, branches, functions, and lines            |
| Contract          | Separate Vitest project (`contract`) | Run with `npm run test:contract`; hits the real PokeAPI                 |

## Key patterns

### Route-level data loading

Page components are lazy-loaded with `lazy()` in `src/utils/routes/index.tsx`. Each data route specifies a `loader` that starts fetching immediately (via `queryClient.ensureQueryData`), so the data fetch and the page chunk download overlap. Routes that need the full Pokédex share a single `pokedexLoader` factory.

### Cache-first on reload

`cacheRestored` is a `Promise` resolved by the `PersistQueryClientProvider`'s `onSuccess`/`onError` callbacks. `pokedexLoader` awaits it before calling `ensureQueryData`, so the first load after a reload reads from IndexedDB rather than re-fetching the whole dex.

### URL-first state

Filters, sort order, and view mode are stored exclusively in URL search params. Local `useState` is used only for the search text input (to give instant feedback), with a debounce that writes back to the URL. `useNavigationType` detects browser back/forward and re-syncs local text from the URL.

### Query key stability

`src/api/pokedex.ts` hashes each GraphQL document string (FNV-1a) and includes the hash in the query key. Editing a query automatically invalidates its persisted cache entry without a manual version bump.

### Proxy mode

Setting `POKEAPI_PROXY=1` at build time (via Rspack `DefinePlugin`) switches the GraphQL endpoint to the local Express proxy at `/pokeapi/graphql`. The proxy-mode cache is keyed separately so proxied and upstream responses never collide.

### Accessible UI

Interactive controls use React Aria Components rather than plain HTML elements, ensuring keyboard navigation and ARIA semantics are correct by default. Tailwind classes for Aria states (pressed, disabled, selected, etc.) are applied via `tailwindcss-react-aria-components`.

### Theme

Theme preference (light / dark / system) is stored in `localStorage`, applied to the `<html>` element as a class, and initialised synchronously before first render via `initTheme()` in `src/index.tsx` to avoid a flash of unstyled content.
