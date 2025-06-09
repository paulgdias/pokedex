import { useEffect, useRef } from "react";
import {
    useLocation,
    useNavigate,
    useLoaderData,
    useParams,
} from "react-router";
import { preconnect } from "react-dom";

import { Button } from "react-aria-components";

import { ArrowLeft, ArrowUp } from "lucide-react";

import PokemonCard from "@components/PokemonCard";

import { getPokemonEvolutions } from "@utils/pokemon";

import { PokemonDetails } from "@customTypes/PokemonTypes";

const Pokemon: React.FC = () => {
    preconnect("https://beta.pokeapi.co");
    preconnect("https://raw.githubusercontent.com/");

    const pokemonRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const params = useParams();
    const {
        state,
    }: {
        state: {
            pokemon: PokemonDetails;
            previous: string;
        };
        pathname: string;
    } = useLocation();

    const pokemonName = params?.pokemon;
    const initialData = useLoaderData();

    let pokedexList = [];
    let pokemon: PokemonDetails = {} as PokemonDetails;

    if (initialData.length === 1) {
        pokedexList = initialData;
        pokemon = initialData[0];
    } else {
        pokedexList = getPokemonEvolutions(initialData);
        const foundPokemon = pokedexList.find((item: PokemonDetails) => {
            return item.name === pokemonName;
        });
        pokemon = foundPokemon as PokemonDetails;
    }

    useEffect(() => {
        if (!pokemon) {
            navigate("/pokedex", { replace: true });
        }
    }, [pokemon]);

    return (
        <>
            <Button
                aria-label="Back to Pokémon"
                className="fixed rounded-full cursor-pointer bg-gray-700 hover:drop-shadow-md hover:drop-shadow-sky-400 transition-transform duration-300 ease-out transform hover:scale-105 my-3 mx-2"
                onPress={() => navigate(state?.previous || "/pokedex")}
            >
                <ArrowLeft color="white" size={42} />
            </Button>
            <div className="flex flex-row flex-wrap overflow-auto max-h-[95dvh] justify-center">
                <PokemonCard
                    ref={pokemonRef}
                    className="w-xs sm:w-sm hover:shadow-lg cursor-auto m-auto"
                    pokemon={pokemon}
                    isLegendary={pokemon.isLegendary}
                    isMythical={pokemon.isMythical}
                />
                <div className="h-0 basis-full" />
                {pokemon.evolutions.map((item, index) => (
                    <PokemonCard
                        key={index}
                        className="w-[210px] hover:shadow-lg hover:border-sky-500 focus:border-sky-500 m-4"
                        pokemon={item}
                        isLegendary={item.isLegendary}
                        isMythical={item.isMythical}
                        navigateCallback={(_event, pokemon) => {
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
