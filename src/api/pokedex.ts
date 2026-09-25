import { queryOptions } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

import { HomeSpriteResult, PokedexResult } from "@customTypes/PokemonTypes";

const POKEAPI_URL = "https://beta.pokeapi.co/graphql/v1beta";

const pokedexQuery = gql`
    query getPokedex {
        pokemon: pokemon_v2_pokemon {
            id
            name
            is_default
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
                species_id: id
                is_legendary
                is_mythical
                generation_id
                evolution_chain_id
                evolves_from_species_id
                evolution_methods: pokemon_v2_pokemonevolutions {
                    min_level
                    min_happiness
                    time_of_day
                    trigger: pokemon_v2_evolutiontrigger {
                        name
                    }
                    item: pokemon_v2_item {
                        name
                    }
                    held: pokemonV2ItemByHeldItemId {
                        name
                    }
                    move: pokemon_v2_move {
                        name
                    }
                    location: pokemon_v2_location {
                        name
                    }
                }
            }
        }
    }
`;

export const pokedexQueryOptions = queryOptions({
    queryKey: ["pokedex", "v3"],
    queryFn: () => request<PokedexResult>(POKEAPI_URL, pokedexQuery),
});

const homeSpriteQuery = gql`
    query getHomeSprite($id: Int!) {
        pokemon_v2_pokemonsprites(where: { pokemon_id: { _eq: $id } }) {
            home: sprites(path: "other.home.front_default")
        }
    }
`;

/** The 3D (Pokémon HOME) render of one pokemon, or null when it has none. */
export const homeSpriteQueryOptions = (id: number) =>
    queryOptions({
        queryKey: ["pokemon-home-sprite", id],
        queryFn: async () => {
            const result = await request<HomeSpriteResult>(
                POKEAPI_URL,
                homeSpriteQuery,
                { id }
            );
            return result.pokemon_v2_pokemonsprites[0]?.home ?? null;
        },
        staleTime: Infinity,
    });
