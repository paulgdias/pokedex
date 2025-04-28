import { Pokemon } from "@customTypes/PokemonTypes";
import { SortFunction, Sorting, SortingItem } from "@customTypes/SortingTypes";

export const defaultDescSort: SortingItem = {
    sort: "desc",
    selected: false,
};
export const defaultSorting: Sorting = {
    name: defaultDescSort,
    id: defaultDescSort,
    type: defaultDescSort,
    isLegendary: defaultDescSort,
    isMythical: defaultDescSort,
};
export const getSortingKey = (sorting: Sorting) => {
    return Object.keys(sorting).find((key) => {
        const typedKey = key as keyof Sorting;
        return sorting[typedKey].selected === true;
    });
};
export const basicSortByPokemon = (pokemonData: Pokemon[]): Pokemon[] => {
    return [...pokemonData].sort((a: Pokemon, b: Pokemon) => a.id - b.id);
};
export const sortPokemonByType: SortFunction = (pokemonData, sorting, sort) => {
    if (sort === "id") {
        return [...pokemonData].sort((a: Pokemon, b: Pokemon) =>
            sorting[sort].sort === "asc" ? b.id - a.id : a.id - b.id
        );
    }
    if (sort === "type") {
        return basicSortByPokemon([...pokemonData]).sort(
            (a: Pokemon, b: Pokemon) =>
                sorting[sort].sort === "asc"
                    ? b.types[0].type.name.localeCompare(a.types[0].type.name)
                    : a.types[0].type.name.localeCompare(b.types[0].type.name)
        );
    }
    if (sort === "isLegendary") {
        return basicSortByPokemon([...pokemonData]).sort(
            (a: Pokemon, b: Pokemon) =>
                sorting[sort].sort === "desc"
                    ? b.specs.is_legendary
                        ? 1
                        : -1
                    : a.specs.is_legendary
                        ? -1
                        : 1
        );
    }
    if (sort === "isMythical") {
        return basicSortByPokemon([...pokemonData]).sort(
            (a: Pokemon, b: Pokemon) =>
                sorting[sort].sort === "desc"
                    ? b.specs.is_mythical
                        ? 1
                        : -1
                    : a.specs.is_mythical
                        ? -1
                        : 1
        );
    }

    if (sort === "name") {
        return basicSortByPokemon([...pokemonData]).sort(
            (a: Pokemon, b: Pokemon) =>
                sorting[sort].sort === "desc"
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name)
        );
    }
    return basicSortByPokemon(pokemonData);
};