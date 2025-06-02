import { PokemonDetails } from "@customTypes/PokemonTypes";

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
