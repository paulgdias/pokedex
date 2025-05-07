import { PokedexResult, Pokemon } from "@customTypes/PokemonTypes";

export const getPokemonEvolutions = (data: PokedexResult) => {
    if (data) {
        const groupedPokemonData = data.pokemon.reduce(
            (acc, pokemon) => {
                const chainId = pokemon.specs.evolution_chain_id;
                if (!acc[chainId]) {
                    acc[chainId] = [];
                }
                acc[chainId].push(pokemon);
                return acc;
            },
            {} as Record<number, Pokemon[]>
        );
        for (const chainId in groupedPokemonData) {
            groupedPokemonData[chainId].sort((a, b) => a.id - b.id);
        }

        return groupedPokemonData;
    }
    return {};
};
