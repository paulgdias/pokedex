# Pokedex

A React + TypeScript Pokédex I started as a way to bond with my 9 year old niece. It also serves as a testbed for new libraries, design patterns and UX ideas.

Browse every Pokémon, search by name or number, and filter by generation, type, and legendary/mythical status. Filters and sort order live in the URL, so any view can be shared or bookmarked.

## Tech

React 19, React Router 7, TanStack Query (cache persisted to localStorage), Tailwind CSS 4, React Aria Components, Rspack and Biome. Data comes from the [PokeAPI](https://pokeapi.co/) GraphQL endpoint; the whole Pokédex is fetched once and searched, filtered and sorted in the browser.

## Getting started

Requires Node.js 20 or higher.

```bash
npm install
npm run dev
```

The app is served at `http://localhost:3000`.

## Scripts

- `npm run dev`: development server with type checking
- `npm run build`: production build into `dist/`
- `npm start`: serve the production build
- `npm run type-check`: TypeScript check (`tsc --noEmit`)
- `npm run biome:lint`: lint `src` with Biome
- `npm run biome:lint:fix`: lint and apply safe fixes
- `npm run biome:format`: format `src` with Biome
- `npm run biome:check:fix`: lint, format and organize imports

There is no automated test suite yet.

## Project layout

```
src/
  api/          PokeAPI GraphQL query (pokedex.ts)
  components/   UI components (Nav, PokemonCard, PokemonList, SearchBar, ...)
  pages/        Route components: Home, Pokedex, Pokemon, Teams, Layout
  styles/       Tailwind theme (index.css) and shared class strings
  types/        TypeScript types
  utils/        Routing, search, filter, sort and data helpers
api/            Legacy Express + MongoDB server (see api/README.md)
```

Contributor and AI-agent notes live in [`CLAUDE.md`](CLAUDE.md), with more detail in path-scoped rules at `.claude/rules/components.md` and `.claude/rules/utils.md`.

## The `api/` server

The Pokédex no longer uses it. It only backs the hidden `/teams` page, which expects it running on `http://localhost:3001`.
