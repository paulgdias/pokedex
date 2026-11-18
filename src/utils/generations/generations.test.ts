import { describe, expect, it } from "vitest";

import { countByGeneration, getGeneration } from ".";

describe("generations", () => {
    // the GENERATIONS table itself is data; Nav and the search filter tests
    // cover how its ids are used
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
