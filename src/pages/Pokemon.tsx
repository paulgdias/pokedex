import { useEffect, useRef, useState } from "react";
import { preconnect, preload } from "react-dom";
import {
    useLoaderData,
    useLocation,
    useNavigate,
    useParams,
} from "react-router";

import { useQuery } from "@tanstack/react-query";
import { Button } from "react-aria-components";

import { ArrowLeft } from "lucide-react";

import ScrollTopButton from "@components/Buttons/ScrollTopButton";
import EvolutionChain from "@components/EvolutionChain";
import PokemonCard from "@components/PokemonCard";
import SpriteToggle, { SpriteView } from "@components/SpriteToggle";

import { homeSpriteQueryOptions } from "@api/pokedex";

import { getGeneration } from "@utils/generations";
import { PokemonLocationState } from "@utils/useNavigateToPokemon";

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

    // stays selected while moving between pokemon; falls back to the artwork
    // for the few that have no 3D render
    const [view, setView] = useState<SpriteView>("artwork");
    const { data: home } = useQuery({
        ...homeSpriteQueryOptions(pokemon?._id ?? 0),
        enabled: Boolean(pokemon),
    });
    if (home) {
        preload(home, { as: "image" });
    }

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
                    sprite={view === "3d" && home ? home : undefined}
                    isLegendary={pokemon.isLegendary}
                    isMythical={pokemon.isMythical}
                >
                    <SpriteToggle
                        value={view === "3d" && home ? "3d" : "artwork"}
                        onChange={setView}
                        is3dAvailable={Boolean(home)}
                    />
                </PokemonCard>
                <EvolutionChain
                    pokemon={pokemon}
                    previous={state?.previous || "/pokedex"}
                />
            </div>
            <ScrollTopButton
                onPress={() => scrollRef.current?.scrollTo({ top: 0 })}
            />
        </div>
    );
};

export default Pokemon;
