import { queryOptions } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

import { PokedexResult } from "@customTypes/PokemonTypes";

const POKEAPI_URL = "https://beta.pokeapi.co/graphql/v1beta";

const pokedexQuery = gql`
    query getPokedex {
        pokemon: pokemon_v2_pokemon {
            id
            name
            sprites: pokemon_v2_pokemonsprites {
                default: sprites(
                    path: "other[\\"official-artwork\\"].front_default"
                )
            }
            types: pokemon_v2_pokemontypes {
                type: pokemon_v2_type {
                    name
                }
            }
            specs: pokemon_v2_pokemonspecy {
                is_legendary
                is_mythical
                generation_id
                evolution_chain_id
                evolves_from_species_id
            }
        }
    }
`;

export const pokedexQueryOptions = queryOptions({
    queryKey: ["pokedex"],
    queryFn: () => request<PokedexResult>(POKEAPI_URL, pokedexQuery),
});
