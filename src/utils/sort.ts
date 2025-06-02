import { PokemonDetails } from "@customTypes/PokemonTypes";
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
export const basicSortByPokemon = (
    pokemonData: PokemonDetails[]
): PokemonDetails[] => {
    return [...pokemonData].sort(
        (a: PokemonDetails, b: PokemonDetails) => a._id - b._id
    );
};
export const sortPokemonByType: SortFunction = (pokemonData, sorting, sort) => {
    if (sort === "id") {
        return [...pokemonData].sort((a: PokemonDetails, b: PokemonDetails) =>
            sorting[sort].sort === "asc" ? b._id - a._id : a._id - b._id
        );
    }
    if (sort === "type") {
        return basicSortByPokemon([...pokemonData]).sort(
            (a: PokemonDetails, b: PokemonDetails) =>
                sorting[sort].sort === "asc"
                    ? b.types[0].localeCompare(a.types[0])
                    : a.types[0].localeCompare(b.types[0])
        );
    }
    if (sort === "isLegendary") {
        return basicSortByPokemon([...pokemonData]).sort(
            (a: PokemonDetails, b: PokemonDetails) =>
                sorting[sort].sort === "desc"
                    ? b.isLegendary
                        ? 1
                        : -1
                    : a.isLegendary
                      ? -1
                      : 1
        );
    }
    if (sort === "isMythical") {
        return basicSortByPokemon([...pokemonData]).sort(
            (a: PokemonDetails, b: PokemonDetails) =>
                sorting[sort].sort === "desc"
                    ? b.isMythical
                        ? 1
                        : -1
                    : a.isMythical
                      ? -1
                      : 1
        );
    }

    if (sort === "name") {
        return basicSortByPokemon([...pokemonData]).sort(
            (a: PokemonDetails, b: PokemonDetails) =>
                sorting[sort].sort === "desc"
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name)
        );
    }
    return basicSortByPokemon(pokemonData);
};
