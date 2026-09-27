import { describe, expect, it } from "vitest";

import { Pokemon, PokemonInfoResult } from "@customTypes/PokemonTypes";

import {
    convertToPokemonDetailsArray,
    convertToPokemonInfo,
    withEvolutions,
} from ".";

const raw = (overrides: Partial<Pokemon> = {}): Pokemon => ({
    id: 1,
    name: "bulbasaur",
    is_default: true,
    sprites: [{ default: "art.png", pixel: "pixel.png" }],
    types: [{ type: { name: "grass" } }, { type: { name: "poison" } }],
    stats: [
        { stat_id: 1, base_stat: 45 },
        { stat_id: 2, base_stat: 49 },
        { stat_id: 3, base_stat: 49 },
        { stat_id: 4, base_stat: 65 },
        { stat_id: 5, base_stat: 65 },
        { stat_id: 6, base_stat: 45 },
    ],
    specs: {
        species_id: 1,
        evolution_methods: [],
        is_legendary: false,
        is_mythical: false,
        generation_id: 1,
        evolution_chain_id: 1,
        evolves_from_species_id: 0,
    },
    ...overrides,
});

describe("convertToPokemonDetailsArray", () => {
    it("converts a full record", () => {
        const [bulbasaur] = convertToPokemonDetailsArray([raw()]);
        expect(bulbasaur).toEqual({
            id: 1,
            name: "bulbasaur",
            sprite: "art.png",
            inGameSprite: "pixel.png",
            types: ["grass", "poison"],
            isLegendary: false,
            isMythical: false,
            generationId: 1,
            evolutionChainId: 1,
            speciesId: 1,
            evolvesFromId: 0,
            isDefault: true,
            form: null,
            stats: [45, 49, 49, 65, 65, 45],
            statTotal: 318,
            evolutionMethods: [],
            evolutions: [],
        });
    });

    it("indexes stats by PokeAPI stat id and ignores unknown ids", () => {
        const [mon] = convertToPokemonDetailsArray([
            raw({
                stats: [
                    { stat_id: 6, base_stat: 10 },
                    { stat_id: 1, base_stat: 20 },
                    { stat_id: 7, base_stat: 999 },
                    { stat_id: 0, base_stat: 999 },
                ],
            }),
        ]);
        expect(mon.stats).toEqual([20, 0, 0, 0, 0, 10]);
        expect(mon.statTotal).toBe(30);
    });

    it("derives the form from the name for non-default pokémon", () => {
        const [mega] = convertToPokemonDetailsArray([
            raw({ name: "venusaur-mega", is_default: false }),
        ]);
        expect(mega.form).toBe("mega");
        expect(mega.isDefault).toBe(false);
    });

    it("labels evolution methods", () => {
        const [mon] = convertToPokemonDetailsArray([
            raw({
                specs: {
                    ...raw().specs,
                    evolution_methods: [
                        {
                            min_level: 16,
                            min_happiness: null,
                            time_of_day: "",
                            trigger: { name: "level-up" },
                            item: null,
                            held: null,
                            move: null,
                            location: null,
                        },
                    ],
                },
            }),
        ]);
        expect(mon.evolutionMethods).toEqual(["Lv. 16"]);
    });

    it("falls back to safe defaults for missing data", () => {
        const [mon] = convertToPokemonDetailsArray([
            {
                id: 7,
                name: "sparse",
            } as unknown as Pokemon,
        ]);
        expect(mon).toMatchObject({
            id: 7,
            sprite: "",
            inGameSprite: null,
            isLegendary: false,
            isMythical: false,
            generationId: 0,
            evolutionChainId: 0,
            speciesId: 7,
            evolvesFromId: 0,
            isDefault: true,
            stats: [0, 0, 0, 0, 0, 0],
            statTotal: 0,
            evolutionMethods: [],
            types: [],
            evolutions: [],
        });
    });

    it("falls back when even the id and name are missing", () => {
        const [mon] = convertToPokemonDetailsArray([{} as unknown as Pokemon]);
        expect(mon.id).toBe(0);
        expect(mon.name).toBe("");
        expect(mon.speciesId).toBe(0);
    });

    it("converts nested evolutions too", () => {
        const [mon] = convertToPokemonDetailsArray([
            raw({ evolutions: [raw({ id: 2, name: "ivysaur" })] }),
        ]);
        expect(mon.evolutions.map((e) => e.name)).toEqual(["ivysaur"]);
    });
});

describe("withEvolutions", () => {
    it("gives every member of a chain the whole chain, sorted by id", () => {
        const [c, a, b, other] = convertToPokemonDetailsArray([
            raw({ id: 3, name: "c" }),
            raw({ id: 1, name: "a" }),
            raw({ id: 2, name: "b" }),
            raw({
                id: 9,
                name: "solo",
                specs: { ...raw().specs, evolution_chain_id: 9 },
            }),
        ]).map((p, i, all) => (i < 3 ? p : all[3]));
        const result = withEvolutions([c, a, b, other]);
        const chainOf = (name: string) =>
            result.find((p) => p.name === name)?.evolutions.map((p) => p.name);
        expect(chainOf("a")).toEqual(["a", "b", "c"]);
        expect(chainOf("c")).toEqual(["a", "b", "c"]);
        expect(chainOf("solo")).toEqual(["solo"]);
    });

    it("does not mutate the input pokémon", () => {
        const input = convertToPokemonDetailsArray([raw()]);
        withEvolutions(input);
        expect(input[0].evolutions).toEqual([]);
    });

    it("keeps the list order", () => {
        const input = convertToPokemonDetailsArray([
            raw({ id: 5, name: "e" }),
            raw({ id: 2, name: "b" }),
        ]);
        expect(withEvolutions(input).map((p) => p.name)).toEqual(["e", "b"]);
    });
});

describe("convertToPokemonInfo", () => {
    const rawInfo = (
        overrides: Partial<PokemonInfoResult["pokemon_v2_pokemon"][number]> = {}
    ): PokemonInfoResult["pokemon_v2_pokemon"][number] => ({
        height: 7,
        weight: 69,
        base_experience: 64,
        abilities: [
            {
                is_hidden: false,
                ability: {
                    name: "overgrow",
                    effects: [{ short_effect: "Powers up Grass." }],
                },
            },
            { is_hidden: true, ability: { name: "chlorophyll", effects: [] } },
        ],
        cries: [{ cries: { latest: "latest.ogg", legacy: "legacy.ogg" } }],
        species: {
            gender_rate: 1,
            capture_rate: 45,
            base_happiness: 50,
            hatch_counter: 20,
            habitat: { name: "grassland" },
            color: { name: "green" },
            shape: { name: "quadruped" },
            growth: { name: "medium-slow" },
            eggGroups: [
                { group: { name: "monster" } },
                { group: { name: "plant" } },
            ],
            genus: [{ genus: "Seed Pokémon" }],
            flavor: [{ text: "text", version: { name: "sword" } }],
        },
        ...overrides,
    });

    it("converts a full record", () => {
        expect(convertToPokemonInfo(rawInfo())).toEqual({
            height: 7,
            weight: 69,
            baseExperience: 64,
            abilities: [
                {
                    name: "overgrow",
                    isHidden: false,
                    effect: "Powers up Grass.",
                },
                { name: "chlorophyll", isHidden: true, effect: "" },
            ],
            cry: "latest.ogg",
            genus: "Seed Pokémon",
            genderRate: 1,
            captureRate: 45,
            baseHappiness: 50,
            hatchCounter: 20,
            habitat: "grassland",
            color: "green",
            shape: "quadruped",
            growthRate: "medium-slow",
            eggGroups: ["monster", "plant"],
            flavorTexts: [{ text: "text", version: "sword" }],
        });
    });

    it("prefers the latest cry, then the legacy one, then none", () => {
        expect(
            convertToPokemonInfo(
                rawInfo({ cries: [{ cries: { legacy: "legacy.ogg" } }] })
            ).cry
        ).toBe("legacy.ogg");
        expect(
            convertToPokemonInfo(rawInfo({ cries: [{ cries: null }] })).cry
        ).toBeNull();
        expect(convertToPokemonInfo(rawInfo({ cries: [] })).cry).toBeNull();
    });

    it("handles species with missing facts", () => {
        const info = convertToPokemonInfo(
            rawInfo({
                species: {
                    gender_rate: -1,
                    capture_rate: 3,
                    base_happiness: null,
                    hatch_counter: null,
                    habitat: null,
                    color: null,
                    shape: null,
                    growth: null,
                    eggGroups: [],
                    genus: [],
                    flavor: [],
                },
            })
        );
        expect(info).toMatchObject({
            genus: "",
            habitat: null,
            color: null,
            shape: null,
            growthRate: null,
            eggGroups: [],
            flavorTexts: [],
            baseHappiness: null,
        });
    });
});
