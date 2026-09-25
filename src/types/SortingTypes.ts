export const SORT_KEYS = [
    "id",
    "name",
    "type",
    "isLegendary",
    "isMythical",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];
export type Sort = "asc" | "desc";
export interface SortState {
    key: SortKey;
    direction: Sort;
}
