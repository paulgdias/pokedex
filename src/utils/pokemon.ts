import Dexie, { type EntityTable } from "dexie";

import { Pokemon, PokemonDetails } from "@customTypes/PokemonTypes";

export function convertToPokemonDetailsArray(
    pokemonArr: Pokemon[]
): PokemonDetails[] {
    return pokemonArr.map((pokemon) => ({
        _id: pokemon.id ?? 0,
        name: pokemon.name ?? "",
        sprite: pokemon.sprites?.[0]?.default ?? "",
        isLegendary: pokemon.specs?.is_legendary ?? false,
        isMythical: pokemon.specs?.is_mythical ?? false,
        generationId: pokemon.specs?.generation_id ?? 0,
        evolutionChainId: pokemon.specs?.evolution_chain_id ?? 0,
        evolvesFromId: pokemon.specs?.evolves_from_species_id ?? 0,
        types: pokemon.types ? pokemon.types.map((t) => t.type.name) : [],
        evolutions: pokemon.evolutions
            ? convertToPokemonDetailsArray(pokemon.evolutions)
            : [],
    }));
}

export const getGroupedEvolutions = (data: PokemonDetails[]) => {
    if (data) {
        const groupedPokemonData = data.reduce(
            (acc, pokemon) => {
                const chainId = pokemon.evolutionChainId;
                if (!acc[chainId]) {
                    acc[chainId] = [];
                }
                acc[chainId].push(pokemon);
                return acc;
            },
            {} as Record<number, PokemonDetails[]>
        );
        for (const chainId in groupedPokemonData) {
            groupedPokemonData[chainId].sort((a, b) => a._id - b._id);
        }

        return groupedPokemonData;
    }
    return {};
};

export const getPokemonEvolutions = (data: PokemonDetails[]) => {
    const evolutions = getGroupedEvolutions(data);
    return data.map((pokemon) => {
        return {
            ...pokemon,
            evolutions: evolutions[pokemon.evolutionChainId],
        };
    });
};

export const getPokemonDB = () => {
    const db = new Dexie("pokemonDB") as Dexie & {
        pokemon: EntityTable<PokemonDetails>;
    };
    db.version(1).stores({
        pokemon:
            "_id,name,sprite,isLegendary,isMythical,generationId,evolutionChainId,evolvesFromId,types,evolutions",
    });
    db.open();
    return db;
};
