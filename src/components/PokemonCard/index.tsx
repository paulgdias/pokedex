import { Ban, Sparkles } from "lucide-react";

import { useInView } from "react-intersection-observer";

import { PurePlaceholderCard as PlaceholderCard } from "./PlaceholderCard";

import { typeColors, Pokemon } from "@customTypes/PokemonTypes";

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

const PokemonCard = ({
	className,
	pokemon,
	isLegendary,
	isMythical,
	navigateCallback,
}: {
	className?: string;
	pokemon: Pokemon;
	isLegendary: boolean;
	isMythical: boolean;
	navigateCallback?: Function;
}) => {
	const { ref, inView } = useInView({
		threshold: 0.10,
		// triggerOnce: true,
	});

	return (
		<div ref={ref}>
			{inView ? (
				<div
					key={pokemon.id}
					tabIndex={navigateCallback ? 0 : -1}
					data-pokemon-name={pokemon.name}
					className={`pokemonCard ${twMerge(cardClass, className)}`}
					onClick={() => {
						if (navigateCallback) {
							navigateCallback(pokemon);
						}
					}}
					onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
						if (navigateCallback) {
							if (event.code === "Enter") {
								navigateCallback(pokemon);
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
									e.currentTarget.src = pokemon.sprites[0].default || "";
								}
							}}
						/>
					) : (
						<Ban
							className={`${imgClass} bg-gray-500`}
							aria-label={pokemon.name}
						/>
					)}
					<div className="px-6 py-4">
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
			) : (
				<PlaceholderCard />
			)}
		</div>
	);
};

export default PokemonCard;
