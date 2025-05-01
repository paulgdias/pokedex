import React from "react";

import { useNavigate } from "react-router";

import PlaceholderCard from "@components/PokemonCard/PlaceholderCard";

import { gridClass } from "@styles/Pokedex";
import { Pokemon } from "@customTypes/PokemonTypes";
import PokemonCard from "@components/PokemonCard";

const PokemonList = ({
	list,
	isLoading,
}: {
	list: Pokemon[];
	isLoading: boolean;
}) => {
	const navigate = useNavigate();
	return (
		<div className={`${gridClass} h-screen`}>
			{isLoading
				? new Array(36)
						.fill(0)
						.map((_, index) => <PlaceholderCard key={index} />)
				: list.map((pokemon: Pokemon, index: number) => {
						const { is_legendary: isLegendary, is_mythical: isMythical } =
							pokemon.specs;
						return (
							<PokemonCard
								key={index}
								pokemon={pokemon}
								isLegendary={isLegendary}
								isMythical={isMythical}
								navigateCallback={(pokemon: Pokemon) => {
									navigate(`/pokedex/${pokemon.name}`, {
										state: {
											pokemon: pokemon,
											previous: location.pathname + location.search,
										},
									});
								}}
							/>
						);
					})}
		</div>
	);
};

export default PokemonList;
