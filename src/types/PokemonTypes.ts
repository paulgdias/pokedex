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
export type HomeSpriteResult = {
    pokemon_v2_pokemonsprites: { home: string | null }[];
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
    /** how the species evolves, one label per PokeAPI evolution row */
    evolutionMethods: string[];
    evolutions: PokemonDetails[];
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
