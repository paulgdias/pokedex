import { PokemonDetails, typeColors } from "@customTypes/PokemonTypes";

import { GENERATIONS, Generation } from "./generations";

export type PokemonType = keyof typeof typeColors;
export type Category = "legendary" | "mythical";

export const POKEMON_TYPES = Object.keys(typeColors) as PokemonType[];
export const CATEGORIES: Category[] = ["legendary", "mythical"];

/** Everything the toolbar can filter the Pokédex by. */
export interface PokedexFilters {
    text: string;
    generation: number | null;
    /** a pokemon matches when it has any of these types */
    types: PokemonType[];
    category: Category | null;
}

export const EMPTY_FILTERS: PokedexFilters = {
    text: "",
    generation: null,
    types: [],
    category: null,
};

const TEXT_PARAM = "q";
const GENERATION_PARAM = "gen";
const TYPES_PARAM = "type";
const CATEGORY_PARAM = "only";

const isPokemonType = (value: string): value is PokemonType =>
    (POKEMON_TYPES as string[]).includes(value);

const isCategory = (value: string | null): value is Category =>
    (CATEGORIES as (string | null)[]).includes(value);

export const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);

export const getFiltersFromURLParams = (
    params: URLSearchParams
): PokedexFilters => {
    const generation = Number(params.get(GENERATION_PARAM));
    const category = params.get(CATEGORY_PARAM);
    return {
        text: params.get(TEXT_PARAM) ?? "",
        generation: GENERATIONS.some(({ id }) => id === generation)
            ? generation
            : null,
        types: (params.get(TYPES_PARAM) ?? "").split(",").filter(isPokemonType),
        category: isCategory(category) ? category : null,
    };
};

/** Returns a copy of `params` with the filters applied (removed if empty). */
export const withFilters = (
    params: URLSearchParams,
    { text, generation, types, category }: PokedexFilters
): URLSearchParams => {
    const next = new URLSearchParams(params);
    const setOrDelete = (key: string, value: string | null) =>
        value ? next.set(key, value) : next.delete(key);

    setOrDelete(TEXT_PARAM, text);
    setOrDelete(GENERATION_PARAM, generation ? String(generation) : null);
    setOrDelete(TYPES_PARAM, types.join(","));
    setOrDelete(CATEGORY_PARAM, category);
    return next;
};

/** Matches a pokédex number (with or without `#`) by prefix, else the name. */
export const matchesText = (pokemon: PokemonDetails, text: string): boolean => {
    const search = text.trim().toLowerCase().replace(/^#/, "");
    if (!search) {
        return true;
    }
    if (/^\d+$/.test(search)) {
        return String(pokemon._id).startsWith(String(parseInt(search, 10)));
    }
    return pokemon.name.includes(search);
};

export const applyFilters = (
    pokemon: PokemonDetails[],
    { text, generation, types, category }: PokedexFilters
): PokemonDetails[] =>
    pokemon.filter(
        (item) =>
            (generation === null || item.generationId === generation) &&
            (category !== "legendary" || item.isLegendary) &&
            (category !== "mythical" || item.isMythical) &&
            (types.length === 0 ||
                item.types.some((type) => types.includes(type))) &&
            matchesText(item, text)
    );

/* suggestions shown while typing in the search field */

export interface FilterSuggestion {
    key: string;
    label: string;
    kind: string;
    /** what applying the suggestion changes, on top of the current filters */
    patch: Partial<PokedexFilters>;
    type?: PokemonType;
}

export const getFilterSuggestions = (
    text: string,
    filters: PokedexFilters
): FilterSuggestion[] => {
    const search = text.trim().toLowerCase();
    if (search.length < 2) {
        return [];
    }

    const types = POKEMON_TYPES.filter(
        (type) => type.startsWith(search) && !filters.types.includes(type)
    ).map(
        (type): FilterSuggestion => ({
            key: `type-${type}`,
            label: capitalize(type),
            kind: "type",
            type,
            patch: { types: [...filters.types, type], text: "" },
        })
    );

    const generations = GENERATIONS.filter(
        ({ id, region }: Generation) =>
            id !== filters.generation &&
            (region.toLowerCase().startsWith(search) ||
                search === `gen ${id}` ||
                search === `gen${id}`)
    ).map(
        ({ id, region, roman }): FilterSuggestion => ({
            key: `gen-${id}`,
            label: region,
            kind: `Gen ${roman}`,
            patch: { generation: id, text: "" },
        })
    );

    const categories = CATEGORIES.filter(
        (category) =>
            category !== filters.category && category.startsWith(search)
    ).map(
        (category): FilterSuggestion => ({
            key: `only-${category}`,
            label: capitalize(category),
            kind: "only",
            patch: { category, text: "" },
        })
    );

    return [...types, ...generations, ...categories];
};

/** Suggestions search the whole dex, ignoring the current filters. */
export const getPokemonSuggestions = (
    pokemon: PokemonDetails[],
    text: string,
    limit = 5
): PokemonDetails[] => {
    if (!text.trim()) {
        return [];
    }
    return pokemon.filter((item) => matchesText(item, text)).slice(0, limit);
};

export const formatPokedexNumber = (id: number) =>
    `#${String(id).padStart(4, "0")}`;
