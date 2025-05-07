import { request, gql } from "graphql-request";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { PokedexResult } from "@customTypes/PokemonTypes";

import { getPokemonEvolutions } from "@utils/pokemon";

const useFetchPokedex = ({ enabled }: { enabled?: boolean }) => {
    return useQuery<PokedexResult, Error>({
        queryKey: ["pokedex"],
        queryFn: async (): Promise<PokedexResult> => {
            const query = gql`
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
            const data: PokedexResult = await request(
                "https://beta.pokeapi.co/graphql/v1beta",
                query
            );
            return data;
        },
        placeholderData: keepPreviousData,
        select: (data) => {
            const evolutions = getPokemonEvolutions(data);
            const pokemon = data.pokemon.map((pokemon) => {
                return {
                    ...pokemon,
                    evolutions: evolutions[pokemon.specs.evolution_chain_id],
                };
            });
            return {
                pokemon,
            };
        },
        enabled: enabled,
    });
};

export default useFetchPokedex;
