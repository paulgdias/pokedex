import { preload } from "react-dom";

import { Ban, Sparkles } from "lucide-react";

import { PokemonCardType } from "@customTypes/PokemonCardTypes";
import { typeColors } from "@customTypes/PokemonTypes";

import { formatPokedexNumber } from "@utils/search";

import {
    cardArtClass,
    cardBodyClass,
    cardClass,
    cardNumberWatermarkClass,
    categoryBadgeClass,
    legendaryPokemonClass,
    mythicalPokemonClass,
    typeDotClass,
    typePillClass,
} from "@styles/Pokedex";
import { twMerge } from "tailwind-merge";

const PokemonCard: React.FC<PokemonCardType> = ({
    ref,
    className,
    style,
    pokemon,
    isLegendary,
    isMythical,
    navigateCallback,
    size = "default",
}: PokemonCardType) => {
    if (pokemon.sprite) {
        preload(pokemon.sprite, {
            as: "image",
            fetchPriority: "high",
        });
    }

    const isLarge = size === "large";
    const category = isMythical ? "Mythical" : isLegendary ? "Legendary" : null;

    const Card = (
        <div
            ref={ref}
            key={pokemon._id}
            style={style}
            tabIndex={navigateCallback ? 0 : -1}
            aria-label={`Pokemon Card for ${pokemon.name}`}
            className={`pokemonCard ${twMerge(
                cardClass,
                navigateCallback ? "cursor-pointer" : "cursor-auto",
                className
            )}`}
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
            <div
                className={`${cardArtClass} ${isLarge ? "h-72" : "h-[150px]"}`}
            >
                {pokemon.sprite && (
                    <span
                        aria-hidden="true"
                        className={`${cardNumberWatermarkClass} ${isLarge ? "text-7xl" : ""}`}
                    >
                        {pokemon._id}
                    </span>
                )}
                {category && (
                    <span
                        role="img"
                        aria-label={category}
                        title={category}
                        className={`${categoryBadgeClass} ${isMythical ? mythicalPokemonClass : legendaryPokemonClass}`}
                    >
                        <Sparkles
                            size={22}
                            fill="currentColor"
                            strokeLinejoin="round"
                        />
                    </span>
                )}
                {pokemon.sprite ? (
                    <img
                        title={pokemon.name}
                        alt={pokemon.name}
                        loading="lazy"
                        decoding="async"
                        className={`relative w-auto max-w-[80%] object-contain ${isLarge ? "h-64" : "h-[120px]"}`}
                        src={pokemon.sprite}
                    />
                ) : (
                    <Ban
                        className="relative text-subtle"
                        aria-label={pokemon.name}
                    />
                )}
            </div>
            <div className={cardBodyClass}>
                <div className="flex items-baseline justify-between gap-2">
                    <span
                        title={pokemon.name}
                        className={`truncate font-bold capitalize ${isLarge ? "text-2xl" : "text-base"}`}
                    >
                        {pokemon.name}
                    </span>
                    <span className="font-mono text-xs text-subtle">
                        {formatPokedexNumber(pokemon._id)}
                    </span>
                </div>
                <div className="flex gap-1.5">
                    {pokemon.types.map((type) => (
                        <span key={type} className={typePillClass}>
                            <span
                                className={`${typeDotClass} ${typeColors[type]}`}
                            />
                            {type}
                        </span>
                    ))}
                </div>
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
