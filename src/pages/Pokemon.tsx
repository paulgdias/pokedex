import React from "react";
import { useLocation, useNavigate } from "react-router";

import { Button } from "react-aria-components";

import { ArrowLeft } from "lucide-react";

import PokemonCard from "@components/PokemonCard";

import { Pokemon as PokemonType } from "@customTypes/PokemonTypes";

const Pokemon: React.FC = () => {
	const navigate = useNavigate();
	const {
		state: { pokemon, previous },
	}: {
		state: {
			pokemon: PokemonType;
			previous: string;
		};
	} = useLocation();

	return (
		<div className="flex flex-col items-center justify-center">
			<PokemonCard
				className="max-w-full hover:shadow-lg cursor-auto"
				pokemon={pokemon}
				isLegendary={pokemon.specs.is_legendary}
				isMythical={pokemon.specs.is_mythical}
			/>
			<Button
				aria-label="Back"
				className="rounded-full m-4 cursor-pointer bg-gray-700 hover:drop-shadow-md hover:drop-shadow-sky-400 transition-transform duration-300 ease-out transform hover:scale-105"
				onPress={() => navigate(previous)}
			>
				<ArrowLeft color="white" size={42} />
			</Button>
		</div>
	);
};

export default Pokemon;
