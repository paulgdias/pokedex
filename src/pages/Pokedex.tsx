import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import { preconnect } from "react-dom";

import type { LoaderFunctionArgs } from "react-router";
import {
    useLoaderData,
    useNavigationType,
    useSearchParams,
} from "react-router";

import type { QueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";

import { useDebounce } from "@uidotdev/usehooks";

import { SearchX } from "lucide-react";

import PokemonList from "@components/PokemonList";
import SearchBar from "@components/SearchBar";

import { ErrorBoundary } from "react-error-boundary";

import { PokemonDetails } from "@customTypes/PokemonTypes";
import { SortState } from "@customTypes/SortingTypes";

import { getGeneration } from "@utils/generations";
import { convertToPokemonDetailsArray, withEvolutions } from "@utils/pokemon";
import {
    applyFilters,
    EMPTY_FILTERS,
    getFiltersFromURLParams,
    PokedexFilters,
    withFilters,
} from "@utils/search";
import {
    DEFAULT_SORT,
    getSortFromURLParams,
    sortPokemon,
    withSort,
} from "@utils/sort";

import { getPokeAPIConfig } from "@api/hooks";

const pokedexQuery = (_args: LoaderFunctionArgs) => {
    return queryOptions(getPokeAPIConfig());
};

export const loader =
    (queryClient: QueryClient) => async (_args: LoaderFunctionArgs) => {
        const data = await queryClient.ensureQueryData(pokedexQuery(_args));
        const pokemon = convertToPokemonDetailsArray(data.pokemon);
        return withEvolutions(pokemon);
    };

const TEXT_DEBOUNCE_MS = 250;

const Pokedex: React.FC = () => {
    preconnect("https://beta.pokeapi.co");
    preconnect("https://raw.githubusercontent.com/");

    const [urlParams, setURLParams] = useSearchParams();
    const navigationType = useNavigationType();

    const allPokemon: PokemonDetails[] = useLoaderData();

    const urlFilters = useMemo(
        () => getFiltersFromURLParams(urlParams),
        [urlParams]
    );
    const sort = useMemo(() => getSortFromURLParams(urlParams), [urlParams]);

    // the search text is applied as you type and written to the URL shortly
    // after, so a reload or back navigation restores it
    const [text, setText] = useState(urlFilters.text);
    const filters = useMemo(
        () => ({ ...urlFilters, text }),
        [urlFilters, text]
    );
    const deferredFilters = useDeferredValue(filters);

    const pokemonList = useMemo(
        () => sortPokemon(applyFilters(allPokemon, deferredFilters), sort),
        [allPokemon, deferredFilters, sort]
    );

    useEffect(() => {
        if (!urlParams.has("sort")) {
            setURLParams(withSort(urlParams, DEFAULT_SORT), {
                replace: true,
                preventScrollReset: true,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const debouncedText = useDebounce(text, TEXT_DEBOUNCE_MS);
    useEffect(() => {
        if (debouncedText !== urlFilters.text) {
            setURLParams(
                withFilters(urlParams, { ...urlFilters, text: debouncedText }),
                { replace: true, preventScrollReset: true }
            );
        }
        // only when the typed text settles
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedText]);

    // back/forward can change the URL's text behind our back
    useEffect(() => {
        if (navigationType === "POP") {
            setText(urlFilters.text);
        }
    }, [navigationType, urlFilters.text]);

    const updateFilters = (patch: Partial<PokedexFilters>) => {
        const next = { ...filters, ...patch };
        setText(next.text);
        setURLParams(withFilters(urlParams, next), {
            replace: true,
            preventScrollReset: true,
        });
    };

    const setSort = (next: SortState) => {
        setURLParams(withSort(urlParams, next), {
            replace: true,
            preventScrollReset: true,
        });
    };

    const generation = getGeneration(filters.generation);
    const generationTotal = generation
        ? allPokemon.filter((item) => item.generationId === generation.id)
              .length
        : allPokemon.length;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <SearchBar
                pokemon={allPokemon}
                filters={filters}
                onFiltersChange={updateFilters}
                onTextChange={setText}
                onClearAll={() => updateFilters(EMPTY_FILTERS)}
                sort={sort}
                onSortChange={setSort}
                resultCount={pokemonList.length}
            />
            <div className="flex min-h-0 flex-1 flex-col gap-5 px-4 pt-7 lg:px-8">
                <div className="flex flex-wrap items-baseline gap-x-3.5">
                    <h1 className="font-display text-[34px] leading-tight font-bold tracking-tight">
                        {generation ? generation.region : "All regions"}
                    </h1>
                    <span className="text-[15px] text-muted">
                        {generation
                            ? `Generation ${generation.roman} · ${generationTotal} Pokémon`
                            : `National Dex · ${generationTotal} Pokémon`}
                    </span>
                </div>
                <ErrorBoundary
                    fallback={
                        <div className="flex justify-center">
                            Something went wrong!
                        </div>
                    }
                >
                    {pokemonList.length === 0 ? (
                        <EmptyState
                            onSearchAll={() =>
                                updateFilters({ generation: null })
                            }
                            onClear={() => updateFilters(EMPTY_FILTERS)}
                        />
                    ) : (
                        <PokemonList pokemon={pokemonList} />
                    )}
                </ErrorBoundary>
            </div>
        </div>
    );
};

const EmptyState = ({
    onSearchAll,
    onClear,
}: {
    onSearchAll: () => void;
    onClear: () => void;
}) => (
    <div className="mt-12 flex flex-col items-center gap-3.5 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-track">
            <SearchX size={28} className="text-muted" aria-hidden="true" />
        </div>
        <div className="font-display text-[22px] font-bold">
            Nothing matches these filters
        </div>
        <div className="max-w-[380px] text-[15px] text-muted">
            Try removing a filter, or search across every generation.
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
            <button
                type="button"
                onClick={onSearchAll}
                className="h-11 rounded-[10px] border-[1.5px] border-line-strong bg-surface px-[18px] text-sm font-semibold"
            >
                Search all generations
            </button>
            <button
                type="button"
                onClick={onClear}
                className="h-11 rounded-[10px] bg-ink px-[18px] text-sm font-semibold text-white"
            >
                Clear filters
            </button>
        </div>
    </div>
);

export default memo(Pokedex);
