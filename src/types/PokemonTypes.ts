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

export type PokedexResult = {
    pokemon: Pokemon[];
};

export type Pokemon = {
    id: number;
    name: string;
    sprites: { default: string | null }[];
    types: { type: { name: keyof typeof typeColors } }[];
    specs: {
        is_legendary: boolean;
        is_mythical: boolean;
        generation_id: number;
        evolution_chain_id: number;
        evolves_from_species_id: number;
    };
    evolutions: Pokemon[];
};

export type TeamsResult = Team[];

export type Team = {
    _id: string;
    pokemon: PokemonDetails[];
    name: string;
    createdAt: string;
    updatedAt: string;
};

export type PokemonDetails = {
    id: number;
    name: string;
    sprite: string;
    types: (keyof typeof typeColors)[];
    isLegendary: boolean;
    isMythical: boolean;
    generationId: number;
    evolutionChainId: number;
    evolvesFromId: number;
};
