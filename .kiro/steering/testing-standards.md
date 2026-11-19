# Testing Standards

## Test runner and environment

All unit and component tests run in real Chromium (headless) via Vitest + Playwright. Vite handles the test build; Rspack is not involved. `vitest.config.mts` defines four test projects:

| Project                              | What it covers           | Environment                           |
| ------------------------------------ | ------------------------ | ------------------------------------- |
| `unit`                               | `src/**/*.test.{ts,tsx}` | Real Chromium (vitest-browser-react)  |
| `api`                                | `api/src/**/*.test.js`   | Node (no browser)                     |
| `storybook-light` / `storybook-dark` | Every `*.stories.tsx`    | Real Chromium, theme injected         |
| `contract`                           | `src/**/*.contract.ts`   | Node; opt-in via `POKEAPI_CONTRACT=1` |

The browser is required because `react-virtualized` measures its container and axe needs real styles to judge colour contrast.

## Commands

- `npm test` — all projects (unit + both storybook themes)
- `npm run test:coverage` — same with v8 coverage; fails under 90% for statements, branches, functions, and lines
- `npm run test:contract` — contract tests against the live PokeAPI (network required)
- `npm run e2e` — Playwright end-to-end tests
- `npm run storybook` — Storybook UI on port 6006

## Coverage thresholds

90% for statements, branches, functions, and lines across `src/components/**` and `src/utils/**`. Stories and test files are excluded from coverage. The Express proxy (`api/src/pokeapiProxy.js`) is included.

## Component tests

Component tests live in `ComponentName.test.tsx` next to `index.tsx`. They are enforced: `src/components/__tests__/structure.test.ts` fails the suite if a component or util is missing a test file.

Use `vitest-browser-react` to render components. Prefer `getByRole`, `getByText`, and `getByLabelText` locators; locator matching is case-insensitive and substring-based (`locators: { exact: false }`).

Wrap components that need routing in the shared `TestRouter` from `src/components/__fixtures__/router.tsx`. It creates a memory data router and renders a `LocationProbe` alongside the component, so tests can assert navigation outcomes without inspecting the browser URL.

Use `makePokemon`, `DEX`, `makeDex`, `makeInfo`, and the named evolution lines from `src/components/__fixtures__/pokemon.ts` for test data. Sprites are inline data URIs — no test or story should request the network.

## Writing tests

Each test must be able to fail for a real regression.

- **Split by kind.** Stories own what a viewer sees per state (computed style, size, text, aria state); they also carry axe in both themes. `.test.tsx` owns logic, callbacks, keyboard paths and edge cases. A check present in both stays on the stronger side. Stories do not assert callback payloads; tests do not re-check what a story shows. When a story is moved or removed, update its `.mdx` page.
- **One owner per rule.** A `src/utils/*` test owns the semantics (sort order, filters, matchup math). A component test covers only what the component adds: wiring, what it passes, what it does with the result. A caller's job (for example the Pokédex page passing the whole dex to `SearchBar`) is tested at the caller or in e2e.
- **Avoid** class-list tests that copy the implementation, restated constants, markup snapshots, library behavior (a router following a link, react-aria basics) and states the UI cannot reach (a stray `<option>`, a missing required field).
- **A negative test must act.** "Does not call X" presses or triggers first, otherwise it passes on a no-op. A test name claims only what its assertions check.
- **Deleting is fine.** Never delete the only guard of a real contract, and do not offset new tests by dropping an independent one. A test cleanup is net-negative in lines unless the PR body justifies growth.

## Screenshots

Browser tests can capture screenshots for visual assertions. Screenshots are written to `__screenshots__/` folders next to the test file (gitignored). Name them by the test description.

## Storybook stories as tests

Every story runs as a Vitest test in both `storybook-light` and `storybook-dark` projects. This is enforced:

- Every story must have a `play` function.
- The `play` function must contain at least one `expect(` call — rendering alone is not a test.
- These rules are checked by `structure.test.ts`.

Every story also runs an axe accessibility check. `.storybook/vitest.setup.ts` fails a story whose axe score (passes / (passes + violations)) is under 50%. After the run, `.storybook/a11yReporter.ts` prints every story's score, labelled by project.

For the `a11y` Biome rules: where a rule cannot apply (e.g. roving tabindex, `aria-activedescendant`, virtualised rows), suppress it inline with `biome-ignore` and a reason.

## Structural test

`src/components/__tests__/structure.test.ts` enforces the component folder convention across the whole codebase at test time:

- Every `ComponentName/index.tsx` must have a `ComponentName.test.tsx`, `ComponentName.stories.tsx`, and `ComponentName.mdx` beside it.
- Every `utils/<name>/index.ts` must have a `<name>.test.ts` or `<name>.test.tsx` beside it.
- No component or util may live outside a folder (a flat `Name.tsx` fails).
- Every stories file must have at least one story with a `play` function.

## End-to-end tests

E2E tests use Playwright Test (`e2e/*.spec.ts`) against Chromium only. `playwright.config.ts` starts its own dev server on port 3100 (not 3000), so a running `npm run dev` server cannot bypass the mocks.

PokeAPI is always mocked in E2E. `e2e/mocks.ts` (`mockPokeApi`) responds to all three GraphQL operations (`getPokedex`, `getPokemonInfo`, `getTypeEfficacy`) from a fixed 22-Pokémon dex and stubs sprites. The real PokeAPI is never contacted.

Each test uses its own browser context, so the IndexedDB cache starts empty every time.

For timing-sensitive tests (e.g. the detail page's debounced info request), freeze the page clock with `page.clock` and advance it manually rather than racing real time.

URL search parameters are percent-encoded (e.g. `sort=name%3Adesc`). Match both forms in URL assertions: `(:|%3A)`.

After navigating between Pokémon with ←/→, wait for the adjacent-Pokémon buttons before the next keypress to ensure the new Pokémon's page is fully rendered.

## Dependency pre-bundling

New runtime dependencies that tests import must be added to `optimizeDeps.include` in `vitest.config.mts`. A dependency encountered mid-run triggers a Vite re-optimisation and reload, which can produce two copies of React in the page. The symptom is "Vite unexpectedly reloaded a test".
