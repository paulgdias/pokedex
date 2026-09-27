import { describe, expect, it } from "vitest";

import {
    DEX,
    MEW,
    MEWTWO,
    bulbasaur,
    makePokemon,
} from "@components/__fixtures__/pokemon";

import {
    CATEGORIES,
    EMPTY_FILTERS,
    POKEMON_TYPES,
    applyFilters,
    capitalize,
    formatPokedexNumber,
    getFilterSuggestions,
    getFiltersFromURLParams,
    getPokemonSuggestions,
    matchesText,
    withFilters,
} from ".";

const params = (query: string) => new URLSearchParams(query);
const names = (list: { name: string }[]) => list.map((p) => p.name);

describe("constants and formatting", () => {
    it("has the 18 types and two categories", () => {
        expect(POKEMON_TYPES).toHaveLength(18);
        expect(CATEGORIES).toEqual(["legendary", "mythical"]);
        expect(EMPTY_FILTERS).toEqual({
            text: "",
            generation: null,
            types: [],
            category: null,
        });
    });

    it("capitalizes", () => {
        expect(capitalize("fire")).toBe("Fire");
        expect(capitalize("")).toBe("");
    });

    it("pads dex numbers to four digits", () => {
        expect(formatPokedexNumber(1)).toBe("#0001");
        expect(formatPokedexNumber(1025)).toBe("#1025");
        expect(formatPokedexNumber(10033)).toBe("#10033");
    });
});

describe("URL params", () => {
    it("reads every filter", () => {
        expect(
            getFiltersFromURLParams(
                params("q=pika&gen=2&type=fire,water&only=mythical")
            )
        ).toEqual({
            text: "pika",
            generation: 2,
            types: ["fire", "water"],
            category: "mythical",
        });
    });

    it("defaults everything when the URL has no filters", () => {
        expect(getFiltersFromURLParams(params(""))).toEqual(EMPTY_FILTERS);
    });

    it("drops invalid values silently", () => {
        expect(
            getFiltersFromURLParams(
                params("gen=12&type=fire,bogus,,ice&only=epic")
            )
        ).toEqual({
            text: "",
            generation: null,
            types: ["fire", "ice"],
            category: null,
        });
        expect(
            getFiltersFromURLParams(params("gen=abc")).generation
        ).toBeNull();
        expect(getFiltersFromURLParams(params("gen=0")).generation).toBeNull();
    });

    it("writes filters, keeping unrelated params", () => {
        const next = withFilters(params("sort=id:asc&view=list"), {
            text: "mew",
            generation: 1,
            types: ["psychic", "fairy"],
            category: "mythical",
        });
        expect(Object.fromEntries(next)).toEqual({
            sort: "id:asc",
            view: "list",
            q: "mew",
            gen: "1",
            type: "psychic,fairy",
            only: "mythical",
        });
    });

    it("removes empty filters from the URL", () => {
        const next = withFilters(
            params("q=a&gen=3&type=fire&only=legendary&view=list"),
            EMPTY_FILTERS
        );
        expect(next.toString()).toBe("view=list");
    });

    it("does not mutate the params it is given", () => {
        const input = params("q=a");
        withFilters(input, { ...EMPTY_FILTERS, text: "b" });
        expect(input.toString()).toBe("q=a");
    });
});

describe("matchesText", () => {
    it("matches everything for blank text", () => {
        expect(matchesText(bulbasaur, "")).toBe(true);
        expect(matchesText(bulbasaur, "   ")).toBe(true);
        expect(matchesText(bulbasaur, "#")).toBe(true);
    });

    it("matches names as a case-insensitive substring", () => {
        expect(matchesText(bulbasaur, "SAUR")).toBe(true);
        expect(matchesText(bulbasaur, " bulba ")).toBe(true);
        expect(matchesText(bulbasaur, "char")).toBe(false);
    });

    it("matches numbers by prefix after stripping leading zeros and #", () => {
        const seven = makePokemon({ id: 7, name: "squirtle" });
        const seventy = makePokemon({ id: 70, name: "weepinbell" });
        const seventeen = makePokemon({ id: 17, name: "pidgeotto" });
        expect(matchesText(seven, "007")).toBe(true);
        expect(matchesText(seven, "#7")).toBe(true);
        expect(matchesText(seventy, "7")).toBe(true);
        expect(matchesText(seventeen, "7")).toBe(false);
        expect(matchesText(seven, "8")).toBe(false);
    });

    it("does not match a number against the name", () => {
        expect(matchesText(makePokemon({ name: "mon-7", id: 1 }), "7")).toBe(
            false
        );
    });
});

describe("applyFilters", () => {
    it("returns everything for empty filters", () => {
        expect(applyFilters(DEX, EMPTY_FILTERS)).toHaveLength(DEX.length);
    });

    it("filters by generation", () => {
        expect(
            names(applyFilters(DEX, { ...EMPTY_FILTERS, generation: 2 }))
        ).toEqual(["pichu"]);
    });

    it("ORs the selected types", () => {
        expect(
            names(
                applyFilters(DEX, {
                    ...EMPTY_FILTERS,
                    types: ["fire", "water"],
                })
            )
        ).toEqual(["charmander", "squirtle"]);
    });

    it("filters by category", () => {
        expect(
            names(
                applyFilters(DEX, { ...EMPTY_FILTERS, category: "legendary" })
            )
        ).toEqual(["mewtwo"]);
        expect(
            names(applyFilters(DEX, { ...EMPTY_FILTERS, category: "mythical" }))
        ).toEqual(["mew"]);
    });

    it("ANDs text, generation, category and types", () => {
        const both = {
            ...EMPTY_FILTERS,
            text: "mew",
            types: ["psychic" as const],
        };
        expect(names(applyFilters(DEX, both))).toEqual(["mewtwo", "mew"]);
        expect(
            names(applyFilters(DEX, { ...both, category: "mythical" }))
        ).toEqual(["mew"]);
        expect(names(applyFilters(DEX, { ...both, generation: 2 }))).toEqual(
            []
        );
    });
});

describe("getFilterSuggestions", () => {
    it("needs at least two characters", () => {
        expect(getFilterSuggestions("f", EMPTY_FILTERS)).toEqual([]);
        expect(getFilterSuggestions(" f ", EMPTY_FILTERS)).toEqual([]);
    });

    it("suggests types by prefix, adding to the selection and clearing the text", () => {
        const [fire] = getFilterSuggestions("fi", {
            ...EMPTY_FILTERS,
            types: ["water"],
        });
        expect(fire).toMatchObject({
            key: "type-fire",
            label: "Fire",
            kind: "type",
            type: "fire",
            patch: { types: ["water", "fire"], text: "" },
        });
    });

    it("suggests generations by region prefix, 'gen N' and 'genN'", () => {
        expect(getFilterSuggestions("joh", EMPTY_FILTERS)[0]).toMatchObject({
            key: "gen-2",
            label: "Johto",
            kind: "Gen II",
            patch: { generation: 2, text: "" },
        });
        expect(getFilterSuggestions("gen 3", EMPTY_FILTERS)[0].key).toBe(
            "gen-3"
        );
        expect(getFilterSuggestions("gen4", EMPTY_FILTERS)[0].key).toBe(
            "gen-4"
        );
        expect(getFilterSuggestions("GEN 5", EMPTY_FILTERS)[0].key).toBe(
            "gen-5"
        );
    });

    it("suggests categories by prefix", () => {
        expect(getFilterSuggestions("leg", EMPTY_FILTERS)[0]).toMatchObject({
            key: "only-legendary",
            label: "Legendary",
            kind: "only",
            patch: { category: "legendary", text: "" },
        });
        expect(getFilterSuggestions("my", EMPTY_FILTERS)[0].key).toBe(
            "only-mythical"
        );
    });

    it("lists types, then generations, then categories", () => {
        // "ka" -> Kalos + Kanto; add filters that match two kinds at once
        const keys = getFilterSuggestions("ic", EMPTY_FILTERS).map(
            (s) => s.key
        );
        expect(keys).toEqual(["type-ice"]);
        expect(
            getFilterSuggestions("ka", EMPTY_FILTERS).map((s) => s.key)
        ).toEqual(["gen-1", "gen-6"]);
    });

    it("leaves out filters that are already applied", () => {
        const applied = {
            text: "",
            generation: 1,
            types: ["fire" as const],
            category: "legendary" as const,
        };
        expect(getFilterSuggestions("fi", applied).map((s) => s.key)).toEqual([
            "type-fighting",
        ]);
        expect(getFilterSuggestions("kan", applied)).toEqual([]);
        expect(getFilterSuggestions("leg", applied)).toEqual([]);
    });

    it("suggests nothing when nothing matches", () => {
        expect(getFilterSuggestions("zz", EMPTY_FILTERS)).toEqual([]);
    });
});

describe("getPokemonSuggestions", () => {
    it("is empty for blank text", () => {
        expect(getPokemonSuggestions(DEX, "")).toEqual([]);
        expect(getPokemonSuggestions(DEX, "   ")).toEqual([]);
    });

    it("searches the whole list by name and number", () => {
        expect(names(getPokemonSuggestions(DEX, "mew"))).toEqual([
            MEWTWO.name,
            MEW.name,
        ]);
        expect(names(getPokemonSuggestions(DEX, "#151"))).toEqual(["mew"]);
    });

    it("caps at five by default and honours a custom limit", () => {
        const many = Array.from({ length: 9 }, (_, i) =>
            makePokemon({ id: i + 1, name: `mon${i}` })
        );
        expect(getPokemonSuggestions(many, "mon")).toHaveLength(5);
        expect(getPokemonSuggestions(many, "mon", 2)).toHaveLength(2);
        expect(getPokemonSuggestions(many, "mon", 20)).toHaveLength(9);
    });
});
