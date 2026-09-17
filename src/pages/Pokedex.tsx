import { memo, useEffect, useMemo, useState } from "react";
import { preconnect } from "react-dom";

import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";

import type { QueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";

import { useLocalStorage } from "@uidotdev/usehooks";

import PokemonList from "@components/PokemonList";
import SearchBar from "@components/SearchBar";

import { ErrorBoundary } from "react-error-boundary";

import { PokemonDetails } from "@customTypes/PokemonTypes";
import { Sorting } from "@customTypes/SortingTypes";

import {
    convertToPokemonDetailsArray,
    getPokemonEvolutions,
} from "@utils/pokemon";
import { advancedSearch, convertToSearch } from "@utils/search";
import {
    getNextSortDirection,
    getSortingFromURLParams,
    getSortingKey,
    sortPokemonByType,
} from "@utils/sort";

import { getPokeAPIConfig } from "@api/hooks";

const pokedexQuery = (_args: LoaderFunctionArgs) => {
    return queryOptions(getPokeAPIConfig());
};

export const loader =
    (queryClient: QueryClient) => async (_args: LoaderFunctionArgs) => {
        const data = await queryClient.ensureQueryData(pokedexQuery(_args));
        const pokemon = convertToPokemonDetailsArray(data.pokemon);
        return getPokemonEvolutions(pokemon);
    };

const transformPokemonData = (
    data: PokemonDetails[],
    urlParams: URLSearchParams,
    sorting: Sorting
) => {
    const filteredPokemonData = urlParams.has("query")
        ? advancedSearch(data, convertToSearch(urlParams))
        : data;
    const sort = getSortingKey(sorting) as keyof Sorting;
    return sortPokemonByType(filteredPokemonData, sorting, sort);
};

const Pokedex: React.FC = () => {
    preconnect("https://beta.pokeapi.co");
    preconnect("https://raw.githubusercontent.com/");

    const [urlParams, setURLParams] = useSearchParams();
    const [showFilters, setShowFilters] = useLocalStorage<boolean>(
        "showFilters",
        false
    );

    const initialData: PokemonDetails[] = useLoaderData();
    const [previewData, setPreviewData] = useState<PokemonDetails[] | null>(
        null
    );

    const sorting = useMemo(
        () => getSortingFromURLParams(urlParams),
        [urlParams]
    );
    const pokemonList = useMemo(
        () =>
            transformPokemonData(
                previewData ?? initialData,
                urlParams,
                sorting
            ),
        [previewData, initialData, urlParams, sorting]
    );

    useEffect(() => {
        if (!urlParams.has("sort")) {
            const params = new URLSearchParams(urlParams);
            params.set("sort", "id:desc");
            setURLParams(params, {
                replace: true,
                preventScrollReset: true,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setSort = (sortKey: keyof Sorting) => {
        const nextDirection = getNextSortDirection(sorting, sortKey);
        const params = new URLSearchParams(urlParams);
        params.set("sort", `${sortKey}:${nextDirection}`);
        setURLParams(params, { preventScrollReset: true });
    };

    return (
        <>
            <div className="flex flex-col">
                <SearchBar
                    initialData={initialData}
                    urlParams={urlParams}
                    setURLParams={setURLParams}
                    sorting={sorting}
                    setSort={setSort}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    setPreviewData={setPreviewData}
                />
                <ErrorBoundary
                    fallback={
                        <div className="flex justify-center">
                            Something went wrong!
                        </div>
                    }
                >
                    <PokemonList pokemon={pokemonList} />
                </ErrorBoundary>
            </div>
        </>
    );
};

export default memo(Pokedex);
