import { describe, expect, it } from "vitest";

import { SORT_KEYS, SortKey, SortState } from "@customTypes/SortingTypes";

import {
    CHARMANDER,
    MEW,
    MEWTWO,
    PICHU,
    SQUIRTLE,
    bulbasaur,
    makePokemon,
} from "@components/__fixtures__/pokemon";

import {
    DEFAULT_SORT,
    getNextSort,
    getSortFromURLParams,
    getSortLabel,
    sortPokemon,
    withSort,
} from ".";

const ids = (
    state: SortState,
    list = [SQUIRTLE, MEWTWO, bulbasaur, MEW, CHARMANDER, PICHU]
) => sortPokemon(list, state).map((p) => p.id);

describe("sortPokemon", () => {
    it("defaults to Bulbasaur first", () => {
        expect(DEFAULT_SORT).toEqual({ key: "id", direction: "asc" });
        expect(ids(DEFAULT_SORT)).toEqual([1, 4, 7, 150, 151, 172]);
    });

    it("reverses for desc", () => {
        expect(ids({ key: "id", direction: "desc" })).toEqual([
            172, 151, 150, 7, 4, 1,
        ]);
    });

    it("sorts by name", () => {
        expect(
            sortPokemon([SQUIRTLE, bulbasaur, MEW], {
                key: "name",
                direction: "asc",
            }).map((p) => p.name)
        ).toEqual(["bulbasaur", "mew", "squirtle"]);
    });

    it("sorts by primary type only, ties by id", () => {
        const dual = makePokemon({
            id: 20,
            name: "z",
            types: ["fire", "water"],
        });
        expect(
            sortPokemon([SQUIRTLE, dual, CHARMANDER], {
                key: "type",
                direction: "asc",
            }).map((p) => p.id)
        ).toEqual([4, 20, 7]);
    });

    it("sorts pokémon without a type before typed ones", () => {
        const typeless = makePokemon({ id: 30, name: "q", types: [] });
        expect(
            sortPokemon([CHARMANDER, typeless], {
                key: "type",
                direction: "asc",
            })[0].id
        ).toBe(30);
    });

    it("puts legendaries first when ascending, mythicals likewise", () => {
        expect(ids({ key: "isLegendary", direction: "asc" })[0]).toBe(150);
        expect(ids({ key: "isMythical", direction: "asc" })[0]).toBe(151);
        expect(ids({ key: "isLegendary", direction: "desc" }).at(-1)).toBe(150);
    });

    it("sorts by stat total and by each stat", () => {
        expect(ids({ key: "total", direction: "desc" })[0]).toBe(150);
        expect(ids({ key: "total", direction: "asc" })[0]).toBe(172);
        const bySpeed = ids({ key: "speed", direction: "desc" });
        expect(bySpeed[0]).toBe(150);
        expect(ids({ key: "hp", direction: "asc" })[0]).toBe(172);
        expect(ids({ key: "attack", direction: "desc" })[0]).toBe(150);
        expect(ids({ key: "defense", direction: "desc" })[0]).toBe(151);
        expect(ids({ key: "specialAttack", direction: "desc" })[0]).toBe(150);
        expect(ids({ key: "specialDefense", direction: "desc" })[0]).toBe(151);
    });

    it("treats a missing stat as 0", () => {
        const sparse = makePokemon({ id: 40, name: "s", stats: [] });
        expect(
            sortPokemon([bulbasaur, sparse], { key: "hp", direction: "asc" })[0]
                .id
        ).toBe(40);
    });

    it("breaks ties by ascending id whatever the direction", () => {
        const a = makePokemon({ id: 2, name: "x", statTotal: 100 });
        const b = makePokemon({ id: 1, name: "y", statTotal: 100 });
        const c = makePokemon({ id: 3, name: "z", statTotal: 100 });
        expect(ids({ key: "total", direction: "asc" }, [c, a, b])).toEqual([
            1, 2, 3,
        ]);
        expect(ids({ key: "total", direction: "desc" }, [c, a, b])).toEqual([
            1, 2, 3,
        ]);
    });

    it("does not mutate its input", () => {
        const input = [SQUIRTLE, bulbasaur];
        sortPokemon(input, DEFAULT_SORT);
        expect(input[0]).toBe(SQUIRTLE);
    });

    it("has a comparator for every sort key", () => {
        for (const key of SORT_KEYS) {
            expect(() =>
                sortPokemon([bulbasaur, SQUIRTLE], { key, direction: "asc" })
            ).not.toThrow();
        }
    });
});

describe("getNextSort", () => {
    it("flips asc to desc on the same key", () => {
        expect(getNextSort({ key: "name", direction: "asc" }, "name")).toEqual({
            key: "name",
            direction: "desc",
        });
    });

    it("goes back to asc when already desc", () => {
        expect(getNextSort({ key: "name", direction: "desc" }, "name")).toEqual(
            {
                key: "name",
                direction: "asc",
            }
        );
    });

    it("starts a new key at asc", () => {
        expect(getNextSort({ key: "name", direction: "desc" }, "id")).toEqual({
            key: "id",
            direction: "asc",
        });
    });
});

describe("sort URL param", () => {
    it("reads key:direction", () => {
        expect(
            getSortFromURLParams(new URLSearchParams("sort=hp:desc"))
        ).toEqual({ key: "hp", direction: "desc" });
    });

    it("defaults a missing or unknown direction to asc", () => {
        expect(getSortFromURLParams(new URLSearchParams("sort=name"))).toEqual({
            key: "name",
            direction: "asc",
        });
        expect(
            getSortFromURLParams(new URLSearchParams("sort=name:sideways"))
        ).toEqual({ key: "name", direction: "asc" });
    });

    it("falls back to the default for an invalid or missing key", () => {
        expect(
            getSortFromURLParams(new URLSearchParams("sort=bogus:desc"))
        ).toBe(DEFAULT_SORT);
        expect(getSortFromURLParams(new URLSearchParams("sort="))).toBe(
            DEFAULT_SORT
        );
        expect(getSortFromURLParams(new URLSearchParams(""))).toBe(
            DEFAULT_SORT
        );
    });

    it("writes the sort without touching other params or the input", () => {
        const params = new URLSearchParams("q=a");
        const next = withSort(params, { key: "total", direction: "desc" });
        expect(next.toString()).toBe("q=a&sort=total%3Adesc");
        expect(params.toString()).toBe("q=a");
    });

    it("round-trips every key", () => {
        for (const key of SORT_KEYS as readonly SortKey[]) {
            const state: SortState = { key, direction: "desc" };
            expect(
                getSortFromURLParams(withSort(new URLSearchParams(), state))
            ).toEqual(state);
        }
    });
});

describe("getSortLabel", () => {
    it("labels numbers low-high and high-low", () => {
        expect(getSortLabel({ key: "attack", direction: "desc" })).toBe(
            "Attack High–Low"
        );
        expect(getSortLabel({ key: "total", direction: "asc" })).toBe(
            "Total stats Low–High"
        );
        expect(getSortLabel({ key: "specialAttack", direction: "asc" })).toBe(
            "Sp. Atk Low–High"
        );
    });

    it("has a label for every key", () => {
        for (const key of SORT_KEYS) {
            expect(getSortLabel({ key, direction: "asc" })).not.toContain(
                "undefined"
            );
        }
    });
});
