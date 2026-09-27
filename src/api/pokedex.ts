import { queryOptions } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

import {
    PokedexResult,
    PokemonInfoResult,
    TypeEfficacy,
    TypeEfficacyResult,
} from "@customTypes/PokemonTypes";

import { convertToPokemonInfo } from "@utils/pokemon";

// set by DefinePlugin in rspack.config.ts (POKEAPI_PROXY=1); Vitest, Storybook
// and e2e do not define it and keep talking to (or mocking) PokeAPI itself
declare const __POKEAPI_PROXY__: boolean | undefined;

export const POKEAPI_SOURCE =
    typeof __POKEAPI_PROXY__ !== "undefined" && __POKEAPI_PROXY__
        ? "proxy"
        : "upstream";

// graphql-request parses the URL with `new URL`, which rejects a relative one
const POKEAPI_URL =
    POKEAPI_SOURCE === "proxy"
        ? new URL("/pokeapi/graphql", window.location.origin).href
        : "https://beta.pokeapi.co/graphql/v1beta";

// proxied responses carry same-origin sprite and cry URLs, so the persisted
// cache is keyed per source; upstream keeps its original keys
const sourceKey = POKEAPI_SOURCE === "proxy" ? ["proxy"] : [];

const pokedexQuery = gql`
    query getPokedex {
        pokemon: pokemon_v2_pokemon {
            id
            name
            is_default
            stats: pokemon_v2_pokemonstats {
                stat_id
                base_stat
            }
            sprites: pokemon_v2_pokemonsprites {
                pixel: sprites(path: "front_default")
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
    queryKey: ["pokedex", "v5", ...sourceKey],
    queryFn: () => request<PokedexResult>(POKEAPI_URL, pokedexQuery),
});

const infoQuery = gql`
    query getPokemonInfo($id: Int!) {
        pokemon_v2_pokemon(where: { id: { _eq: $id } }) {
            height
            weight
            base_experience
            abilities: pokemon_v2_pokemonabilities(order_by: { slot: asc }) {
                is_hidden
                ability: pokemon_v2_ability {
                    name
                    effects: pokemon_v2_abilityeffecttexts(
                        where: { language_id: { _eq: 9 } }
                    ) {
                        short_effect
                    }
                }
            }
            cries: pokemon_v2_pokemoncries {
                cries
            }
            species: pokemon_v2_pokemonspecy {
                gender_rate
                capture_rate
                base_happiness
                hatch_counter
                habitat: pokemon_v2_pokemonhabitat {
                    name
                }
                color: pokemon_v2_pokemoncolor {
                    name
                }
                shape: pokemon_v2_pokemonshape {
                    name
                }
                growth: pokemon_v2_growthrate {
                    name
                }
                eggGroups: pokemon_v2_pokemonegggroups {
                    group: pokemon_v2_egggroup {
                        name
                    }
                }
                genus: pokemon_v2_pokemonspeciesnames(
                    where: { language_id: { _eq: 9 } }
                ) {
                    genus
                }
                flavor: pokemon_v2_pokemonspeciesflavortexts(
                    where: { language_id: { _eq: 9 } }
                    order_by: { version_id: desc }
                ) {
                    text: flavor_text
                    version: pokemon_v2_version {
                        name
                    }
                }
            }
        }
    }
`;

/** Abilities, size, species facts, entries and the cry of one pokemon. */
export const pokemonInfoQueryOptions = (id: number) =>
    queryOptions({
        queryKey: ["pokemon-info", id, ...sourceKey],
        queryFn: async () => {
            const result = await request<PokemonInfoResult>(
                POKEAPI_URL,
                infoQuery,
                { id }
            );
            return convertToPokemonInfo(result.pokemon_v2_pokemon[0]);
        },
        staleTime: Infinity,
    });

const efficacyQuery = gql`
    query getTypeEfficacy {
        efficacy: pokemon_v2_typeefficacy(
            where: {
                damage_type_id: { _lte: 18 }
                target_type_id: { _lte: 18 }
            }
        ) {
            damage_type_id
            target_type_id
            damage_factor
        }
        types: pokemon_v2_type(where: { id: { _lte: 18 } }) {
            id
            name
        }
    }
`;

/** attacker -> defender -> multiplier for the 18 types; fetched once. */
export const typeEfficacyQueryOptions = queryOptions({
    queryKey: ["type-efficacy"],
    queryFn: async (): Promise<TypeEfficacy> => {
        const { efficacy, types } = await request<TypeEfficacyResult>(
            POKEAPI_URL,
            efficacyQuery
        );
        const names = new Map(types.map(({ id, name }) => [id, name]));
        const chart: TypeEfficacy = {};
        for (const row of efficacy) {
            const attacker = names.get(row.damage_type_id);
            const defender = names.get(row.target_type_id);
            if (attacker && defender) {
                chart[attacker] ??= {};
                chart[attacker][defender] = row.damage_factor / 100;
            }
        }
        return chart;
    },
    staleTime: Infinity,
});
