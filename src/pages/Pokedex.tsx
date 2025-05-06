import React, { memo, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { preconnect } from "react-dom";

import { useLocalStorage } from "@uidotdev/usehooks";

import { request, gql } from "graphql-request";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { Button } from "react-aria-components";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import Search from "@components/Search";
import SortingArrow from "@components/Buttons/SortingArrow";

const PokemonList = React.lazy(() => import("@components/PokemonList"));
import Pokeball from "@components/Icons/Pokeball";
import PlaceholderList from "@components/PokemonList/PlaceholderList";

import { ErrorBoundary } from "react-error-boundary";

import { Pokemon, PokedexResult } from "@customTypes/PokemonTypes";
import { Sort, Sorting } from "@customTypes/SortingTypes";
import { PokedexSetState } from "@customTypes/PokedexTypes";

import {
    advancedSearch,
    createURLSearchParams,
    convertToSearch,
} from "@utils/search";
import { defaultSorting, getSortingKey, sortPokemonByType } from "@utils/sort";

import { buttonClass } from "@styles/Pokedex";
import { twMerge } from "tailwind-merge";
const toggleButtonClass = twMerge(buttonClass, "w-12");

const getPokemonEvolutions = (data: PokedexResult) => {
    if (data) {
        const groupedPokemonData = data.pokemon.reduce(
            (acc, pokemon) => {
                const chainId = pokemon.specs.evolution_chain_id;
                if (!acc[chainId]) {
                    acc[chainId] = [];
                }
                acc[chainId].push(pokemon);
                return acc;
            },
            {} as Record<number, Pokemon[]>
        );
        for (const chainId in groupedPokemonData) {
            groupedPokemonData[chainId].sort((a, b) => a.id - b.id);
        }

        return groupedPokemonData;
    }
    return {};
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
        [sort]: {
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

const Pokedex: React.FC = () => {
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
    const [pokemonData, setPokemonData] = useState<Pokemon[]>([]);
    const { data, isLoading } = useQuery<PokedexResult, Error>({
        queryKey: ["pokedex"],
        queryFn: async (): Promise<PokedexResult> => {
            const query = gql`
                query getPokedex {
                    pokemon: pokemon_v2_pokemon {
                        id
                        name
                        sprites: pokemon_v2_pokemonsprites {
                            default: sprites(
                                path: "other[\\"official-artwork\\"].front_default"
                            )
                        }
                        types: pokemon_v2_pokemontypes {
                            type: pokemon_v2_type {
                                name
                            }
                        }
                        specs: pokemon_v2_pokemonspecy {
                            is_legendary
                            is_mythical
                            generation_id
                            evolution_chain_id
                            evolves_from_species_id
                        }
                    }
                }
            `;
            const data: PokedexResult = await request(
                "https://beta.pokeapi.co/graphql/v1beta",
                query
            );
            return data;
        },
        placeholderData: keepPreviousData,
    });

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

    const pokemonWithEvolutions = useMemo(() => {
        if (data) {
            const evolutions = getPokemonEvolutions(data);
            return data.pokemon.map((pokemon) => {
                return {
                    ...pokemon,
                    evolutions: evolutions[pokemon.specs.evolution_chain_id],
                };
            });
        }
        return [];
    }, [data]);

    useEffect(() => {
        if (data) {
            const pokemonData = urlParams.has("query")
                ? advancedSearch(
                      pokemonWithEvolutions,
                      convertToSearch(urlParams)
                  )
                : pokemonWithEvolutions;
            const sort = getSortingKey(sorting);

            if (sort) {
                setPokemonData(
                    sortPokemonByType(
                        pokemonData,
                        {
                            ...defaultSorting,
                            [sort]: {
                                sort:
                                    sorting?.[sort as keyof Sorting].sort ===
                                    "asc"
                                        ? "desc"
                                        : "asc",
                                selected: true,
                            },
                        },
                        sort as keyof Sorting
                    )
                );
            } else {
                setPokemonData(pokemonWithEvolutions);
            }
        }
    }, [data]);

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
                        data={pokemonWithEvolutions}
                        value={convertToSearch(urlParams)}
                        isDisabled={isLoading}
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
                            }
                        }}
                    />
                    <Button
                        aria-label="Filter by Id"
                        className={`${buttonClass} bg-white ${showFilters ? "" : "hidden invisible"} disabled:disabled-component`}
                        isDisabled={isLoading}
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
                        isDisabled={isLoading}
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
                        isDisabled={isLoading}
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
                        isDisabled={isLoading}
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
                        isDisabled={isLoading}
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
                <Suspense fallback={<PlaceholderList />}>
                    <ErrorBoundary
                        fallback={
                            <div className="flex justify-center">
                                Something went wrong!
                            </div>
                        }
                    >
                        <PokemonList
                            pokemon={pokemonData}
                            isLoading={isLoading}
                        />
                    </ErrorBoundary>
                </Suspense>
            </div>
        </>
    );
};

export default memo(Pokedex);
