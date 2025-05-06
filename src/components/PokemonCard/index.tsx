import React from "react";

import { Ban, Sparkles } from "lucide-react";

import { PokemonCardType } from "@customTypes/PokemonCardTypes";
import { typeColors } from "@customTypes/PokemonTypes";

import { twMerge } from "tailwind-merge";
import {
    cardClass,
    imgClass,
    cardStatsClass,
    pokedexIdClass,
    placeholderClass,
    legendaryPokemonClass,
    mythicalPokemonClass,
    placeholderImg,
} from "@styles/Pokedex";

const PokemonCard: React.FC<PokemonCardType> = ({
    ref,
    className,
    style,
    pokemon,
    isLegendary,
    isMythical,
    navigateCallback,
}) => {
    return (
        <div
            ref={ref}
            style={style}
            key={pokemon.id}
            tabIndex={navigateCallback ? 0 : -1}
            data-pokemon-name={pokemon.name}
            className={`pokemonCard ${twMerge(cardClass, className)}`}
            onClick={(event) => {
                if (navigateCallback) {
                    navigateCallback(event, pokemon);
                }
            }}
            onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                if (navigateCallback) {
                    if (event.code === "Enter") {
                        navigateCallback(event, pokemon);
                    }
                }
            }}
        >
            {isLegendary && <Sparkles className={legendaryPokemonClass} />}
            {isMythical && <Sparkles className={mythicalPokemonClass} />}
            {pokemon.sprites[0].default ? (
                <img
                    title={pokemon.name}
                    alt={pokemon.name}
                    className={`${imgClass} bg-gray-500`}
                    src={placeholderImg}
                    onLoad={(e) => {
                        if (e.currentTarget.src === placeholderImg) {
                            e.currentTarget.src =
                                pokemon.sprites[0].default || "";
                        }
                    }}
                />
            ) : (
                <Ban
                    className={`${imgClass} bg-gray-500`}
                    aria-label={pokemon.name}
                />
            )}
            <div className="px-3 py-1">
                <div className={cardStatsClass}>
                    <div className={pokedexIdClass}>#{pokemon.id}</div>
                    <span title={pokemon.name} className="truncate block">
                        {pokemon.name}
                    </span>
                </div>
            </div>
            <div className="px-2 py-2">
                {pokemon.types.map(
                    (
                        types: {
                            type: {
                                name: keyof typeof typeColors;
                            };
                        },
                        index: number
                    ) => {
                        return (
                            <span
                                key={index}
                                className={`inline-block ${typeColors[types.type.name]} ${placeholderClass}`}
                            >
                                {types.type.name}
                            </span>
                        );
                    }
                )}
            </div>
        </div>
    );
};

export default PokemonCard;
