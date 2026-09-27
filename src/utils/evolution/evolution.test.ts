import { describe, expect, it } from "vitest";

import { EvolutionMethod, PokemonDetails } from "@customTypes/PokemonTypes";

import {
    BULBASAUR_LINE,
    DITTO,
    EEVEE_LINE,
    MEOWTH_LINE,
    chain,
    makePokemon,
} from "@components/__fixtures__/pokemon";

import { buildEvolutionLanes, formatEvolutionMethod, getPokemonForm } from ".";

const method = (overrides: Partial<EvolutionMethod> = {}): EvolutionMethod => ({
    min_level: null,
    min_happiness: null,
    time_of_day: "",
    trigger: { name: "level-up" },
    item: null,
    held: null,
    move: null,
    location: null,
    ...overrides,
});

describe("getPokemonForm", () => {
    it("has no form for default pokémon", () => {
        expect(getPokemonForm("charizard", true)).toBeNull();
        expect(getPokemonForm("meowth-alola", true)).toBeNull();
    });

    it.each([
        ["charizard-mega-x", "mega"],
        ["venusaur-gmax", "gmax"],
        ["meowth-alola", "alola"],
        ["meowth-galar", "galar"],
        ["growlithe-hisui", "hisui"],
        ["wooper-paldea", "paldea"],
        ["pikachu-alola-cap", "other"],
        ["pikachu-cosplay", "other"],
    ])("classifies %s as %s", (name, form) => {
        expect(getPokemonForm(name, false)).toBe(form);
    });
});

describe("formatEvolutionMethod", () => {
    it("labels level-ups", () => {
        expect(formatEvolutionMethod(method({ min_level: 16 }))).toBe("Lv. 16");
    });

    it("adds a held item and a time of day", () => {
        expect(
            formatEvolutionMethod(
                method({
                    min_level: 30,
                    held: { name: "razor-claw" },
                    time_of_day: "night",
                })
            )
        ).toBe("Lv. 30 holding Razor Claw (night)");
    });

    it("labels friendship, known moves, locations and plain level-ups", () => {
        expect(formatEvolutionMethod(method({ min_happiness: 160 }))).toBe(
            "High friendship"
        );
        expect(
            formatEvolutionMethod(
                method({ min_happiness: 160, time_of_day: "day" })
            )
        ).toBe("High friendship (day)");
        expect(
            formatEvolutionMethod(method({ move: { name: "ancient-power" } }))
        ).toBe("Knows Ancient Power");
        expect(
            formatEvolutionMethod(method({ location: { name: "mt-coronet" } }))
        ).toBe("Level up at Mt Coronet");
        expect(formatEvolutionMethod(method())).toBe("Level up");
        expect(
            formatEvolutionMethod(
                method({ held: { name: "oval-stone" }, time_of_day: "day" })
            )
        ).toBe("Level up holding Oval Stone (day)");
    });

    it("assumes level-up when there is no trigger", () => {
        expect(
            formatEvolutionMethod(method({ trigger: null, min_level: 5 }))
        ).toBe("Lv. 5");
    });

    it("labels items and trades", () => {
        expect(
            formatEvolutionMethod(
                method({
                    trigger: { name: "use-item" },
                    item: { name: "fire-stone" },
                })
            )
        ).toBe("Use Fire Stone");
        expect(
            formatEvolutionMethod(method({ trigger: { name: "use-item" } }))
        ).toBe("Use item");
        expect(
            formatEvolutionMethod(method({ trigger: { name: "trade" } }))
        ).toBe("Trade");
        expect(
            formatEvolutionMethod(
                method({
                    trigger: { name: "trade" },
                    held: { name: "metal-coat" },
                })
            )
        ).toBe("Trade holding Metal Coat");
    });

    it("title-cases any other trigger", () => {
        expect(
            formatEvolutionMethod(
                method({ trigger: { name: "three-critical-hits" } })
            )
        ).toBe("Three Critical Hits");
    });
});

describe("buildEvolutionLanes", () => {
    const stageNames = (lane: { stages: { pokemon: PokemonDetails }[][] }) =>
        lane.stages.map((stage) => stage.map((step) => step.pokemon.name));

    it("orders a linear chain by depth, with the way each stage is reached", () => {
        const [lane, ...rest] = buildEvolutionLanes(BULBASAUR_LINE);
        expect(rest).toEqual([]);
        expect(lane.region).toBeNull();
        expect(stageNames(lane)).toEqual([
            ["bulbasaur"],
            ["ivysaur"],
            ["venusaur"],
        ]);
        expect(lane.stages.map(([step]) => step.method)).toEqual([
            null,
            "Lv. 16",
            "Lv. 32",
        ]);
    });

    it("lists Mega and Gigantamax forms on their species' step", () => {
        const [lane] = buildEvolutionLanes(BULBASAUR_LINE);
        const [venusaur] = lane.stages[2];
        expect(venusaur.forms.map((form) => form.name)).toEqual([
            "venusaur-mega",
            "venusaur-gmax",
        ]);
        expect(lane.stages[0][0].forms).toEqual([]);
    });

    it("branches into several pokémon in one stage, sorted by id", () => {
        const [lane] = buildEvolutionLanes([...EEVEE_LINE].reverse());
        expect(stageNames(lane)).toEqual([["eevee"], ["vaporeon", "jolteon"]]);
        expect(lane.stages[1].map((step) => step.method)).toEqual([
            "Use Water Stone",
            "Use Thunder Stone",
        ]);
    });

    it("gives a species without evolutions a single stage", () => {
        const [lane] = buildEvolutionLanes([DITTO]);
        expect(stageNames(lane)).toEqual([["ditto"]]);
    });

    it("returns an empty standard lane for an empty chain", () => {
        expect(buildEvolutionLanes([])).toEqual([{ region: null, stages: [] }]);
    });

    it("adds a lane per region, in Alola-then-Galar order", () => {
        const lanes = buildEvolutionLanes(MEOWTH_LINE);
        expect(lanes.map(({ region }) => region)).toEqual([
            null,
            "alola",
            "galar",
        ]);
    });

    it("keeps regional forms out of the standard lane", () => {
        const [standard] = buildEvolutionLanes(MEOWTH_LINE);
        expect(stageNames(standard)).toEqual([["meowth"], ["persian"]]);
    });

    it("builds each regional lane from that region's forms", () => {
        const [, alola, galar] = buildEvolutionLanes(MEOWTH_LINE);
        expect(stageNames(alola)).toEqual([
            ["meowth-alola"],
            ["persian-alola"],
        ]);
        expect(stageNames(galar)).toEqual([["meowth-galar"], ["perrserker"]]);
    });

    it("uses the evolution row that matches the lane, falling back to the first", () => {
        const [standard, alola, galar] = buildEvolutionLanes(MEOWTH_LINE);
        expect(standard.stages[1][0].method).toBe("Lv. 28");
        expect(alola.stages[1][0].method).toBe("High friendship");
        // perrserker only has one row
        expect(galar.stages[1][0].method).toBe("Lv. 28");
    });

    it("has no method when a species lists none", () => {
        const [lane] = buildEvolutionLanes(
            chain([
                makePokemon({ id: 1, name: "a", evolutionChainId: 1 }),
                makePokemon({
                    id: 2,
                    name: "b",
                    speciesId: 2,
                    evolvesFromId: 1,
                    evolutionChainId: 1,
                }),
            ])
        );
        expect(lane.stages[1][0].method).toBeNull();
    });

    it("drops costumes and other alternate forms", () => {
        const lanes = buildEvolutionLanes([
            makePokemon({ id: 25, name: "pikachu" }),
            makePokemon({
                id: 10080,
                name: "pikachu-alola-cap",
                speciesId: 25,
                isDefault: false,
                form: "other",
            }),
        ]);
        expect(lanes).toHaveLength(1);
        expect(stageNames(lanes[0])).toEqual([["pikachu"]]);
    });

    it("keeps a pre-evolution that only exists in a regional lane in the standard lane's ancestry", () => {
        // a regional-only species is not part of the standard lane
        const lanes = buildEvolutionLanes([
            makePokemon({ id: 1, name: "a", evolutionChainId: 1 }),
            makePokemon({
                id: 2,
                name: "b-alola",
                speciesId: 2,
                evolvesFromId: 1,
                isDefault: false,
                form: "alola",
                generationId: 7,
            }),
        ]);
        expect(lanes.map(({ region }) => region)).toEqual([null, "alola"]);
        expect(stageNames(lanes[0])).toEqual([["a"]]);
    });

    it("does not loop on a chain that points back at itself", () => {
        const lanes = buildEvolutionLanes([
            makePokemon({ id: 1, name: "a", speciesId: 1, evolvesFromId: 2 }),
            makePokemon({ id: 2, name: "b", speciesId: 2, evolvesFromId: 1 }),
        ]);
        expect(lanes).toHaveLength(1);
        expect(lanes[0].stages.flat()).toHaveLength(2);
    });

    it("treats a parent that is missing from the chain as a first stage", () => {
        const [lane] = buildEvolutionLanes([
            makePokemon({
                id: 5,
                name: "orphan",
                speciesId: 5,
                evolvesFromId: 99,
            }),
        ]);
        expect(stageNames(lane)).toEqual([["orphan"]]);
        expect(lane.stages[0][0].method).toBeNull();
    });
});
