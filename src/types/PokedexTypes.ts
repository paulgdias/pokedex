import type { SetURLSearchParams } from "react-router";
import { keepPreviousData } from "@tanstack/react-query";
import { PokemonDetails, PokedexResult, Pokemon } from "./PokemonTypes";
import { Sorting } from "./SortingTypes";

export interface PokeAPIConfigResult {
    queryKey: [string];
    queryFn: () => Promise<PokedexResult>;
    placeholderData: typeof keepPreviousData;
    select: (data: PokedexResult) => { pokemon: Pokemon[] };
}

export type PokedexSetState = (args: {
    pokemonData: PokemonDetails[];
    setPokemonData: React.Dispatch<React.SetStateAction<PokemonDetails[]>>;
    sorting: Sorting;
    sort: keyof Sorting;
    setSorting: React.Dispatch<React.SetStateAction<Sorting>>;
    urlParams: URLSearchParams;
    setURLParams: SetURLSearchParams;
}) => void;
