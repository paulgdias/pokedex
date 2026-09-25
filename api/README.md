# Pokedex API (legacy)

A small Express 5 + MongoDB server that used to serve Pokémon data to the Pokédex. The frontend now reads from the PokeAPI GraphQL endpoint instead, so this server is only needed for the hidden `/teams` page, which requests `http://localhost:3001/api/v1/pokemon/teams`.

## Setup

Requires Node.js 18 or higher and access to the MongoDB cluster.

```bash
cd api
npm install
```

Create `api/.env` (gitignored):

```
PORT=3001            # optional, defaults to 3001
MONGODB_USERNAME=...
MONGODB_PASSWORD=...
MONGODB_DB=...
```

## Scripts

- `npm start`: run the server
- `npm run dev`: run with nodemon
- `npm run format`: format `src` with Biome

## Endpoints

All routes are `GET` and prefixed with `/api/v1/pokemon`:

| Route | Description |
|---|---|
| `/all` | all Pokémon |
| `/search=:search` | search by text |
| `/id/:id` | by id |
| `/name/:name` | by name |
| `/type/:type` | by type |
| `/gen/:number` | by generation |
| `/teams` | teams |
