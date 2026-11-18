import { describe, expect, it } from "vitest";

import {
    bulbasaur,
    CHARMANDER,
    DEX,
    DITTO,
    EFFICACY,
    MEW,
    MEWTWO,
    makeDex,
    makePokemon,
    PICHU,
    PIKACHU,
    SQUIRTLE,
} from "@components/__fixtures__/pokemon";
import { PokemonDetails, TypeEfficacy } from "@customTypes/PokemonTypes";

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

    it("returns 6 nulls when there are fewer than 6 values", () => {
        expect(parseParty("1,4,7,0,0", DEX)).toEqual(Array(6).fill(null));
    });

    it("returns 6 nulls when there are more than 6 values", () => {
        expect(parseParty("1,4,7,0,0,0,150", DEX)).toEqual(Array(6).fill(null));
    });

    it("treats unknown ids as null", () => {
        const result = parseParty("9999,1,4,0,0,0", DEX);
        expect(result[0]).toBeNull();
        expect(result[1]?.id).toBe(1);
    });

    it("treats explicit 0 as null", () => {
        const result = parseParty("0,0,0,0,0,0", DEX);
        expect(result).toEqual(Array(6).fill(null));
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

    it("handles a mix of valid, 0, and unknown ids", () => {
        // 99998 is not in DEX so it becomes null; 999 IS in DEX (MISSINGNO)
        const result = parseParty("1,0,99998,7,150,0", DEX);
        expect(result[0]?.id).toBe(1);
        expect(result[1]).toBeNull();
        expect(result[2]).toBeNull();
        expect(result[3]?.id).toBe(7);
        expect(result[4]?.id).toBe(150);
        expect(result[5]).toBeNull();
    });
});

describe("serializeParty", () => {
    it("serialises filled slots as their ids", () => {
        const party = [bulbasaur, CHARMANDER, null, null, null, null];
        expect(serializeParty(party)).toBe("1,4,0,0,0,0");
    });

    it("serialises all nulls as six zeros", () => {
        expect(serializeParty([null, null, null, null, null, null])).toBe(
            "0,0,0,0,0,0"
        );
    });

    it("round-trips through parseParty", () => {
        const original = [bulbasaur, null, CHARMANDER, null, SQUIRTLE, null];
        const restored = parseParty(serializeParty(original), DEX);
        expect(restored.map((p) => p?.id ?? null)).toEqual(
            original.map((p) => p?.id ?? null)
        );
    });
});

describe("parseThreats", () => {
    it("returns a valid list unchanged", () => {
        expect(parseThreats("fire,water,grass")).toEqual([
            "fire",
            "water",
            "grass",
        ]);
    });

    it("caps the result at 3", () => {
        const result = parseThreats("fire,water,grass,electric,ice");
        expect(result).toHaveLength(3);
        expect(result).toEqual(["fire", "water", "grass"]);
    });

    it("filters out unknown type names", () => {
        const result = parseThreats("fire,banana,water");
        expect(result).toEqual(["fire", "water"]);
    });

    it("handles mixed valid and invalid", () => {
        const result = parseThreats("unknown,fire,bogus,water,oops,grass,ice");
        expect(result).toEqual(["fire", "water", "grass"]);
    });

    it("returns an empty array for null", () => {
        expect(parseThreats(null)).toEqual([]);
    });

    it("returns an empty array for an empty string", () => {
        expect(parseThreats("")).toEqual([]);
    });

    it("preserves the original order of valid types", () => {
        expect(parseThreats("ice,fire")).toEqual(["ice", "fire"]);
    });
});

describe("parseThreats duplicates", () => {
    it("keeps each type once, at its first position", () => {
        expect(parseThreats("fire,fire,water,fire,grass")).toEqual([
            "fire",
            "water",
            "grass",
        ]);
    });
});

describe("serializeThreats", () => {
    it("joins with commas", () => {
        expect(serializeThreats(["fire", "water"])).toBe("fire,water");
    });

    it("returns empty string for no threats", () => {
        expect(serializeThreats([])).toBe("");
    });

    it("round-trips through parseThreats", () => {
        const threats = ["fire", "electric", "ice"];
        expect(parseThreats(serializeThreats(threats))).toEqual(threats);
    });
});

// ── computeDefensiveProfile ───────────────────────────────────────────────────

describe("computeDefensiveProfile", () => {
    it("returns exactly 18 entries", () => {
        const result = computeDefensiveProfile([bulbasaur], EFFICACY);
        expect(result).toHaveLength(18);
    });

    it("assigns 'weak' when a single-type member takes 2× from an attacker", () => {
        // squirtle (water) takes 2× from grass and electric
        const result = computeDefensiveProfile([SQUIRTLE], EFFICACY);
        const grassEntry = result.find((e) => e.type === "grass");
        const electricEntry = result.find((e) => e.type === "electric");
        expect(grassEntry?.band).toBe("weak");
        expect(electricEntry?.band).toBe("weak");
    });

    it("sets weakCount to the number of members that take 2× or more", () => {
        // squirtle (water) takes 2× from grass; bulbasaur (grass/poison) takes
        // 0.25× (not weak). So weakCount = 1, not 2.
        const result = computeDefensiveProfile([bulbasaur, SQUIRTLE], EFFICACY);
        const grassEntry = result.find((e) => e.type === "grass");
        expect(grassEntry?.band).toBe("weak");
        expect(grassEntry?.weakCount).toBe(1);
    });

    it("weakCount is 1 when only one member is weak", () => {
        // only bulbasaur takes 2× from fire; squirtle takes 0.5× from fire
        const result = computeDefensiveProfile([bulbasaur, SQUIRTLE], EFFICACY);
        const fireEntry = result.find((e) => e.type === "fire");
        expect(fireEntry?.band).toBe("weak");
        expect(fireEntry?.weakCount).toBe(1);
    });

    it("assigns 'resistant' when no member is weak and one is resistant", () => {
        // squirtle (water): fire attacker → 0.5× (resistant)
        const result = computeDefensiveProfile([SQUIRTLE], EFFICACY);
        const fireEntry = result.find((e) => e.type === "fire");
        expect(fireEntry?.band).toBe("resistant");
        expect(fireEntry?.weakCount).toBe(0);
    });

    it("assigns 'neutral' when every member takes 1×", () => {
        // ditto (normal): all attackers in EFFICACY that don't target normal hit it for 1×
        // 'water' attacker has no entry for 'normal' defender → 1×
        const result = computeDefensiveProfile([DITTO], EFFICACY);
        const waterEntry = result.find((e) => e.type === "water");
        expect(waterEntry?.band).toBe("neutral");
    });

    it("assigns 'immune' when at least one member takes 0×", () => {
        // ditto (normal): 'normal' attacker hits ghost for 0×
        // but ditto IS normal type (defender), not ghost
        // electric attacker hits ground for 0× — so a ground-type member would be immune to electric
        // Let's make a custom ground-type pokemon
        const groundPokemon = makePokemon({
            id: 999,
            types: ["ground"],
        });
        const result = computeDefensiveProfile([groundPokemon], EFFICACY);
        const electricEntry = result.find((e) => e.type === "electric");
        expect(electricEntry?.band).toBe("immune");
        expect(electricEntry?.weakCount).toBe(0);
    });

    it("weak takes priority over immune (Weak > Immune band priority)", () => {
        // electric attacker: ground-type takes 0× (immune), water-type takes 2× (weak)
        // one member's immunity must not hide another member's weakness
        const groundPokemon = makePokemon({ id: 998, types: ["ground"] });
        const result = computeDefensiveProfile(
            [groundPokemon, SQUIRTLE],
            EFFICACY
        );
        const electricEntry = result.find((e) => e.type === "electric");
        expect(electricEntry?.band).toBe("weak");
        expect(electricEntry?.weakCount).toBe(1);
    });

    it("weakCount is 0 for non-weak bands", () => {
        const result = computeDefensiveProfile([bulbasaur], EFFICACY);
        const resistantEntry = result.find((e) => e.band === "resistant");
        const neutralEntry = result.find((e) => e.band === "neutral");
        expect(resistantEntry?.weakCount).toBe(0);
        expect(neutralEntry?.weakCount).toBe(0);
    });

    it("handles a dual-type member correctly (product of both type multipliers)", () => {
        // bulbasaur is grass/poison
        // 'grass' attacker: grass vs grass=0.5, grass vs poison=0.5 → 0.25× (¼×)
        const result = computeDefensiveProfile([bulbasaur], EFFICACY);
        const grassEntry = result.find((e) => e.type === "grass");
        // 0.25× is ≤ 0.5 → resistant
        expect(grassEntry?.band).toBe("resistant");
    });

    it("returns neutral for all types when party has only normal-type with no weaknesses", () => {
        // ditto (normal) has no entries in EFFICACY for normal as defender
        // normal attacker targets ghost but ditto is normal type, not ghost
        const result = computeDefensiveProfile([DITTO], EFFICACY);
        const normalEntry = result.find((e) => e.type === "normal");
        // normal attacker has ghost=0, but ditto is 'normal' not 'ghost' → 1× → neutral
        expect(normalEntry?.band).toBe("neutral");
    });

    it("returns empty result for an empty party", () => {
        const result = computeDefensiveProfile([], EFFICACY);
        // All types have no members → neutral (every member takes 1× vacuously false → neutral)
        expect(result).toHaveLength(18);
        // With empty party, all are neutral
        for (const entry of result) {
            expect(entry.band).toBe("neutral");
        }
    });
});

// ── computeOffensiveCoverage ──────────────────────────────────────────────────

describe("computeOffensiveCoverage", () => {
    it("returns exactly 18 entries", () => {
        const result = computeOffensiveCoverage([bulbasaur], EFFICACY);
        expect(result).toHaveLength(18);
    });

    it("marks types as covered when a member can hit for 2×", () => {
        // bulbasaur (grass/poison): grass covers water for 2×
        const result = computeOffensiveCoverage([bulbasaur], EFFICACY);
        const waterEntry = result.find((e) => e.type === "water");
        expect(waterEntry?.covered).toBe(true);
    });

    it("marks types as gaps when no member hits for 2×", () => {
        // bulbasaur (grass/poison): fire is a gap — grass hits fire for 0.5×
        const result = computeOffensiveCoverage([bulbasaur], EFFICACY);
        const fireEntry = result.find((e) => e.type === "fire");
        expect(fireEntry?.covered).toBe(false);
    });

    it("combines coverage across party members", () => {
        // bulbasaur covers water; charmander (fire) covers grass and ice
        const result = computeOffensiveCoverage(
            [bulbasaur, CHARMANDER],
            EFFICACY
        );
        const waterEntry = result.find((e) => e.type === "water");
        const grassEntry = result.find((e) => e.type === "grass");
        const iceEntry = result.find((e) => e.type === "ice");
        expect(waterEntry?.covered).toBe(true);
        expect(grassEntry?.covered).toBe(true);
        expect(iceEntry?.covered).toBe(true);
    });

    it("adds squirtle's fire coverage to the two-starter party", () => {
        const result = computeOffensiveCoverage(
            [bulbasaur, CHARMANDER, SQUIRTLE],
            EFFICACY
        );
        const fireEntry = result.find((e) => e.type === "fire");
        expect(fireEntry?.covered).toBe(true);
    });

    it("returns all gaps when party is empty", () => {
        const result = computeOffensiveCoverage([], EFFICACY);
        expect(result).toHaveLength(18);
        for (const entry of result) {
            expect(entry.covered).toBe(false);
        }
    });

    it("checks both types of a dual-type member independently", () => {
        // bulbasaur is grass/poison: grass covers water; test that poison is also checked
        // poison is not in EFFICACY so it contributes nothing — grass still covers water
        const result = computeOffensiveCoverage([bulbasaur], EFFICACY);
        const waterEntry = result.find((e) => e.type === "water");
        expect(waterEntry?.covered).toBe(true);
    });

    it("does not mark types as covered when attacker only deals 0.5×", () => {
        // fire attacker hits water for 0.5× — water coverage is NOT from fire
        // squirtle (water) has grass and electric as weaknesses but only covers fire
        const result = computeOffensiveCoverage([SQUIRTLE], EFFICACY);
        const waterEntry = result.find((e) => e.type === "water");
        // water attacker vs water defender = 0.5× → NOT covered by squirtle
        expect(waterEntry?.covered).toBe(false);
        const fireEntry = result.find((e) => e.type === "fire");
        // water attacker vs fire defender = 2× → covered
        expect(fireEntry?.covered).toBe(true);
    });
});

// ── computeThreatGrid ─────────────────────────────────────────────────────────

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

describe("computeOffensiveCoverage with missing type data", () => {
    it("lets a type missing from the chart contribute nothing", () => {
        const dragon = makePokemon({ id: 147, types: ["dragon"] });
        const result = computeOffensiveCoverage([dragon, CHARMANDER], EFFICACY);
        expect(result.filter((e) => e.covered).map((e) => e.type)).toEqual([
            "grass",
            "ice",
        ]);
    });
});

describe("computeThreatGrid", () => {
    it("returns one row per party member", () => {
        const result = computeThreatGrid(
            [bulbasaur, CHARMANDER],
            ["fire"],
            EFFICACY
        );
        expect(result).toHaveLength(2);
    });

    it("returns one multiplier per threat per row", () => {
        const result = computeThreatGrid(
            [bulbasaur],
            ["fire", "water"],
            EFFICACY
        );
        expect(Object.keys(result[0].multipliers)).toHaveLength(2);
    });

    it("computes 2× for a weak matchup (1 member × 1 threat)", () => {
        // squirtle (water) vs grass threat → water takes 2× from grass
        const result = computeThreatGrid([SQUIRTLE], ["grass"], EFFICACY);
        expect(result[0].multipliers["grass"]).toBe(2);
    });

    it("computes 0.5× for a resistant matchup", () => {
        // squirtle (water) vs fire threat → water takes 0.5× from fire
        const result = computeThreatGrid([SQUIRTLE], ["fire"], EFFICACY);
        expect(result[0].multipliers["fire"]).toBe(0.5);
    });

    it("computes 1× for a neutral matchup", () => {
        // ditto (normal) vs water threat → normal takes 1× from water
        const result = computeThreatGrid([DITTO], ["water"], EFFICACY);
        expect(result[0].multipliers["water"]).toBe(1);
    });

    it("computes 0× for an immune matchup", () => {
        // ground-type pokemon vs electric threat → ground is immune (0×)
        const groundPokemon = makePokemon({ id: 997, types: ["ground"] });
        const result = computeThreatGrid(
            [groundPokemon],
            ["electric"],
            EFFICACY
        );
        expect(result[0].multipliers["electric"]).toBe(0);
    });

    it("handles 6 members × 3 threats", () => {
        const party = [bulbasaur, CHARMANDER, SQUIRTLE, DITTO, MEWTWO, MEW];
        const threats = ["fire", "water", "grass"];
        const result = computeThreatGrid(party, threats, EFFICACY);
        expect(result).toHaveLength(6);
        for (const row of result) {
            expect(Object.keys(row.multipliers)).toHaveLength(3);
            expect(Object.keys(row.multipliers)).toEqual(
                expect.arrayContaining(["fire", "water", "grass"])
            );
        }
    });

    it("uses the dual-type product for multipliers", () => {
        // bulbasaur (grass/poison): grass attacker vs grass=0.5, grass vs poison=0.5 → 0.25×
        const result = computeThreatGrid([bulbasaur], ["grass"], EFFICACY);
        expect(result[0].multipliers["grass"]).toBe(0.25);
    });

    it("returns empty array for empty party", () => {
        const result = computeThreatGrid([], ["fire"], EFFICACY);
        expect(result).toHaveLength(0);
    });

    it("returns rows with empty multipliers for no threats", () => {
        const result = computeThreatGrid([bulbasaur], [], EFFICACY);
        expect(result).toHaveLength(1);
        expect(result[0].multipliers).toEqual({});
    });

    it("includes the pokemon reference in each row", () => {
        const result = computeThreatGrid([bulbasaur], ["fire"], EFFICACY);
        expect(result[0].pokemon).toBe(bulbasaur);
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
            normal: Object.fromEntries(
                ["normal", "fire", "water", "electric", "grass", "ice"]
                    .concat(["fighting", "poison", "ground", "flying"])
                    .concat(["psychic", "bug", "rock", "ghost", "dragon"])
                    .concat(["dark", "steel", "fairy"])
                    .map((type) => [type, 2])
            ),
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
