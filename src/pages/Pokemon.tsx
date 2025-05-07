import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate, useLoaderData } from "react-router";
import { preconnect } from "react-dom";

import { Button } from "react-aria-components";

import { ArrowLeft, ArrowUp } from "lucide-react";

import PokemonCard from "@components/PokemonCard";

import { getPokemonEvolutions } from "@utils/pokemon";

import { Pokemon as PokemonType } from "@customTypes/PokemonTypes";

const Pokemon: React.FC = () => {
    preconnect("https://raw.githubusercontent.com/");

    const pokemonRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const {
        state,
        pathname,
    }: {
        state: {
            pokemon: PokemonType;
            previous: string;
        };
        pathname: string;
    } = useLocation();

    const pokemonName = pathname.split("/")[2];
    const initialData = useLoaderData();
    const pokedexList = getPokemonEvolutions(initialData);
    const pokemon = pokedexList.pokemon.find((item: PokemonType) => {
        return item.name === pokemonName;
    });

    useEffect(() => {
        if (!pokemon) {
            navigate("/pokedex", { replace: true });
        }
    }, [pokemon]);

    if (!pokemon) {
        return null;
    }

    return (
        <>
            <Button
                aria-label="Back"
                className="fixed rounded-full cursor-pointer bg-gray-700 hover:drop-shadow-md hover:drop-shadow-sky-400 transition-transform duration-300 ease-out transform hover:scale-105 my-3 mx-2"
                onPress={() => navigate(state?.previous || "/pokedex")}
            >
                <ArrowLeft color="white" size={42} />
            </Button>
            <div className="flex flex-row flex-wrap overflow-auto max-h-[95dvh] justify-center">
                <PokemonCard
                    ref={pokemonRef}
                    className="max-w-sm hover:shadow-lg cursor-auto m-auto"
                    pokemon={pokemon}
                    isLegendary={pokemon.specs.is_legendary}
                    isMythical={pokemon.specs.is_mythical}
                />
                <div className="h-0 basis-full" />
                {pokemon.evolutions.map((item, index) => (
                    <PokemonCard
                        key={index}
                        className="max-w-[210px] hover:shadow-lg hover:border-sky-500 focus:border-sky-500 m-4"
                        pokemon={item}
                        isLegendary={item.specs.is_legendary}
                        isMythical={item.specs.is_mythical}
                        navigateCallback={(event, pokemon) => {
                            const previousWithFallback =
                                state?.previous || "/pokedex";

                            navigate(`/pokedex/${pokemon.name}`, {
                                state: {
                                    pokemon: pokemon,
                                    previous:
                                        previousWithFallback ||
                                        location.pathname + location.search,
                                },
                            });
                        }}
                    />
                ))}
            </div>
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
        </>
    );
};

export default Pokemon;
