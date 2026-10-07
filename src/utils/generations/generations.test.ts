import { describe, expect, it } from "vitest";

import { countByGeneration, GENERATIONS, getGeneration } from ".";

describe("generations", () => {
    it("lists generations 1-9 in order with roman numerals and regions", () => {
        expect(GENERATIONS.map(({ id }) => id)).toEqual([
            1, 2, 3, 4, 5, 6, 7, 8, 9,
        ]);
        expect(GENERATIONS[0]).toEqual({ id: 1, roman: "I", region: "Kanto" });
        expect(GENERATIONS[8]).toEqual({
            id: 9,
            roman: "IX",
            region: "Paldea",
        });
    });

    it("looks a generation up by id", () => {
        expect(getGeneration(5)?.region).toBe("Unova");
    });

    it("returns undefined for null or an unknown id", () => {
        expect(getGeneration(null)).toBeUndefined();
        expect(getGeneration(10)).toBeUndefined();
    });

    it("counts pokémon per generation, leaving out empty ones", () => {
        const counts = countByGeneration([
            { generationId: 1 },
            { generationId: 1 },
            { generationId: 3 },
        ]);
        expect(counts.get(1)).toBe(2);
        expect(counts.get(3)).toBe(1);
        expect(counts.has(2)).toBe(false);
        expect(countByGeneration([]).size).toBe(0);
    });
});
