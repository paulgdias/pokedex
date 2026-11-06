---
name: bump-query-key
description: Bump the persisted dex query key (["pokedex", "vN"]) after changing the dex GraphQL query shape or PokemonDetails, and update everything that references it. Use when the dex query, its fields, or its conversion in src/utils/pokemon changes.
---

# Bump the dex query key

The dex is persisted to IndexedDB for a day. If the query shape changes and the key does not, returning users load stale data with the old shape. Bump the key whenever the dex query's fields or the data it returns changes.

## Steps

1. Read the current key in `src/api/pokedex.ts` (`pokedexQueryOptions.queryKey`, currently `["pokedex", "v5", ...sourceKey]`). The next version is `vN+1`.
2. Replace the version in `src/api/pokedex.ts`.
3. Update the assertion in `src/utils/pokedexLoader/pokedexLoader.test.ts` (`expect(pokedexQueryOptions.queryKey).toEqual(["pokedex", "vN"])`).
4. Update the `(currently ["pokedex", "vN"])` note in `CLAUDE.md` (Data flow section).
5. Search for other hits: `grep -rn '"v<old>"' src e2e .storybook CLAUDE.md .claude`. Do not touch unrelated `"v5"` strings.
6. If the query shape changed, make sure the matching pieces are updated too:
   - `PokemonDetails` type in `src/types/`
   - conversion in `src/utils/pokemon`
   - `makePokemon` in `src/components/__fixtures__/pokemon.ts`
   - `e2e/mocks.ts` (the `getPokedex` response)
7. Run `npm run verify`, and `npm run e2e` if `e2e/mocks.ts` changed. Report the result. Do not commit or push.

Only the dex key is bumped here. `pokemonInfoQueryOptions` and `typeEfficacyQueryOptions` are fetched lazily and are not persisted this way.
