import { memo, useEffect, useState, useMemo } from "react";
import { preconnect } from "react-dom";

import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";

import type { QueryClient } from "@tanstack/react-query";
import { queryOptions, keepPreviousData } from "@tanstack/react-query";

import { useLocalStorage } from "@uidotdev/usehooks";

import { Button } from "react-aria-components";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import Search from "@components/Search";
import SortingArrow from "@components/Buttons/SortingArrow";

import PokemonList from "@components/PokemonList";
import Pokeball from "@components/Icons/Pokeball";

import { ErrorBoundary } from "react-error-boundary";

import { PokemonDetails } from "@customTypes/PokemonTypes";
import { Sort, Sorting } from "@customTypes/SortingTypes";
import { PokedexSetState } from "@customTypes/PokedexTypes";

import {
    advancedSearch,
    createURLSearchParams,
    convertToSearch,
} from "@utils/search";
import { defaultSorting, getSortingKey, sortPokemonByType } from "@utils/sort";
import { getPokemonEvolutions } from "@utils/pokemon";

import { buttonClass } from "@styles/Pokedex";
import { twMerge } from "tailwind-merge";

const toggleButtonClass = twMerge(buttonClass, "w-12");

const pokedexQuery = (_args: LoaderFunctionArgs) => {
    return queryOptions({
        queryKey: ["pokedex"],
        queryFn: async (): Promise<Array<PokemonDetails>> => {
            const response = await fetch(
                "http://localhost:3001/api/v1/pokemon/all"
            );
            const data: PokemonDetails[] = await response.json();
            return data;
        },
        placeholderData: keepPreviousData,
    });
};

export const loader =
    (queryClient: QueryClient) => async (_args: LoaderFunctionArgs) => {
        const data = await queryClient.ensureQueryData(pokedexQuery(_args));
        return getPokemonEvolutions(data);
    };

const setState: PokedexSetState = ({
    pokemonData,
    sorting,
    sort,
    setSorting,
    setPokemonData,
    urlParams,
    setURLParams,
}) => {
    const data = sortPokemonByType(pokemonData, sorting, sort);
    setSorting({
        ...defaultSorting,
        [sort as keyof Sorting]: {
            sort: sorting[sort].sort === "asc" ? "desc" : "asc",
            selected: true,
        },
    });
    setPokemonData(data);

    const params: Record<string, string> = {
        sort: `${sort}:${sorting[sort].sort === "asc" ? "desc" : "asc"}`,
    };

    if (urlParams) {
        for (const [key, value] of urlParams) {
            if (!params[key]) {
                params[key] = value;
            }
        }
    }

    setURLParams(params, {
        preventScrollReset: true,
    });
};

const transformPokemonData = (
    data: PokemonDetails[],
    urlParams: URLSearchParams,
    sorting: Sorting
) => {
    const filteredPokemonData = urlParams.has("query")
        ? advancedSearch(data, convertToSearch(urlParams))
        : data;
    const sort = getSortingKey(sorting);
    return sortPokemonByType(
        filteredPokemonData,
        {
            ...defaultSorting,
            [sort as keyof Sorting]: {
                sort:
                    sorting?.[sort as keyof Sorting].sort === "asc"
                        ? "desc"
                        : "asc",
                selected: true,
            },
        },
        sort as keyof Sorting
    );
};

const Pokedex: React.FC = () => {
    preconnect("https://beta.pokeapi.co");
    preconnect("https://raw.githubusercontent.com/");

    const [urlParams, setURLParams] = useSearchParams();
    const [showFilters, setShowFilters] = useLocalStorage<boolean>(
        "showFilters",
        false
    );
    const [sorting, setSorting] = useState<Sorting>({
        ...defaultSorting,
        id: {
            sort: "asc",
            selected: true,
        },
    });

    const initialData: PokemonDetails[] = useLoaderData();
    const [pokemonData, setPokemonData] =
        useState<PokemonDetails[]>(initialData);
    const pokemonList = useMemo(
        () => transformPokemonData(pokemonData, urlParams, sorting),
        [pokemonData, urlParams, sorting]
    );

    useEffect(() => {
        let params: { sort: string; query?: string } = {
            sort: "",
        };
        if (urlParams.size === 0) {
            setURLParams(
                {
                    ...params,
                    sort: `id:${sorting.id.sort}`,
                },
                {
                    preventScrollReset: true,
                }
            );
        } else {
            for (const [key, value] of urlParams) {
                params = {
                    ...params,
                    [key]: value,
                };
            }
            if (params) {
                setURLParams(params, {
                    preventScrollReset: true,
                });

                const values = params.sort.split(":");
                setSorting({
                    ...defaultSorting,
                    [values[0]]: {
                        sort: values[1] ?? "asc",
                        selected: true,
                    },
                });
            }
        }
    }, []);

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
                        onSubmit={(results, searches) => {
                            const sort = getSortingKey(sorting);
                            if (sort) {
                                const sortingConfig = {
                                    ...defaultSorting,
                                    [sort]: {
                                        sort: (sorting?.[sort as keyof Sorting]
                                            .sort === "asc"
                                            ? "desc"
                                            : "asc") as Sort,
                                        selected: true,
                                    },
                                };

                                setState({
                                    pokemonData: sortPokemonByType(
                                        results,
                                        sortingConfig,
                                        sort as keyof Sorting
                                    ),
                                    setPokemonData,
                                    sorting: sortingConfig,
                                    sort: sort as keyof Sorting,
                                    setSorting,
                                    urlParams: createURLSearchParams(searches),
                                    setURLParams,
                                });

                                // hide filters if less than md breakpoint
                                if (window.innerWidth < 640) {
                                    setShowFilters(false);
                                }
                            }
                        }}
                    />
                    <Button
                        aria-label="Filter by Id"
                        className={`${buttonClass} bg-white ${showFilters ? "" : "hidden invisible"} disabled:disabled-component`}
                        onPress={() => {
                            setState({
                                pokemonData,
                                setPokemonData,
                                sorting,
                                sort: "id",
                                setSorting,
                                urlParams,
                                setURLParams,
                            });
                        }}
                    >
                        <div className="flex flex-row justify-between">
                            Id
                            {sorting["id"].selected ? (
                                <SortingArrow sort={sorting["id"].sort} />
                            ) : null}
                        </div>
                    </Button>
                    <Button
                        aria-label="Filter by Name"
                        className={`${buttonClass} bg-white ${showFilters ? "" : "hidden invisible"} disabled:disabled-component`}
                        onPress={() => {
                            setState({
                                pokemonData,
                                setPokemonData,
                                sorting,
                                sort: "name",
                                setSorting,
                                urlParams,
                                setURLParams,
                            });
                        }}
                    >
                        <div className="flex flex-row justify-between">
                            Name
                            {sorting["name"].selected ? (
                                <SortingArrow sort={sorting["name"].sort} />
                            ) : null}
                        </div>
                    </Button>
                    <Button
                        aria-label="Filter by Type"
                        className={`${buttonClass} bg-white ${showFilters ? "" : "hidden invisible"} disabled:disabled-component`}
                        onPress={() => {
                            setState({
                                pokemonData,
                                setPokemonData,
                                sorting,
                                sort: "type",
                                setSorting,
                                urlParams,
                                setURLParams,
                            });
                        }}
                    >
                        <div className="flex flex-row justify-between">
                            Type
                            {sorting["type"].selected ? (
                                <SortingArrow sort={sorting["type"].sort} />
                            ) : null}
                        </div>
                    </Button>
                    <Button
                        aria-label="Filter by Legendary"
                        className={`${buttonClass} bg-gray-300 hover:bg-gray-200 ${showFilters ? "" : "hidden invisible"} disabled:disabled-component`}
                        onPress={() => {
                            setState({
                                pokemonData,
                                setPokemonData,
                                sorting,
                                sort: "isLegendary",
                                setSorting,
                                urlParams,
                                setURLParams,
                            });
                        }}
                    >
                        <div className="flex flex-row justify-between truncate">
                            Legendary
                            {sorting["isLegendary"].selected ? (
                                <SortingArrow
                                    sort={sorting["isLegendary"].sort}
                                />
                            ) : null}
                        </div>
                    </Button>
                    <Button
                        aria-label="Filter by Mythical"
                        className={`${buttonClass} bg-yellow-400 hover:bg-yellow-300 ${showFilters ? "" : "hidden invisible"} disabled:disabled-component`}
                        onPress={() => {
                            setState({
                                pokemonData,
                                setPokemonData,
                                sorting,
                                sort: "isMythical",
                                setSorting,
                                urlParams,
                                setURLParams,
                            });
                        }}
                    >
                        <div className="flex flex-row justify-between">
                            Mythical
                            {sorting["isMythical"].selected ? (
                                <SortingArrow
                                    sort={sorting["isMythical"].sort}
                                />
                            ) : null}
                        </div>
                    </Button>
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
