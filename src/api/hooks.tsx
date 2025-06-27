// Hook to fetch and process Pokémon data from the GraphQL API.

import { request, gql } from "graphql-request";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { Pokemon, PokedexResult } from "@customTypes/PokemonTypes";

export const graphqlQuery = gql`
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

export const getGroupedEvolutions = (data: PokedexResult) => {
    if (data) {
        const groupedPokemonData = data.pokemon.reduce(
            (acc, pokemon) => {
                const chainId = pokemon.specs.evolution_chain_id;
                if (!acc[chainId]) {
                    acc[chainId] = [];
                }
                acc[chainId].push(pokemon);
                return acc;
            },
            {} as Record<number, Pokemon[]>
        );
        for (const chainId in groupedPokemonData) {
            groupedPokemonData[chainId].sort((a, b) => a.id - b.id);
        }

        return groupedPokemonData;
    }
    return {};
};

export const getPokemonEvolutions = (data: PokedexResult) => {
    const evolutions = getGroupedEvolutions(data);
    const pokemon = data.pokemon.map((pokemon) => {
        return {
            ...pokemon,
            evolutions: evolutions[pokemon.specs.evolution_chain_id],
        };
    });
    return {
        pokemon,
    };
};

export const getPokeAPIConfig = () => {
    return {
        queryKey: ["pokedex"],
        queryFn: async (): Promise<PokedexResult> => {
            const data: PokedexResult = await request(
                "https://beta.pokeapi.co/graphql/v1beta",
                graphqlQuery
            );
            return data;
        },
        placeholderData: keepPreviousData,
    };
};

const useFetchPokedex = ({ enabled }: { enabled?: boolean }) => {
    return useQuery<PokedexResult, Error>({
        ...getPokeAPIConfig(),
        select: (data) => {
            const evolutions: Record<number, Pokemon[]> =
                getPokemonEvolutions(data);
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
