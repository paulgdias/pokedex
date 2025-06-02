import type { SetURLSearchParams } from "react-router";
import { PokemonDetails } from "./PokemonTypes";
import { Sorting } from "./SortingTypes";

export type PokedexSetState = (args: {
    pokemonData: PokemonDetails[];
    setPokemonData: React.Dispatch<React.SetStateAction<PokemonDetails[]>>;
    sorting: Sorting;
    sort: keyof Sorting;
    setSorting: React.Dispatch<React.SetStateAction<Sorting>>;
    urlParams: URLSearchParams;
    setURLParams: SetURLSearchParams;
}) => void;
