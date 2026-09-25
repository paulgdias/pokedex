import { Pokemon, PokemonDetails } from "@customTypes/PokemonTypes";

const toPokemonDetails = (pokemon: Pokemon): PokemonDetails => ({
    _id: pokemon.id ?? 0,
    name: pokemon.name ?? "",
    sprite: pokemon.sprites?.[0]?.default ?? "",
    isLegendary: pokemon.specs?.is_legendary ?? false,
    isMythical: pokemon.specs?.is_mythical ?? false,
    generationId: pokemon.specs?.generation_id ?? 0,
    evolutionChainId: pokemon.specs?.evolution_chain_id ?? 0,
    evolvesFromId: pokemon.specs?.evolves_from_species_id ?? 0,
    types: pokemon.types?.map((t) => t.type.name) ?? [],
    evolutions: pokemon.evolutions?.map(toPokemonDetails) ?? [],
});

export const convertToPokemonDetailsArray = (
    pokemon: Pokemon[]
): PokemonDetails[] => pokemon.map(toPokemonDetails);

const groupByEvolutionChain = (pokemon: PokemonDetails[]) => {
    const chains = new Map<number, PokemonDetails[]>();
    for (const item of pokemon) {
        const chain = chains.get(item.evolutionChainId);
        if (chain) {
            chain.push(item);
        } else {
            chains.set(item.evolutionChainId, [item]);
        }
    }
    chains.forEach((chain) => chain.sort((a, b) => a._id - b._id));
    return chains;
};

/** Sets each pokemon's `evolutions` to the members of its evolution chain. */
export const withEvolutions = (pokemon: PokemonDetails[]): PokemonDetails[] => {
    const chains = groupByEvolutionChain(pokemon);
    return pokemon.map((item) => ({
        ...item,
        evolutions: chains.get(item.evolutionChainId) ?? [],
    }));
};
