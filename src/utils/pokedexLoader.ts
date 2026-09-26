import type { QueryClient } from "@tanstack/react-query";

import { pokedexQueryOptions } from "@api/pokedex";

import { convertToPokemonDetailsArray, withEvolutions } from "./pokemon";

/**
 * Loader shared by every route that needs the whole dex. It lives outside the
 * (lazy-loaded) pages so data fetching starts while a page's chunk downloads.
 */
export const pokedexLoader = (queryClient: QueryClient) => async () => {
    const data = await queryClient.ensureQueryData(pokedexQueryOptions);
    return withEvolutions(convertToPokemonDetailsArray(data.pokemon));
};
