import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

import { PokemonCardType } from "@customTypes/PokemonCardTypes";
import { PokemonDetails } from "@customTypes/PokemonTypes";

/** Router state attached when navigating to a pokemon's page. */
export interface PokemonLocationState {
    pokemon: PokemonDetails;
    previous: string;
}

type NavigateCallback = NonNullable<PokemonCardType["navigateCallback"]>;

export const useNavigateToPokemon = (previous?: string): NavigateCallback => {
    const navigate = useNavigate();
    const { pathname, search } = useLocation();

    return useCallback(
        (_event, pokemon) => {
            const state: PokemonLocationState = {
                pokemon,
                previous: previous || pathname + search,
            };
            navigate(`/pokedex/${pokemon.name}`, { state });
        },
        [navigate, pathname, search, previous]
    );
};
