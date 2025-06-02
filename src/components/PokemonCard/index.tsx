import { preload } from "react-dom";

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
}: PokemonCardType) => {
    if (pokemon.sprite) {
        preload(pokemon.sprite, {
            as: "image",
            fetchPriority: "high",
        });
    }

    const Card = (
        <div
            ref={ref}
            key={pokemon._id}
            style={style}
            tabIndex={navigateCallback ? 0 : -1}
            aria-label={`Pokemon Card for ${pokemon.name}`}
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
            {pokemon.sprite ? (
                <img
                    title={pokemon.name}
                    alt={pokemon.name}
                    className={`${imgClass} bg-gray-500`}
                    src={placeholderImg}
                    onLoad={(e) => {
                        if (e.currentTarget.src === placeholderImg) {
                            e.currentTarget.src = pokemon.sprite || "";
                        } else {
                            e.currentTarget.classList.add("image-loaded");
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
                    <div className={pokedexIdClass}>#{pokemon._id}</div>
                    <span title={pokemon.name} className="truncate block">
                        {pokemon.name}
                    </span>
                </div>
            </div>
            <div className="px-2 py-2">
                {pokemon.types.map(
                    (
                        type: keyof typeof typeColors,
                        index: number
                    ) => {
                        return (
                            <span
                                key={index}
                                className={`inline-block ${typeColors[type]} ${placeholderClass} min-w-12 text-center`}
                            >
                                {type}
                            </span>
                        );
                    }
                )}
            </div>
        </div>
    );

    if (navigateCallback) {
        return (
            <a
                title={`Navigate to ${pokemon.name}`}
                aria-label={`Navigate to ${pokemon.name}`}
                href={`/pokedex/${pokemon.name}`}
                tabIndex={-1}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                {Card}
            </a>
        );
    }

    return Card;
};

export default PokemonCard;
