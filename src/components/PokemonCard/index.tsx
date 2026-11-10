import { Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { preload } from "react-dom";
import { twMerge } from "tailwind-merge";

import { PokemonCardType } from "@customTypes/PokemonCardTypes";
import { typeColors } from "@customTypes/PokemonTypes";
import {
    cardArtClass,
    cardBodyClass,
    cardClass,
    cardNumberWatermarkClass,
    categoryBadgeClass,
    legendaryPokemonClass,
    mythicalPokemonClass,
    pixelArtClass,
    tintedPillClass,
    typeDotClass,
    typeGradient,
} from "@styles/Pokedex";
import { formatPokedexNumber } from "@utils/search";

const PokemonCard: React.FC<PokemonCardType> = ({
    ref,
    className,
    style,
    pokemon,
    sprite: spriteOverride,
    pixelated = false,
    children,
    isLegendary,
    isMythical,
    navigateCallback,
    size = "default",
}: PokemonCardType) => {
    const isLarge = size === "large";

    const sprite = spriteOverride ?? pokemon.sprite;

    if (sprite) {
        preload(sprite, {
            as: "image",
            fetchPriority: "high",
        });
    }

    // cards are tinted by their first type; a caller's own style wins
    const primaryType = pokemon.types[0];
    const typeStyle = (
        primaryType
            ? {
                  "--card-art": typeGradient(primaryType),
                  "--card-edge": `var(--color-${primaryType})`,
              }
            : {}
    ) as CSSProperties;

    const category = isMythical ? "Mythical" : isLegendary ? "Legendary" : null;

    const Card = (
        <div
            ref={ref}
            key={pokemon.id}
            style={{ ...typeStyle, ...style }}
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
                <span
                    aria-hidden="true"
                    data-number={pokemon.id}
                    className={`${cardNumberWatermarkClass} ${isLarge ? "text-7xl" : ""}`}
                />
                {children}
                {sprite ? (
                    <img
                        title={pokemon.name}
                        alt={pokemon.name}
                        loading="lazy"
                        decoding="async"
                        className={`relative w-auto max-w-[80%] object-contain ${isLarge ? (pixelated ? "h-48" : "h-64") : "h-[130px] drop-shadow-lg transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none"} ${pixelated ? pixelArtClass : ""}`}
                        src={sprite}
                    />
                ) : null}
            </div>
            <div className={cardBodyClass}>
                <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs font-semibold text-subtle">
                        {formatPokedexNumber(pokemon.id)}
                    </span>
                    <span
                        title={pokemon.name}
                        className={`truncate font-display leading-tight font-extrabold capitalize ${isLarge ? "text-3xl" : "text-2xl"}`}
                    >
                        {pokemon.name}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {pokemon.types.map((type) => (
                        <span
                            key={type}
                            className={tintedPillClass}
                            style={
                                {
                                    "--pill": `var(--color-${type})`,
                                } as CSSProperties
                            }
                        >
                            <span
                                className={`${typeDotClass} size-2.5 ${typeColors[type]}`}
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
