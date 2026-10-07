# Pokedex

A React + TypeScript Pokédex I started as a way to bond with my 9 year old niece. It also serves as a testbed for new libraries, design patterns and UX ideas.

Browse every Pokémon, search by name or number, and filter by generation, type, and legendary/mythical status. Filters and sort order live in the URL, so any view can be shared or bookmarked. There are also a detail page per Pokémon, a side-by-side compare page, a type chart, and a light/dark theme.

## Tech

React 19, React Router 7, TanStack Query (cache persisted to IndexedDB), Tailwind CSS 4, React Aria Components, Rspack and Biome. Tests use Vitest (in real Chromium), Storybook and Playwright. Data comes from the [PokeAPI](https://pokeapi.co/) GraphQL endpoint; the whole Pokédex is fetched once and searched, filtered and sorted in the browser.

## Getting started

Requires Node.js 22.18 or higher (or 24.11+) (`.nvmrc` is provided).

```bash
npm install
npm run dev
```

The app is served at `http://localhost:3000`. `npm install` also installs the git hooks (see [Quality checks](#quality-checks)).

## Scripts

**App**

- `npm run dev`: development server with type checking
- `npm run dev:proxy`: same, but PokeAPI requests go through the local caching proxy (start it with `npm run api`)
- `npm run build`: production build into `dist/`
- `npm start`: serve the production build

**Quality**

- `npm run verify`: Biome, type-check, production build and tests with coverage. Run this before considering work done.
- `npm run verify:full`: `verify` plus the Playwright e2e tests
- `npm run biome:check`: lint, format and import-order check without changing files (what `verify` runs)
- `npm run biome:check:fix`: same, applying safe fixes
- `npm run biome:lint` / `biome:lint:fix` / `biome:format`: the individual Biome steps over the whole repo (gitignored files are skipped)
- `npm run type-check`: TypeScript check (`tsc --noEmit`)

**Tests and docs**

- `npm test`: unit tests plus every Storybook story as a test (Vitest, real Chromium)
- `npm run test:coverage`: same with coverage; fails under 90% for statements, branches, functions and lines
- `npm run e2e`: Playwright end-to-end tests (PokeAPI is mocked). It starts its own dev server on port 3100, so it works while `npm run dev` is running. Run `npx playwright install chromium` first if the browser is missing.
- `npm run storybook`: component docs and stories on `http://localhost:6006`
- `npm run build-storybook`: static Storybook build

## Quality checks

There is no CI. Checks run locally through [lefthook](https://github.com/evilmartians/lefthook) (`lefthook.yml`), installed by `npm install`:

- **pre-commit:** Biome on staged files (fixes are re-staged) and a type-check
- **pre-push:** `npm run verify`

Skip a hook once with `--no-verify`.

## Project layout

```
src/
  api/          PokeAPI GraphQL queries (pokedex.ts)
  components/   UI components; each is a folder with index.tsx, a test, stories and an .mdx page
  pages/        Route components: Home, Pokedex, Pokemon, Compare, TypeChart, Layout
  styles/       Tailwind theme (index.css) and shared class strings
  types/        TypeScript types
  utils/        Routing, search, filter, sort and data helpers, each with a test
api/            Optional local PokeAPI caching proxy (see api/README.md)
e2e/            Playwright specs and the PokeAPI mock
.storybook/     Storybook and Vitest setup
.claude/        Claude Code settings, hooks, commands and path-scoped rules
```

Contributor and AI-agent notes live in [`CLAUDE.md`](CLAUDE.md), with more detail in path-scoped rules under `.claude/rules/`.

## The `api/` server

An optional Express server that caches PokeAPI responses and sprites. Run it with `npm run api` and use it with `npm run dev:proxy`; see [`api/README.md`](api/README.md). Environment variables are listed in [`.env.example`](.env.example).

## License

The source code in this repository is released under the [MIT license](LICENSE). The license covers only the code written for this project. It does not extend to any Pokémon material.

## Disclaimer and attribution

This is an unofficial, non-commercial fan project. It is not affiliated with, endorsed by, or sponsored by Nintendo, Game Freak, Creatures Inc. or The Pokémon Company.

Pokémon and all related names, characters, artwork, sprites and cries are trademarks and copyrighted works of their respective owners. None of that material is stored in this repository: it is loaded at runtime from [PokeAPI](https://pokeapi.co/) and the [PokeAPI sprites repository](https://github.com/PokeAPI/sprites). Data is provided by PokeAPI; please follow its [fair use policy](https://pokeapi.co/docs/v2#fairuse) (the optional local proxy in `api/` exists partly to cache requests).
