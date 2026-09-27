import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { pokedexQueryOptions } from "@api/pokedex";

import { Pokemon } from "@customTypes/PokemonTypes";

import { pokedexLoader } from ".";

const raw = (id: number, name: string, chain: number): Pokemon => ({
    id,
    name,
    is_default: true,
    sprites: [{ default: `${name}.png`, pixel: null }],
    types: [{ type: { name: "grass" } }],
    stats: [{ stat_id: 1, base_stat: 10 * id }],
    specs: {
        species_id: id,
        evolution_methods: [],
        is_legendary: false,
        is_mythical: false,
        generation_id: 1,
        evolution_chain_id: chain,
        evolves_from_species_id: 0,
    },
});

const seeded = (pokemon: Pokemon[]) => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(pokedexQueryOptions.queryKey, { pokemon });
    return queryClient;
};

describe("pokedexLoader", () => {
    it("turns the cached dex into details with their whole evolution chain", async () => {
        const queryClient = seeded([
            raw(2, "ivysaur", 1),
            raw(1, "bulbasaur", 1),
            raw(25, "pikachu", 10),
        ]);

        const dex = await pokedexLoader(queryClient)();

        expect(dex.map((p) => p.name)).toEqual([
            "ivysaur",
            "bulbasaur",
            "pikachu",
        ]);
        expect(dex[0].statTotal).toBe(20);
        expect(dex[0].sprite).toBe("ivysaur.png");
        expect(dex[0].evolutions.map((p) => p.name)).toEqual([
            "bulbasaur",
            "ivysaur",
        ]);
        expect(dex[2].evolutions.map((p) => p.name)).toEqual(["pikachu"]);
    });

    it("reads the cache and does not fetch when the dex is already there", async () => {
        const queryClient = seeded([raw(1, "bulbasaur", 1)]);
        let fetches = 0;
        queryClient.getQueryCache().subscribe((event) => {
            if (event.type === "updated" && event.action.type === "fetch") {
                fetches += 1;
            }
        });

        await pokedexLoader(queryClient)();

        expect(fetches).toBe(0);
    });

    it("keys the cache so a changed query shape is not reused", () => {
        expect(pokedexQueryOptions.queryKey).toEqual(["pokedex", "v5"]);
    });
});
