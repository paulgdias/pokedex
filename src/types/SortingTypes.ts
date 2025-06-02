import { PokemonDetails } from "./PokemonTypes";

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
export interface SearchFields extends Sorting {
    // additional keys for ease of use
    pokemon: SortingItem; // name
    number: SortingItem; // id
    legends: SortingItem; // legendary pokemon
    mythicals: SortingItem; // mythical pokemon
    gen: SortingItem; // pokemon generation
    generation: SortingItem; // pokemon generation
}

export interface SortFunction {
    (
        pokemonData: PokemonDetails[],
        sorting: Sorting,
        sort: keyof Sorting
    ): PokemonDetails[];
}
