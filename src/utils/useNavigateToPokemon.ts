import { useNavigate } from "react-router";

import { PokemonCardType } from "@customTypes/PokemonCardTypes";

export const useNavigateToPokemon = (
    previous?: string
): NonNullable<PokemonCardType["navigateCallback"]> => {
    const navigate = useNavigate();

    return (_event, pokemon) => {
        navigate(`/pokedex/${pokemon.name}`, {
            state: {
                pokemon,
                previous: previous || location.pathname + location.search,
            },
        });
    };
};
