import { describe, expect, it } from "vitest";

import {
    bulbasaur,
    CHARMANDER,
    DEX,
    DITTO,
    EFFICACY,
    MEW,
    MEWTWO,
    makePokemon,
    PICHU,
    PIDGEY,
    PIKACHU,
    SQUIRTLE,
} from "@components/__fixtures__/pokemon";
import { PokemonDetails, TypeEfficacy } from "@customTypes/PokemonTypes";
import { TYPE_ORDER } from "@utils/stats";

import {
    computeDefensiveProfile,
    computeOffensiveCoverage,
    computeThreatGrid,
    hasTypeData,
    parseParty,
    parseThreats,
    rankReplacements,
    serializeParty,
    serializeThreats,
} from ".";

// ── URL helpers ──────────────────────────────────────────────────────────────

describe("parseParty", () => {
    it("returns 6 filled slots from a valid param", () => {
        const param = "1,4,7,0,0,0";
        const result = parseParty(param, DEX);
        expect(result).toHaveLength(6);
        expect(result[0]?.id).toBe(1);
        expect(result[1]?.id).toBe(4);
        expect(result[2]?.id).toBe(7);
        expect(result[3]).toBeNull();
        expect(result[4]).toBeNull();
        expect(result[5]).toBeNull();
    });

    it("returns 6 nulls when param is absent", () => {
        expect(parseParty(null, DEX)).toEqual(Array(6).fill(null));
    });

    it("returns 6 nulls when there are not exactly 6 values", () => {
        expect(parseParty("1,4,7,0,0", DEX)).toEqual(Array(6).fill(null));
        expect(parseParty("1,4,7,0,0,0,150", DEX)).toEqual(Array(6).fill(null));
    });

    it("treats unknown ids as null", () => {
        const result = parseParty("9999,1,4,0,0,0", DEX);
        expect(result[0]).toBeNull();
        expect(result[1]?.id).toBe(1);
    });

    it("empties a slot whose value is not a plain whole number", () => {
        const result = parseParty("4abc,1.5,-3, 7,1,0x4", DEX);
        expect(result.map((p) => p?.id ?? null)).toEqual([
            null,
            null,
            null,
            null,
            1,
            null,
        ]);
    });

    it("empties a slot that repeats an id from an earlier slot", () => {
        const result = parseParty("1,4,1,0,4,7", DEX);
        expect(result.map((p) => p?.id ?? null)).toEqual([
            1,
            4,
            null,
            null,
            null,
            7,
        ]);
    });
});

describe("serializeParty", () => {
    it("serialises filled slots as their ids and empty ones as 0", () => {
        const party = [bulbasaur, CHARMANDER, null, null, null, null];
        expect(serializeParty(party)).toBe("1,4,0,0,0,0");
    });
});

describe("parseThreats", () => {
    it("returns a valid list unchanged, in its own order", () => {
        // not TYPE_ORDER (fire, water, electric, grass, ice): the URL's order
        expect(parseThreats("ice,grass,fire")).toEqual([
            "ice",
            "grass",
            "fire",
        ]);
    });

    it("drops unknown names before capping at 3", () => {
        const result = parseThreats("unknown,fire,bogus,water,oops,grass,ice");
        expect(result).toEqual(["fire", "water", "grass"]);
    });

    it("keeps each type once, at its first position", () => {
        expect(parseThreats("fire,fire,water,fire,grass")).toEqual([
            "fire",
            "water",
            "grass",
        ]);
    });

    it("returns an empty array for a missing or empty param", () => {
        expect(parseThreats(null)).toEqual([]);
        expect(parseThreats("")).toEqual([]);
    });
});

describe("serializeThreats", () => {
    it("joins with commas", () => {
        expect(serializeThreats(["fire", "water"])).toBe("fire,water");
    });
});

// ── computeDefensiveProfile ───────────────────────────────────────────────────

describe("computeDefensiveProfile", () => {
    const band = (party: PokemonDetails[], type: string) =>
        computeDefensiveProfile(party, EFFICACY).find((e) => e.type === type);

    it("returns one neutral entry per type, in TYPE_ORDER, for an empty party", () => {
        const result = computeDefensiveProfile([], EFFICACY);
        expect(result.map((e) => e.type)).toEqual([...TYPE_ORDER]);
        for (const entry of result) {
            expect(entry).toMatchObject({ band: "neutral", weakCount: 0 });
        }
    });

    it("assigns 'weak' when a member takes 2× from an attacker", () => {
        // squirtle (water) takes 2× from grass and electric
        expect(band([SQUIRTLE], "grass")?.band).toBe("weak");
        expect(band([SQUIRTLE], "electric")?.band).toBe("weak");
    });

    it("sets weakCount to the number of members taking 2× or more", () => {
        // ice: bulbasaur (grass/poison) takes 2×, a grass/flying member 4×
        const hoppip = makePokemon({ id: 187, types: ["grass", "flying"] });
        expect(band([bulbasaur, hoppip, SQUIRTLE], "ice")).toMatchObject({
            band: "weak",
            weakCount: 2,
        });
    });

    it("assigns 'resistant' when no member is weak and one is resistant", () => {
        // squirtle (water): fire attacker → 0.5× (resistant)
        expect(band([SQUIRTLE], "fire")).toMatchObject({
            band: "resistant",
            weakCount: 0,
        });
    });

    it("counts a ¼× member as resistant", () => {
        // bulbasaur (grass/poison) takes 0.25× from grass
        expect(band([bulbasaur], "grass")?.band).toBe("resistant");
    });

    it("assigns 'neutral' when every member takes 1×", () => {
        // EFFICACY has no water → normal entry
        expect(band([DITTO], "water")?.band).toBe("neutral");
    });

    it("assigns 'immune' when a member takes 0×, over a resistance", () => {
        // ground takes 0× from electric. 0× is also ≤ 0.5×, so this fails if
        // resistant were checked before immune
        const ground = makePokemon({ id: 999, types: ["ground"] });
        expect(band([ground], "electric")).toMatchObject({
            band: "immune",
            weakCount: 0,
        });
    });

    it("weak takes priority over immune (Weak > Immune band priority)", () => {
        // electric attacker: ground-type takes 0× (immune), water-type takes 2× (weak)
        // one member's immunity must not hide another member's weakness
        const ground = makePokemon({ id: 998, types: ["ground"] });
        expect(band([ground, SQUIRTLE], "electric")).toMatchObject({
            band: "weak",
            weakCount: 1,
        });
    });
});

// ── computeOffensiveCoverage ──────────────────────────────────────────────────

describe("computeOffensiveCoverage", () => {
    const covered = (party: PokemonDetails[], efficacy = EFFICACY) =>
        computeOffensiveCoverage(party, efficacy)
            .filter((e) => e.covered)
            .map((e) => e.type);

    it("returns one uncovered entry per type, in TYPE_ORDER, for an empty party", () => {
        const result = computeOffensiveCoverage([], EFFICACY);
        expect(result.map((e) => e.type)).toEqual([...TYPE_ORDER]);
        expect(result.every((e) => !e.covered)).toBe(true);
    });

    it("covers exactly the types a member hits for 2× or more", () => {
        // squirtle (water) hits fire 2×; water and grass only 0.5×
        expect(covered([SQUIRTLE])).toEqual(["fire"]);
    });

    it("combines coverage across party members", () => {
        // bulbasaur covers water; charmander (fire) covers grass and ice
        expect(covered([bulbasaur, CHARMANDER])).toEqual([
            "water",
            "grass",
            "ice",
        ]);
    });

    it("checks both types of a dual-type member independently", () => {
        // normal hits nothing for 2×; the second type, water, covers fire
        const member = makePokemon({ id: 600, types: ["normal", "water"] });
        expect(covered([member])).toEqual(["fire"]);
    });

    it("lets a type missing from the chart contribute nothing", () => {
        const dragon = makePokemon({ id: 147, types: ["dragon"] });
        expect(covered([dragon, CHARMANDER])).toEqual(["grass", "ice"]);
    });
});

// ── hasTypeData ───────────────────────────────────────────────────────────────

describe("hasTypeData", () => {
    it("knows a type that is an attacking row", () => {
        expect(hasTypeData(["fire"], EFFICACY)).toBe(true);
    });

    it("knows a type that only appears as a defender", () => {
        // poison has no row in EFFICACY, but grass → poison is a column
        expect(hasTypeData(["grass", "poison"], EFFICACY)).toBe(true);
    });

    it("does not know a type the chart never mentions", () => {
        expect(hasTypeData(["dragon"], EFFICACY)).toBe(false);
        expect(hasTypeData(["fire", "dragon"], EFFICACY)).toBe(false);
    });
});

// ── computeThreatGrid ─────────────────────────────────────────────────────────

describe("computeThreatGrid", () => {
    it("returns a row per member, in party order, with a key per threat", () => {
        const party = [bulbasaur, CHARMANDER, SQUIRTLE, DITTO, MEWTWO, MEW];
        const result = computeThreatGrid(
            party,
            ["fire", "water", "grass"],
            EFFICACY
        );
        expect(result.map((row) => row.pokemon)).toEqual(party);
        for (const row of result) {
            expect(Object.keys(row.multipliers)).toEqual([
                "fire",
                "water",
                "grass",
            ]);
        }
    });

    it("reads each threat's multiplier, 1× when the member is neutral", () => {
        // squirtle (water): grass 2×, fire 0.5×, normal 1×
        const [row] = computeThreatGrid(
            [SQUIRTLE],
            ["grass", "fire", "normal"],
            EFFICACY
        );
        expect(row.multipliers).toEqual({ grass: 2, fire: 0.5, normal: 1 });
    });

    it("keeps a 0× immunity rather than reading it as neutral", () => {
        // pidgey (normal/flying) takes 0× from ground
        const [row] = computeThreatGrid([PIDGEY], ["ground"], EFFICACY);
        expect(row.multipliers.ground).toBe(0);
    });
});

// ── rankReplacements ──────────────────────────────────────────────────────────

describe("rankReplacements", () => {
    // EFFICACY: grass hits water; fire hits grass and ice; electric hits water
    // and flying; ground hits electric and fire; water hits fire
    const mon = (
        id: number,
        types: PokemonDetails["types"],
        overrides: Partial<PokemonDetails> = {}
    ) => makePokemon({ id, name: `mon-${id}`, types, ...overrides });

    it("returns null with fewer than 2 members", () => {
        expect(rankReplacements([bulbasaur], DEX, EFFICACY)).toBeNull();
        expect(rankReplacements([], DEX, EFFICACY)).toBeNull();
        expect(
            rankReplacements([null, bulbasaur, null], DEX, EFFICACY)
        ).toBeNull();
    });

    it("returns null when the party covers every type", () => {
        const efficacy: TypeEfficacy = {
            normal: Object.fromEntries(TYPE_ORDER.map((type) => [type, 2])),
        };
        const party = [DITTO, mon(143, ["normal"])];
        expect(rankReplacements(party, DEX, efficacy)).toBeNull();
    });

    it("picks the member adding the fewest unique types and reports its real slot", () => {
        // bulbasaur only adds water; charmander adds grass and ice
        const party = [null, bulbasaur, null, CHARMANDER, null, null];
        const result = rankReplacements(party, [...DEX, PIKACHU], EFFICACY);
        expect(result?.currentPokemon.id).toBe(bulbasaur.id);
        expect(result?.slotIndex).toBe(1);
    });

    it("does not suggest a swap that trades one gap for another", () => {
        // squirtle closes fire but loses water (only bulbasaur covered it):
        // net 0. pikachu keeps water and adds flying: net +1
        const result = rankReplacements(
            [bulbasaur, CHARMANDER],
            [...DEX, PIKACHU],
            EFFICACY
        );
        expect(result?.candidates.map((c) => c.id)).toEqual([PIKACHU.id]);
    });

    it("ranks by net gain, then by lower id, and returns at most 3", () => {
        const dex = [
            bulbasaur,
            CHARMANDER,
            mon(30, ["electric"]), // +1 (water kept, flying added)
            mon(31, ["electric", "ground"]), // +3 (flying, electric, fire)
            mon(32, ["ground"]), // +1 (electric, fire added; water lost)
            mon(33, ["electric"]), // +1, but fourth
        ];
        const result = rankReplacements([bulbasaur, CHARMANDER], dex, EFFICACY);
        expect(result?.candidates.map((c) => c.id)).toEqual([31, 30, 32]);
    });

    it("only offers default forms of species not already in the party, from the same generation", () => {
        const dex = [
            bulbasaur,
            CHARMANDER,
            mon(40, ["electric"], { isDefault: false }), // a mega/gmax form
            mon(41, ["electric"], { speciesId: bulbasaur.speciesId }), // same species
            mon(42, ["electric"], { generationId: 2 }), // other generation
            mon(43, ["electric"]),
        ];
        const result = rankReplacements([bulbasaur, CHARMANDER], dex, EFFICACY);
        expect(result?.candidates.map((c) => c.id)).toEqual([43]);
    });

    it("breaks a tie for weakest by the highest id", () => {
        // both fire: neither adds a type the other does not
        const party = [mon(5, ["fire"]), mon(10, ["fire"])];
        const result = rankReplacements(party, [...party, SQUIRTLE], EFFICACY);
        expect(result?.currentPokemon.id).toBe(10);
        expect(result?.slotIndex).toBe(1);
        expect(result?.candidates.map((c) => c.id)).toEqual([SQUIRTLE.id]);
    });

    it("returns null when no same-generation candidate has a net gain", () => {
        // pichu (gen 2) ties charmander and wins on id; DEX has no other gen 2
        expect(rankReplacements([PICHU, CHARMANDER], DEX, EFFICACY)).toBeNull();
    });
});
