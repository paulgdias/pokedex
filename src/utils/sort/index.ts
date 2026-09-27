import { PokemonDetails } from "@customTypes/PokemonTypes";
import {
    SORT_KEYS,
    STAT_SORT_KEYS,
    SortKey,
    SortState,
} from "@customTypes/SortingTypes";

const SORT_PARAM = "sort";

export const DEFAULT_SORT: SortState = { key: "id", direction: "asc" };

type Comparator = (a: PokemonDetails, b: PokemonDetails) => number;

// Each comparator yields the "asc" order (1 → N, A → Z, legendaries first);
// the "desc" direction is its reverse.
const comparators: Record<SortKey, Comparator> = {
    id: (a, b) => a.id - b.id,
    name: (a, b) => a.name.localeCompare(b.name),
    type: (a, b) => (a.types[0] ?? "").localeCompare(b.types[0] ?? ""),
    isLegendary: (a, b) => Number(b.isLegendary) - Number(a.isLegendary),
    isMythical: (a, b) => Number(b.isMythical) - Number(a.isMythical),
    total: (a, b) => a.statTotal - b.statTotal,
    ...(Object.fromEntries(
        STAT_SORT_KEYS.map((key, index) => [
            key,
            (a: PokemonDetails, b: PokemonDetails) =>
                (a.stats[index] ?? 0) - (b.stats[index] ?? 0),
        ])
    ) as Record<(typeof STAT_SORT_KEYS)[number], Comparator>),
};

const isSortKey = (value: string): value is SortKey =>
    (SORT_KEYS as readonly string[]).includes(value);

export const sortPokemon = (
    pokemon: PokemonDetails[],
    { key, direction }: SortState
): PokemonDetails[] => {
    const compare = comparators[key];
    const sign = direction === "desc" ? -1 : 1;
    // ties always fall back to ascending id, regardless of direction
    return [...pokemon].sort((a, b) => sign * compare(a, b) || a.id - b.id);
};

export const getNextSort = (current: SortState, key: SortKey): SortState => ({
    key,
    direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
});

export const getSortFromURLParams = (params: URLSearchParams): SortState => {
    const [key, direction] = params.get(SORT_PARAM)?.split(":") ?? [];
    if (!key || !isSortKey(key)) {
        return DEFAULT_SORT;
    }
    return { key, direction: direction === "desc" ? "desc" : "asc" };
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

const SORT_KEY_LABELS: Record<SortKey, string> = {
    id: "Number",
    name: "Name",
    type: "Type",
    isLegendary: "Legendary",
    isMythical: "Mythical",
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    specialAttack: "Sp. Atk",
    specialDefense: "Sp. Def",
    speed: "Speed",
    total: "Total stats",
};

/** e.g. "Attack High–Low"; for a sort that has no entry in the sort select. */
export const getSortLabel = ({ key, direction }: SortState) =>
    `${SORT_KEY_LABELS[key]} ${direction === "asc" ? "Low–High" : "High–Low"}`;
