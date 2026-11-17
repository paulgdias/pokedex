# Product Overview

A React + TypeScript Pokédex built as a personal project by Paul Dias. It started as a way to bond with his niece and doubles as a testbed for new libraries, design patterns, and UX ideas.

## What it does

- Browse every Pokémon from the PokeAPI GraphQL endpoint.
- Search by name or number; filter by generation, type, and legendary/mythical status.
- Sort the list by any stat column.
- Switch between a card grid view and a sortable table view.
- View a detail page per Pokémon (stats, abilities, evolution chain, Pokédex entries, cry playback).
- Compare two Pokémon side by side.
- Inspect the full type effectiveness chart.
- Toggle light/dark/system theme.

## URL-driven state

All filters, sort order, and view mode live in URL search parameters, so any list view can be shared or bookmarked and survives a reload.

## Data strategy

The entire Pokédex is fetched once from PokeAPI and cached in IndexedDB (via TanStack Query + a persister). All filtering, sorting, and searching happen in the browser. Per-Pokémon detail data is fetched on demand and also cached.

An optional local Express caching proxy (`api/`) can be run with `npm run api` and used via `npm run dev:proxy`, which is useful during development to avoid hitting PokeAPI repeatedly and to serve same-origin sprite and cry URLs.

## Disclaimer

Unofficial, non-commercial fan project. Not affiliated with Nintendo, Game Freak, Creatures Inc., or The Pokémon Company. No Pokémon assets are stored in this repository; they are loaded at runtime from PokeAPI and the PokeAPI sprites repository.
