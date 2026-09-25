import { memo, useRef } from "react";
import { useLoaderData } from "react-router";
import { preconnect } from "react-dom";

import type { QueryClient } from "@tanstack/react-query";
import { queryOptions, keepPreviousData } from "@tanstack/react-query";

import {
    carouselClass,
    carouselSlideClass,
    carouselWrapperClass,
} from "@styles/Carousel";

import { ErrorBoundary } from "react-error-boundary";

import PokemonCard from "@components/PokemonCard";

import ScrollTopButton from "@components/Buttons/ScrollTopButton";

import { PokemonDetails, TeamsResult, Team } from "@customTypes/PokemonTypes";

import { useNavigateToPokemon } from "@utils/useNavigateToPokemon";

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

    const navigateToPokemon = useNavigateToPokemon();

    return (
        <>
            <div className="pokedex-scroll flex min-h-0 flex-1 flex-row flex-wrap justify-center overflow-auto px-4 py-6 lg:px-8">
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
                                className={`font-display text-2xl font-bold tracking-tight ${index === 0 ? "mb-4" : "m-4"}`}
                            >
                                {data.name}
                            </h2>
                            <div className={carouselWrapperClass}>
                                <div className={carouselClass}>
                                    {data.pokemon.map(
                                        (
                                            pokemon: PokemonDetails,
                                            index: number
                                        ) => (
                                            <div
                                                key={index}
                                                className={carouselSlideClass}
                                            >
                                                <PokemonCard
                                                    className="w-[210px] hover:border-line-strong"
                                                    pokemon={{
                                                        ...pokemon,
                                                        evolutions: [],
                                                    }}
                                                    navigateCallback={
                                                        navigateToPokemon
                                                    }
                                                />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <ScrollTopButton
                        onPress={() => {
                            if (pokemonRef.current) {
                                pokemonRef.current.scrollIntoView();
                            }
                        }}
                    />
                </ErrorBoundary>
            </div>
        </>
    );
};

export default memo(Teams);
