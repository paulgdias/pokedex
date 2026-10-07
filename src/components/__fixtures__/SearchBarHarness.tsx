import { useState } from "react";

import { PokemonDetails } from "@customTypes/PokemonTypes";
import { SortState } from "@customTypes/SortingTypes";
import { applyFilters, EMPTY_FILTERS, PokedexFilters } from "@utils/search";
import { DEFAULT_SORT } from "@utils/sort";
import { PokedexView } from "@utils/view";

import SearchBar from "../SearchBar";
import { DEX } from "./pokemon";

type Spies = {
    onFiltersChange?: (patch: Partial<PokedexFilters>) => void;
    onTextChange?: (text: string) => void;
    onClearAll?: () => void;
    onSortChange?: (sort: SortState) => void;
    onViewChange?: (view: PokedexView) => void;
};

/** A SearchBar wired to its own state, the way the Pokédex page drives it. */
const SearchBarHarness = ({
    pokemon = DEX,
    initialFilters = EMPTY_FILTERS,
    initialSort = DEFAULT_SORT,
    initialView = "cards",
    ...spies
}: Spies & {
    pokemon?: PokemonDetails[];
    initialFilters?: PokedexFilters;
    initialSort?: SortState;
    initialView?: PokedexView;
}) => {
    const [filters, setFilters] = useState(initialFilters);
    const [sort, setSort] = useState(initialSort);
    const [view, setView] = useState(initialView);

    return (
        <SearchBar
            pokemon={pokemon}
            filters={filters}
            sort={sort}
            view={view}
            resultCount={applyFilters(pokemon, filters).length}
            onFiltersChange={(patch) => {
                setFilters((current) => ({ ...current, ...patch }));
                spies.onFiltersChange?.(patch);
            }}
            onTextChange={(text) => {
                setFilters((current) => ({ ...current, text }));
                spies.onTextChange?.(text);
            }}
            onClearAll={() => {
                setFilters(EMPTY_FILTERS);
                spies.onClearAll?.();
            }}
            onSortChange={(next) => {
                setSort(next);
                spies.onSortChange?.(next);
            }}
            onViewChange={(next) => {
                setView(next);
                spies.onViewChange?.(next);
            }}
        />
    );
};

export default SearchBarHarness;
