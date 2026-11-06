import { request } from "graphql-request";
import { describe, expect, it } from "vitest";

import {
    efficacyQuery,
    infoQuery,
    POKEAPI_UPSTREAM_URL,
    pokedexQuery,
} from "@api/pokedex";
import type {
    PokedexResult,
    PokemonInfoResult,
    TypeEfficacyResult,
} from "@customTypes/PokemonTypes";
import { convertToPokemonInfo } from "@utils/pokemon";

// Contract test against the real PokeAPI. Every other test uses fixtures or
// mocks, so none of them notice when the endpoint moves or its schema changes.
// Run with `npm run test:contract` (needs the network; not part of `verify`).

describe("PokeAPI contract", () => {
    it("allows cross-origin requests from the browser", async () => {
        const response = await fetch(POKEAPI_UPSTREAM_URL, {
            method: "OPTIONS",
            headers: {
                Origin: "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        });
        expect(response.status).toBeLessThan(400);
        expect(response.headers.get("access-control-allow-origin")).toMatch(
            /^(\*|http:\/\/localhost:3000)$/
        );
    });

    it("getPokedex returns the whole dex in the shape the app reads", async () => {
        const { pokemon } = await request<PokedexResult>(
            POKEAPI_UPSTREAM_URL,
            pokedexQuery
        );
        expect(pokemon.length).toBeGreaterThan(1000);

        const bulbasaur = pokemon.find(({ id }) => id === 1);
        expect(bulbasaur).toMatchObject({
            name: "bulbasaur",
            is_default: true,
            specs: { species_id: 1, generation_id: 1 },
        });
        expect(bulbasaur?.stats).toHaveLength(6);
        expect(bulbasaur?.types.map(({ type }) => type.name)).toEqual([
            "grass",
            "poison",
        ]);
        expect(bulbasaur?.sprites[0].default).toMatch(
            /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\//
        );
        expect(bulbasaur?.sprites[0].pixel).toMatch(
            /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\//
        );
    });

    it("getPokemonInfo returns what convertToPokemonInfo needs", async () => {
        const result = await request<PokemonInfoResult>(
            POKEAPI_UPSTREAM_URL,
            infoQuery,
            { id: 25 }
        );
        expect(result.pokemon).toHaveLength(1);

        const info = convertToPokemonInfo(result.pokemon[0]);
        expect(info.height).toBeGreaterThan(0);
        expect(info.weight).toBeGreaterThan(0);
        expect(result.pokemon[0].abilities.length).toBeGreaterThan(0);
        expect(result.pokemon[0].species.flavor.length).toBeGreaterThan(0);
    });

    it("getTypeEfficacy returns the 18x18 chart", async () => {
        const { efficacy, types } = await request<TypeEfficacyResult>(
            POKEAPI_UPSTREAM_URL,
            efficacyQuery
        );
        expect(types).toHaveLength(18);
        expect(efficacy).toHaveLength(324);
        expect(efficacy.every(({ damage_factor }) => damage_factor >= 0)).toBe(
            true
        );
    });
});
