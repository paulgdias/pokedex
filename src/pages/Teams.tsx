import { memo, useRef } from "react";
import { useLoaderData } from "react-router";
import { preconnect } from "react-dom";

import type { QueryClient } from "@tanstack/react-query";
import { queryOptions, keepPreviousData } from "@tanstack/react-query";

import { ErrorBoundary } from "react-error-boundary";

import PokemonCard from "@components/PokemonCard";

import { Button } from "react-aria-components";

import { ArrowUp } from "lucide-react";

import {
    PokemonDetails,
    TeamsResult,
    Team,
    typeColors,
} from "@customTypes/PokemonTypes";

const teamsQuery = () =>
    queryOptions({
        queryKey: ["teams"],
        queryFn: async (): Promise<TeamsResult> => {
            const response = await fetch(
                "http://localhost:3001/api/v1/pokemon/teams"
            );
            const data: TeamsResult = await response.json();
            return data;
        },
        placeholderData: keepPreviousData,
    });

export const loader = (queryClient: QueryClient) => async () => {
    return await queryClient.ensureQueryData(teamsQuery());
};

const Teams: React.FC = () => {
    preconnect("https://raw.githubusercontent.com/");

    const pokemonRef = useRef<HTMLDivElement>(null);
    const pokemonData: TeamsResult = useLoaderData();

    return (
        <>
            <div className="flex flex-row flex-wrap overflow-auto max-h-[95dvh] justify-center">
                <ErrorBoundary
                    fallback={
                        <div className="flex justify-center">
                            Something went wrong!
                        </div>
                    }
                >
                    {pokemonData.map((data: Team, index: number) => (
                        <div
                            ref={index === 0 ? pokemonRef : null}
                            key={index}
                            className="flex flex-col items-center justify-center"
                        >
                            <h2
                                className={`text-2xl font-bold underline ${index === 0 ? "mb-4" : "m-4"}`}
                            >
                                {data.name}
                            </h2>
                            <div className="flex flex-wrap gap-4 w-auto">
                                {data.pokemon.map(
                                    (
                                        pokemon: PokemonDetails,
                                        index: number
                                    ) => (
                                        <PokemonCard
                                            className="w-[210px] hover:shadow-lg cursor-auto m-auto"
                                            key={index}
                                            pokemon={{
                                                id: pokemon._id,
                                                name: pokemon.name,
                                                sprites: [
                                                    { default: pokemon.sprite },
                                                ],
                                                specs: {
                                                    is_legendary:
                                                        pokemon.isLegendary,
                                                    is_mythical:
                                                        pokemon.isMythical,
                                                    generation_id:
                                                        pokemon.generationId,
                                                    evolution_chain_id:
                                                        pokemon.evolutionChainId,
                                                    evolves_from_species_id:
                                                        pokemon.evolvesFromId,
                                                },
                                                types: pokemon.types.map(
                                                    (type) => ({
                                                        type: {
                                                            name: type as keyof typeof typeColors,
                                                        },
                                                    })
                                                ),
                                                evolutions: [],
                                            }}
                                        />
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                    <Button
                        aria-label="Go to Top of Page"
                        className="fixed rounded-full bottom-0 right-0 m-4 cursor-pointer bg-gray-700 hover:drop-shadow-md hover:drop-shadow-sky-400 transition-transform duration-300 ease-out transform hover:scale-105"
                        onPress={() => {
                            if (pokemonRef.current) {
                                pokemonRef.current.scrollIntoView();
                            }
                        }}
                    >
                        <ArrowUp color="white" size={42} />
                    </Button>
                </ErrorBoundary>
            </div>
        </>
    );
};

export default memo(Teams);
