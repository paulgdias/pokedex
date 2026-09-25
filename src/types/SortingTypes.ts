/** In PokeAPI stat order; the index is also the index into `PokemonDetails.stats`. */
export const STAT_SORT_KEYS = [
    "hp",
    "attack",
    "defense",
    "specialAttack",
    "specialDefense",
    "speed",
] as const;

export const SORT_KEYS = [
    "id",
    "name",
    "type",
    "isLegendary",
    "isMythical",
    ...STAT_SORT_KEYS,
    "total",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];
export type Sort = "asc" | "desc";
export interface SortState {
    key: SortKey;
    direction: Sort;
}
