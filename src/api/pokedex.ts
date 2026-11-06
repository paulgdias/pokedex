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

export const POKEAPI_UPSTREAM_URL = "https://graphql.pokeapi.co/v1beta2";

// graphql-request parses the URL with `new URL`, which rejects a relative one
const POKEAPI_URL =
    POKEAPI_SOURCE === "proxy"
        ? new URL("/pokeapi/graphql", window.location.origin).href
        : POKEAPI_UPSTREAM_URL;

// proxied responses carry same-origin sprite and cry URLs, so the persisted
// cache is keyed per source; upstream keeps its original keys
const sourceKey = POKEAPI_SOURCE === "proxy" ? ["proxy"] : [];

/**
 * Short, stable hash (FNV-1a) of a query document. It goes into the query
 * keys so editing a query abandons its persisted cache entry automatically,
 * with no version to bump by hand.
 */
export const queryHash = (document: string) => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < document.length; i++) {
        hash ^= document.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(36);
};

export const pokedexQuery = gql`
    query getPokedex {
        pokemon: pokemon {
            id
            name
            is_default
            stats: pokemonstats {
                stat_id
                base_stat
            }
            sprites: pokemonsprites {
                pixel: sprites(path: "front_default")
                default: sprites(
                    path: "other[\\"official-artwork\\"].front_default"
                )
            }
            types: pokemontypes {
                type: type {
                    name
                }
            }
            specs: pokemonspecy {
                species_id: id
                is_legendary
                is_mythical
                generation_id
                evolution_chain_id
                evolves_from_species_id
                evolution_methods: pokemonevolutions {
                    min_level
                    min_happiness
                    time_of_day
                    trigger: evolutiontrigger {
                        name
                    }
                    item: item {
                        name
                    }
                    held: ItemByHeldItemId {
                        name
                    }
                    move: move {
                        name
                    }
                    location: location {
                        name
                    }
                }
            }
        }
    }
`;

export const pokedexQueryOptions = queryOptions({
    queryKey: ["pokedex", queryHash(pokedexQuery), ...sourceKey],
    queryFn: () => request<PokedexResult>(POKEAPI_URL, pokedexQuery),
});

export const infoQuery = gql`
    query getPokemonInfo($id: Int!) {
        pokemon(where: { id: { _eq: $id } }) {
            height
            weight
            base_experience
            abilities: pokemonabilities(order_by: { slot: asc }) {
                is_hidden
                ability: ability {
                    name
                    effects: abilityeffecttexts(
                        where: { language_id: { _eq: 9 } }
                    ) {
                        short_effect
                    }
                }
            }
            cries: pokemoncries {
                cries
            }
            species: pokemonspecy {
                gender_rate
                capture_rate
                base_happiness
                hatch_counter
                habitat: pokemonhabitat {
                    name
                }
                color: pokemoncolor {
                    name
                }
                shape: pokemonshape {
                    name
                }
                growth: growthrate {
                    name
                }
                eggGroups: pokemonegggroups {
                    group: egggroup {
                        name
                    }
                }
                genus: pokemonspeciesnames(
                    where: { language_id: { _eq: 9 } }
                ) {
                    genus
                }
                flavor: pokemonspeciesflavortexts(
                    where: { language_id: { _eq: 9 } }
                    order_by: { version_id: desc }
                ) {
                    text: flavor_text
                    version: version {
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
        queryKey: ["pokemon-info", id, queryHash(infoQuery), ...sourceKey],
        queryFn: async () => {
            const result = await request<PokemonInfoResult>(
                POKEAPI_URL,
                infoQuery,
                { id }
            );
            return convertToPokemonInfo(result.pokemon[0]);
        },
        staleTime: Infinity,
    });

export const efficacyQuery = gql`
    query getTypeEfficacy {
        efficacy: typeefficacy(
            where: {
                damage_type_id: { _lte: 18 }
                target_type_id: { _lte: 18 }
            }
        ) {
            damage_type_id
            target_type_id
            damage_factor
        }
        types: type(where: { id: { _lte: 18 } }) {
            id
            name
        }
    }
`;

/** attacker -> defender -> multiplier for the 18 types; fetched once. */
export const typeEfficacyQueryOptions = queryOptions({
    queryKey: ["type-efficacy", queryHash(efficacyQuery)],
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
