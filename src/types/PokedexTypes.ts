import type { SetURLSearchParams } from "react-router-dom";
import { Pokemon } from "./PokemonTypes";
import { Sorting } from "./SortingTypes";

export type PokedexSetState = (args: {
    pokemonData: Pokemon[];
    setPokemonData: React.Dispatch<React.SetStateAction<Pokemon[]>>;
    sorting: Sorting;
    sort: keyof Sorting;
    setSorting: React.Dispatch<React.SetStateAction<Sorting>>;
    urlParams: URLSearchParams;
    setURLParams: SetURLSearchParams;
}) => void;
