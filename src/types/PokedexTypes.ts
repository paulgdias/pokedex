import { keepPreviousData } from "@tanstack/react-query";
import { PokedexResult, Pokemon } from "./PokemonTypes";

export interface PokeAPIConfigResult {
    queryKey: [string];
    queryFn: () => Promise<PokedexResult>;
    placeholderData: typeof keepPreviousData;
    select: (data: PokedexResult) => { pokemon: Pokemon[] };
}
