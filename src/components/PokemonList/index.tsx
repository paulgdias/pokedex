import { useRef } from "react";
import { useNavigate } from "react-router";

import { Grid, AutoSizer } from "react-virtualized";

import { Pokemon } from "@customTypes/PokemonTypes";
import PokemonCard from "@components/PokemonCard";

import { Button } from "react-aria-components";
import { ArrowUp } from "lucide-react";

import "react-virtualized/styles.css";
import PlaceholderCard from "@components/PokemonCard/PlaceholderCard";

const PokemonList = ({
	list,
	isLoading,
}: {
	list: Pokemon[];
	isLoading: Boolean;
}) => {
	const grid = useRef<Grid | null>(null);
	const navigate = useNavigate();

	return (
		<div className="flex h-[85vh]">
			<AutoSizer>
				{({ height, width }) => {
					const columnCount = Math.floor(width / 210);
					const columnWidth = width / columnCount;
					const rowHeight = columnWidth * 1.65;
					const itemCount = list.length
						? list.length
						: columnCount ** columnCount;
					const rowCount = itemCount / columnCount;
					const gridGap = 20;

					return (
						<Grid
							ref={grid}
							cellRenderer={({ key, columnIndex, rowIndex, style }) => {
								if (isLoading || list.length === 0) {
									return (
										<PlaceholderCard
											key={key}
											style={{
												...style,
												height: rowHeight - gridGap,
												width: columnWidth - gridGap,
											}}
										/>
									);
								}

								const index = columnIndex + rowIndex * 6;
								const { is_legendary: isLegendary, is_mythical: isMythical } =
									list[index].specs;

								return (
									<PokemonCard
										key={key}
										style={{
											...style,
											height: rowHeight - gridGap,
											width: columnWidth - gridGap,
										}}
										className="hover:border-sky-500 focus:border-sky-500"
										pokemon={list[index]}
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
							}}
							height={height}
							rowHeight={rowHeight}
							rowCount={rowCount}
							columnCount={columnCount}
							width={width}
							columnWidth={columnWidth}
							tabIndex={-1}
							overscanRowCount={columnCount}
						/>
					);
				}}
			</AutoSizer>
			<Button
				aria-label="Go to Top of Page"
				className="fixed rounded-full bottom-0 right-0 m-4 cursor-pointer bg-gray-700 hover:drop-shadow-md hover:drop-shadow-sky-400 transition-transform duration-300 ease-out transform hover:scale-105"
				onPress={() => {
					if (grid.current) {
						grid.current.scrollToPosition({
							scrollLeft: 0,
							scrollTop: 0,
						});
					}
				}}
			>
				<ArrowUp color="white" size={36} />
			</Button>
		</div>
	);
};

export default PokemonList;
