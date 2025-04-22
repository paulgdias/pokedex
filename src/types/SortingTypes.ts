import { Pokemon } from "./PokemonTypes";

export type Sort = "asc" | "desc";
export type SortingItem = {
    sort: Sort;
    selected: boolean;
};
export interface Sorting {
    name: SortingItem;
    id: SortingItem;
    type: SortingItem;
    isLegendary: SortingItem;
    isMythical: SortingItem;
}
export interface SortFunction {
    (pokemonData: Pokemon[], sorting: Sorting, sort: keyof Sorting): Pokemon[];
}