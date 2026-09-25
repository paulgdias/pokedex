import { useEffect, useRef } from "react";
import {
    useLocation,
    useNavigate,
    useLoaderData,
    useParams,
} from "react-router";
import { preconnect } from "react-dom";

import { Button } from "react-aria-components";

import { ArrowLeft } from "lucide-react";

import PokemonCard from "@components/PokemonCard";
import ScrollTopButton from "@components/Buttons/ScrollTopButton";

import {
    PokemonLocationState,
    useNavigateToPokemon,
} from "@utils/useNavigateToPokemon";
import { getGeneration } from "@utils/generations";

import { PokemonDetails } from "@customTypes/PokemonTypes";

const Pokemon: React.FC = () => {
    preconnect("https://beta.pokeapi.co");
    preconnect("https://raw.githubusercontent.com/");

    const scrollRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const params = useParams();
    const state = useLocation().state as PokemonLocationState | null;

    const pokemonName = params?.pokemon;
    // the pokedex loader already attaches each pokemon's evolutions
    const pokedexList = useLoaderData() as PokemonDetails[];
    const pokemon = pokedexList.find((item) => item.name === pokemonName);

    const navigateToPokemon = useNavigateToPokemon(
        state?.previous || "/pokedex"
    );

    useEffect(() => {
        if (!pokemon) {
            navigate("/pokedex", { replace: true });
        }
    }, [pokemon, navigate]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [pokemonName]);

    if (!pokemon) {
        return null;
    }

    const generation = getGeneration(pokemon.generationId);
    const relatives = pokemon.evolutions.filter(
        (item) => item._id !== pokemon._id
    );

    return (
        <div
            ref={scrollRef}
            className="pokedex-scroll flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
            <div className="flex flex-col gap-4 border-b border-line px-4 pt-5 pb-4 lg:px-8">
                <Button
                    aria-label="Back to Pokémon"
                    className="flex h-10 w-fit cursor-pointer items-center gap-2 rounded-[10px] border-[1.5px] border-line-strong bg-surface pr-4 pl-3 text-sm font-semibold text-ink hover:bg-chip"
                    onPress={() => navigate(state?.previous || "/pokedex")}
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Back to Pokédex
                </Button>
                <div className="flex flex-wrap items-baseline gap-x-3.5">
                    <h1 className="font-display text-[34px] leading-tight font-bold tracking-tight capitalize">
                        {pokemon.name}
                    </h1>
                    {generation && (
                        <span className="text-[15px] text-muted">
                            Generation {generation.roman} · {generation.region}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-10 px-4 py-7 lg:px-8">
                <PokemonCard
                    className="w-full max-w-sm"
                    size="large"
                    pokemon={pokemon}
                    isLegendary={pokemon.isLegendary}
                    isMythical={pokemon.isMythical}
                />
                {relatives.length > 0 && (
                    <section
                        aria-labelledby="evolution-chain"
                        className="flex flex-col gap-4"
                    >
                        <h2
                            id="evolution-chain"
                            className="font-display text-2xl font-bold tracking-tight"
                        >
                            Evolution chain
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            {relatives.map((item) => (
                                <PokemonCard
                                    key={item._id}
                                    className="w-52 hover:border-line-strong"
                                    pokemon={item}
                                    isLegendary={item.isLegendary}
                                    isMythical={item.isMythical}
                                    navigateCallback={navigateToPokemon}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
            <ScrollTopButton
                onPress={() => scrollRef.current?.scrollTo({ top: 0 })}
            />
        </div>
    );
};

export default Pokemon;
