import type { QueryClient } from "@tanstack/react-query";

import { pokedexQueryOptions } from "@api/pokedex";

import { convertToPokemonDetailsArray, withEvolutions } from "../pokemon";

/**
 * Loader shared by every route that needs the whole dex. It lives outside the
 * (lazy-loaded) pages so data fetching starts while a page's chunk downloads.
 * It waits for `cacheRestored` (the persisted cache being read back from
 * IndexedDB) so the first load after a reload does not refetch the dex.
 */
export const pokedexLoader =
    (
        queryClient: QueryClient,
        cacheRestored: Promise<unknown> = Promise.resolve()
    ) =>
    async () => {
        await cacheRestored;
        const data = await queryClient.ensureQueryData(pokedexQueryOptions);
        return withEvolutions(convertToPokemonDetailsArray(data.pokemon));
    };
