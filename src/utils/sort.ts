import { PokemonDetails } from "@customTypes/PokemonTypes";
import { SORT_KEYS, SortKey, SortState } from "@customTypes/SortingTypes";

const SORT_PARAM = "sort";

export const DEFAULT_SORT: SortState = { key: "id", direction: "desc" };

type Comparator = (a: PokemonDetails, b: PokemonDetails) => number;

// Each comparator yields the "desc" order (1 → N, A → Z, legendaries first);
// the "asc" direction is its reverse.
const comparators: Record<SortKey, Comparator> = {
    id: (a, b) => a._id - b._id,
    name: (a, b) => a.name.localeCompare(b.name),
    type: (a, b) => (a.types[0] ?? "").localeCompare(b.types[0] ?? ""),
    isLegendary: (a, b) => Number(b.isLegendary) - Number(a.isLegendary),
    isMythical: (a, b) => Number(b.isMythical) - Number(a.isMythical),
};

const isSortKey = (value: string): value is SortKey =>
    (SORT_KEYS as readonly string[]).includes(value);

export const sortPokemon = (
    pokemon: PokemonDetails[],
    { key, direction }: SortState
): PokemonDetails[] => {
    const compare = comparators[key];
    const sign = direction === "asc" ? -1 : 1;
    // ties always fall back to ascending id, regardless of direction
    return [...pokemon].sort((a, b) => sign * compare(a, b) || a._id - b._id);
};

export const getNextSort = (current: SortState, key: SortKey): SortState => ({
    key,
    direction:
        current.key === key && current.direction === "desc" ? "asc" : "desc",
});

export const getSortFromURLParams = (params: URLSearchParams): SortState => {
    const [key, direction] = params.get(SORT_PARAM)?.split(":") ?? [];
    if (!key || !isSortKey(key)) {
        return DEFAULT_SORT;
    }
    return { key, direction: direction === "asc" ? "asc" : "desc" };
};

/** Returns a copy of `params` with the sort applied. */
export const withSort = (
    params: URLSearchParams,
    { key, direction }: SortState
): URLSearchParams => {
    const next = new URLSearchParams(params);
    next.set(SORT_PARAM, `${key}:${direction}`);
    return next;
};
