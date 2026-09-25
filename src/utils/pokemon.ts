import {
    Pokemon,
    PokemonDetails,
    PokemonInfo,
    PokemonInfoResult,
} from "@customTypes/PokemonTypes";

import { formatEvolutionMethod, getPokemonForm } from "./evolution";

const STAT_COUNT = 6;

/** Base stats indexed by PokeAPI stat id (1-6: hp ... speed). */
const toStats = (stats: Pokemon["stats"] | undefined) => {
    const values = new Array<number>(STAT_COUNT).fill(0);
    for (const { stat_id, base_stat } of stats ?? []) {
        if (stat_id >= 1 && stat_id <= STAT_COUNT) {
            values[stat_id - 1] = base_stat;
        }
    }
    return values;
};

const toPokemonDetails = (pokemon: Pokemon): PokemonDetails => ({
    _id: pokemon.id ?? 0,
    name: pokemon.name ?? "",
    sprite: pokemon.sprites?.[0]?.default ?? "",
    isLegendary: pokemon.specs?.is_legendary ?? false,
    isMythical: pokemon.specs?.is_mythical ?? false,
    generationId: pokemon.specs?.generation_id ?? 0,
    evolutionChainId: pokemon.specs?.evolution_chain_id ?? 0,
    speciesId: pokemon.specs?.species_id ?? pokemon.id ?? 0,
    evolvesFromId: pokemon.specs?.evolves_from_species_id ?? 0,
    isDefault: pokemon.is_default ?? true,
    form: getPokemonForm(pokemon.name ?? "", pokemon.is_default ?? true),
    stats: toStats(pokemon.stats),
    statTotal: toStats(pokemon.stats).reduce((sum, value) => sum + value, 0),
    evolutionMethods:
        pokemon.specs?.evolution_methods?.map(formatEvolutionMethod) ?? [],
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

export const convertToPokemonInfo = (
    pokemon: PokemonInfoResult["pokemon_v2_pokemon"][number]
): PokemonInfo => ({
    height: pokemon.height,
    weight: pokemon.weight,
    baseExperience: pokemon.base_experience,
    abilities: pokemon.abilities.map(({ is_hidden, ability }) => ({
        name: ability.name,
        isHidden: is_hidden,
        effect: ability.effects[0]?.short_effect ?? "",
    })),
    cry:
        pokemon.cries[0]?.cries?.latest ??
        pokemon.cries[0]?.cries?.legacy ??
        null,
    genus: pokemon.species.genus[0]?.genus ?? "",
    genderRate: pokemon.species.gender_rate,
    captureRate: pokemon.species.capture_rate,
    baseHappiness: pokemon.species.base_happiness,
    hatchCounter: pokemon.species.hatch_counter,
    habitat: pokemon.species.habitat?.name ?? null,
    color: pokemon.species.color?.name ?? null,
    shape: pokemon.species.shape?.name ?? null,
    growthRate: pokemon.species.growth?.name ?? null,
    eggGroups: pokemon.species.eggGroups.map(({ group }) => group.name),
    flavorTexts: pokemon.species.flavor.map(({ text, version }) => ({
        text,
        version: version.name,
    })),
});
