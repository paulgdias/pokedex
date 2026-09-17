import { memo, useEffect, useMemo, useState } from "react";
import { preconnect } from "react-dom";

import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";

import type { QueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";

import { useLocalStorage } from "@uidotdev/usehooks";

import { Button } from "react-aria-components";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import Search from "@components/Search";
import SortingArrow from "@components/Buttons/SortingArrow";

import PokemonList from "@components/PokemonList";
import Pokeball from "@components/Icons/Pokeball";

import { ErrorBoundary } from "react-error-boundary";

import { PokemonDetails } from "@customTypes/PokemonTypes";
import { Sorting } from "@customTypes/SortingTypes";

import {
    advancedSearch,
    createURLSearchParams,
    convertToSearch,
    basicSearch,
} from "@utils/search";
import {
    getNextSortDirection,
    getSortingFromURLParams,
    getSortingKey,
    sortPokemonByType,
} from "@utils/sort";
import { convertToPokemonDetailsArray, getPokemonEvolutions } from "@utils/pokemon";

import { getPokeAPIConfig } from "@api/hooks";

import { buttonClass } from "@styles/Pokedex";
import { twMerge } from "tailwind-merge";

const toggleButtonClass = twMerge(buttonClass, "w-12");

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

const sortButtons: {
    key: keyof Sorting;
    label: string;
    className?: string;
}[] = [
    { key: "id", label: "Id" },
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    {
        key: "isLegendary",
        label: "Legendary",
        className: "bg-gray-300 hover:bg-gray-200",
    },
    {
        key: "isMythical",
        label: "Mythical",
        className: "bg-yellow-400 hover:bg-yellow-300",
    },
];

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
                <div
                    className={`
                        flex max-md:flex-col flex-row flex-wrap m-auto mt-4 fixed top-0 z-1
                        bg-white/20 rounded-2xl shadow-lg backdrop-blur-sm border border-white/30
                        `}
                >
                    <div className="flex flex-row">
                        <div className="my-4 mx-1">
                            <Pokeball />
                        </div>
                        <Button
                            aria-label={`${showFilters ? "Show Filters" : "Hide Filters"}`}
                            className={`${toggleButtonClass} bg-white`}
                            onPress={() => setShowFilters(!showFilters)}
                        >
                            <div className="flex">
                                {showFilters ? (
                                    <ChevronsLeft className="h-6 w-6 text-black" />
                                ) : (
                                    <ChevronsRight className="h-6 w-6 text-black" />
                                )}
                            </div>
                        </Button>
                    </div>
                    <Search
                        className={`${showFilters ? "" : "hidden invisible"}`}
                        data={initialData}
                        value={convertToSearch(urlParams)}
                        onChange={(text) => {
                            if (!text.includes("+")) {
                                setPreviewData(basicSearch(initialData, text));
                            }
                        }}
                        onSubmit={(_results, searches) => {
                            const sortKey = getSortingKey(
                                sorting
                            ) as keyof Sorting;
                            const nextDirection = getNextSortDirection(
                                sorting,
                                sortKey
                            );

                            const params = new URLSearchParams();
                            params.set(
                                "sort",
                                `${sortKey}:${nextDirection}`
                            );
                            const query = createURLSearchParams(
                                searches
                            ).get("query");
                            if (query) params.set("query", query);

                            setURLParams(params, {
                                preventScrollReset: true,
                            });
                            setPreviewData(null);

                            // hide filters if less than md breakpoint
                            if (window.innerWidth < 640) {
                                setShowFilters(false);
                            }
                        }}
                    />
                    {sortButtons.map(({ key, label, className }) => (
                        <Button
                            key={key}
                            aria-label={`Filter by ${label}`}
                            className={`${buttonClass} ${className ?? "bg-white"} ${showFilters ? "" : "hidden invisible"} disabled:disabled-component`}
                            onPress={() => setSort(key)}
                        >
                            <div className="flex flex-row justify-between truncate">
                                {label}
                                {sorting[key].selected ? (
                                    <SortingArrow sort={sorting[key].sort} />
                                ) : null}
                            </div>
                        </Button>
                    ))}
                </div>
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
