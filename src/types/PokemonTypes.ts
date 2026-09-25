export const typeColors = {
    grass: "bg-grass",
    fire: "bg-fire",
    water: "bg-water",
    bug: "bg-bug",
    normal: "bg-normal",
    electric: "bg-electric",
    ground: "bg-ground",
    fairy: "bg-fairy",
    poison: "bg-poison",
    fighting: "bg-fighting",
    psychic: "bg-psychic",
    rock: "bg-rock",
    ghost: "bg-ghost",
    dragon: "bg-dragon",
    dark: "bg-dark",
    flying: "bg-flying",
    steel: "bg-steel",
    ice: "bg-ice",
};

export type RegionalForm = "alola" | "galar" | "hisui" | "paldea";
export type PokemonForm = RegionalForm | "mega" | "gmax" | "other" | null;

/* graphql types */
export type NamedResource = { name: string } | null;
export type EvolutionMethod = {
    min_level: number | null;
    min_happiness: number | null;
    time_of_day: string;
    trigger: NamedResource;
    item: NamedResource;
    held: NamedResource;
    move: NamedResource;
    location: NamedResource;
};
export type PokemonSpritesResult = {
    pokemon_v2_pokemonsprites: {
        home: string | null;
        homeShiny: string | null;
        artworkShiny: string | null;
    }[];
};
export type PokemonInfoResult = {
    pokemon_v2_pokemon: {
        height: number;
        weight: number;
        base_experience: number | null;
        abilities: {
            is_hidden: boolean;
            ability: { name: string; effects: { short_effect: string }[] };
        }[];
        cries: { cries: { latest?: string; legacy?: string } | null }[];
        species: {
            gender_rate: number;
            capture_rate: number;
            base_happiness: number | null;
            hatch_counter: number | null;
            habitat: NamedResource;
            color: NamedResource;
            shape: NamedResource;
            growth: NamedResource;
            eggGroups: { group: { name: string } }[];
            genus: { genus: string }[];
            flavor: { text: string; version: { name: string } }[];
        };
    }[];
};
export type TypeEfficacyResult = {
    efficacy: {
        damage_type_id: number;
        target_type_id: number;
        damage_factor: number;
    }[];
    types: { id: number; name: string }[];
};
export type PokedexResult = {
    pokemon: Pokemon[];
};
export type Pokemon = {
    id: number;
    name: string;
    is_default: boolean;
    sprites: { default: string | null }[];
    types: { type: { name: keyof typeof typeColors } }[];
    stats: { stat_id: number; base_stat: number }[];
    specs: {
        species_id: number;
        evolution_methods: EvolutionMethod[];
        is_legendary: boolean;
        is_mythical: boolean;
        generation_id: number;
        evolution_chain_id: number;
        evolves_from_species_id: number;
    };
    evolutions?: Pokemon[];
};

/* custom types */
export type TeamsResult = Team[];
export type Team = {
    _id: string;
    pokemon: PokemonDetails[];
    name: string;
    createdAt: string;
    updatedAt: string;
};
export type PokemonDetails = {
    _id: number;
    name: string;
    sprite: string;
    types: (keyof typeof typeColors)[];
    isLegendary: boolean;
    isMythical: boolean;
    generationId: number;
    evolutionChainId: number;
    /** species id; alternate forms share their base form's */
    speciesId: number;
    /** species id this one evolves from (0 for the first stage) */
    evolvesFromId: number;
    isDefault: boolean;
    form: PokemonForm;
    /** base stats in `STAT_LABELS` order: hp, atk, def, spa, spd, spe */
    stats: number[];
    statTotal: number;
    /** how the species evolves, one label per PokeAPI evolution row */
    evolutionMethods: string[];
    evolutions: PokemonDetails[];
};

/** A defending type's damage multiplier per attacking type (0, .5, 1, 2). */
export type TypeEfficacy = Record<string, Record<string, number>>;

/** Detail-page data fetched per pokémon (see `pokemonInfoQueryOptions`). */
export type PokemonInfo = {
    height: number;
    weight: number;
    baseExperience: number | null;
    abilities: { name: string; isHidden: boolean; effect: string }[];
    cry: string | null;
    genus: string;
    /** eighths of a female; -1 when genderless */
    genderRate: number;
    captureRate: number;
    baseHappiness: number | null;
    hatchCounter: number | null;
    habitat: string | null;
    color: string | null;
    shape: string | null;
    growthRate: string | null;
    eggGroups: string[];
    /** newest game version first */
    flavorTexts: { text: string; version: string }[];
};
export type PokemonSprites = {
    home: string | null;
    homeShiny: string | null;
    artworkShiny: string | null;
};

/** One node of an evolution chain, with the way it is reached. */
export type EvolutionStep = {
    pokemon: PokemonDetails;
    method: string | null;
    /** battle-only alternates (Mega, Gigantamax) of this step */
    forms: PokemonDetails[];
};
/** A path through a chain; regional variants get their own lane. */
export type EvolutionLane = {
    region: RegionalForm | null;
    stages: EvolutionStep[][];
};
