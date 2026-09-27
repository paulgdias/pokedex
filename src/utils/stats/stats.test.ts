import { describe, expect, it } from "vitest";

import { EFFICACY } from "@components/__fixtures__/pokemon";

import {
    MAX_STAT,
    STAT_LABELS,
    TYPE_ORDER,
    describeMatchup,
    formatFlavorText,
    formatHeight,
    formatName,
    formatWeight,
    getFemaleShare,
    getOffense,
    getTypeMatchups,
} from ".";

describe("formatting", () => {
    it("title-cases hyphenated names", () => {
        expect(formatName("lightning-rod")).toBe("Lightning Rod");
        expect(formatName("mew")).toBe("Mew");
        expect(formatName("")).toBe("");
    });

    it("collapses PokeAPI's hard wraps into single spaces", () => {
        expect(formatFlavorText("It can\nfly\fhigh.  Very high. ")).toBe(
            "It can fly high. Very high."
        );
        expect(formatFlavorText("a\n\n\nb")).toBe("a b");
    });

    it("formats height from decimetres in metres and feet", () => {
        expect(formatHeight(7)).toBe("0.7 m (2′04″)");
        expect(formatHeight(17)).toBe("1.7 m (5′07″)");
        expect(formatHeight(100)).toBe("10.0 m (32′10″)");
    });

    it("formats weight from hectograms in kilograms and pounds", () => {
        expect(formatWeight(69)).toBe("6.9 kg (15.2 lb)");
        expect(formatWeight(1000)).toBe("100.0 kg (220.5 lb)");
    });

    it("gives the female share, or null for genderless", () => {
        expect(getFemaleShare(-1)).toBeNull();
        expect(getFemaleShare(0)).toBe(0);
        expect(getFemaleShare(1)).toBe(0.125);
        expect(getFemaleShare(8)).toBe(1);
    });

    it("has six stat labels and a maximum of 255", () => {
        expect(STAT_LABELS).toHaveLength(6);
        expect(MAX_STAT).toBe(255);
    });
});

describe("getTypeMatchups", () => {
    it("groups by multiplier from strongest to weakest, skipping neutral", () => {
        const groups = getTypeMatchups(["grass", "flying"], EFFICACY);
        expect(groups.map(({ multiplier }) => multiplier)).toEqual([
            4, 2, 0.5, 0.25, 0,
        ]);
        expect(
            groups.find(({ multiplier }) => multiplier === 4)?.types
        ).toEqual(["ice"]);
        expect(
            groups.find(({ multiplier }) => multiplier === 0)?.types
        ).toEqual(["ground"]);
        expect(groups.map(({ label }) => label)).toEqual([
            "4×",
            "2×",
            "½×",
            "¼×",
            "0×",
        ]);
    });

    it("treats a missing pairing as neutral", () => {
        expect(getTypeMatchups(["dragon"], EFFICACY)).toEqual([]);
    });

    it("multiplies across both defending types", () => {
        const [group] = getTypeMatchups(["grass", "poison"], EFFICACY);
        expect(group.multiplier).toBe(2);
        expect(group.types).toEqual(["fire", "ice"]);
    });

    it("has no groups for an empty efficacy map", () => {
        expect(getTypeMatchups(["fire"], {})).toEqual([]);
    });
});

describe("getOffense", () => {
    it("lists what an attacker hits for 2×, ½× and 0×, in the games' order", () => {
        expect(getOffense("fire", EFFICACY)).toEqual([
            { multiplier: 2, label: "2×", types: ["grass", "ice"] },
            { multiplier: 0.5, label: "½×", types: ["fire", "water"] },
            { multiplier: 0, label: "0×", types: [] },
        ]);
    });

    it("finds immunities", () => {
        expect(getOffense("normal", EFFICACY)[2].types).toEqual(["ghost"]);
    });

    it("is empty for an unknown attacker", () => {
        expect(
            getOffense("shadow", EFFICACY).every((g) => g.types.length === 0)
        ).toBe(true);
    });

    it("orders defenders by TYPE_ORDER", () => {
        expect(TYPE_ORDER).toHaveLength(18);
        expect(TYPE_ORDER[0]).toBe("normal");
    });
});

describe("describeMatchup", () => {
    it.each([
        [4, "Fire → Grass: 4× (double super effective)"],
        [2, "Fire → Grass: 2× (super effective)"],
        [1, "Fire → Grass: 1× (neutral)"],
        [0.5, "Fire → Grass: ½× (not very effective)"],
        [0.25, "Fire → Grass: ¼× (barely effective)"],
        [0, "Fire → Grass: 0× (no effect)"],
    ])("describes %s×", (multiplier, text) => {
        expect(describeMatchup("fire", "grass", multiplier)).toBe(text);
    });

    it("falls back to the bare number for an unusual multiplier", () => {
        expect(describeMatchup("fire", "grass", 8)).toBe("Fire → Grass: 8×");
    });
});
