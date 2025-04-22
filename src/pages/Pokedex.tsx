import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { request, gql } from "graphql-request";
import { useQuery } from "@tanstack/react-query";

import { Button } from "react-aria-components";
import {
	ArrowUpNarrowWide, // asc
	ArrowDownWideNarrow, // desc
	ArrowUp,
} from "lucide-react";

import PokemonCard from "@components/PokemonCard";
import PlaceholderCard from "@components/PokemonCard/PlaceholderCard";

import { Pokemon, PokedexResult } from "@customTypes/PokemonTypes";
import {
	Sort,
	SortingItem,
	Sorting,
	SortFunction,
} from "@customTypes/SortingTypes";

import { buttonClass, gridClass } from "@styles/Pokedex";
import Search from "@components/Search";

const defaultDescSort: SortingItem = {
	sort: "desc",
	selected: false,
};
const defaultSorting: Sorting = {
	name: defaultDescSort,
	id: defaultDescSort,
	type: defaultDescSort,
	isLegendary: defaultDescSort,
	isMythical: defaultDescSort,
};
const getSortingKey = (sorting: Sorting) => {
	return Object.keys(sorting).find((key) => {
		const typedKey = key as keyof Sorting;
		return sorting[typedKey].selected === true;
	});
};

const basicSortByPokemon = (pokemonData: Pokemon[]): Pokemon[] => {
	return [...pokemonData].sort((a: Pokemon, b: Pokemon) => a.id - b.id);
};
const sortPokemonByType: SortFunction = (pokemonData, sorting, sort) => {
	if (sort === "id") {
		return [...pokemonData].sort((a: Pokemon, b: Pokemon) =>
			sorting[sort].sort === "asc" ? b.id - a.id : a.id - b.id
		);
	}
	if (sort === "type") {
		return basicSortByPokemon([...pokemonData]).sort(
			(a: Pokemon, b: Pokemon) =>
				sorting[sort].sort === "asc"
					? b.types[0].type.name.localeCompare(a.types[0].type.name)
					: a.types[0].type.name.localeCompare(b.types[0].type.name)
		);
	}
	if (sort === "isLegendary") {
		return basicSortByPokemon([...pokemonData]).sort(
			(a: Pokemon, b: Pokemon) =>
				sorting[sort].sort === "desc"
					? b.specs.is_legendary
						? 1
						: -1
					: a.specs.is_legendary
						? -1
						: 1
		);
	}
	if (sort === "isMythical") {
		return basicSortByPokemon([...pokemonData]).sort(
			(a: Pokemon, b: Pokemon) =>
				sorting[sort].sort === "desc"
					? b.specs.is_mythical
						? 1
						: -1
					: a.specs.is_mythical
						? -1
						: 1
		);
	}

	if (sort === "name") {
		return basicSortByPokemon([...pokemonData]).sort(
			(a: Pokemon, b: Pokemon) =>
				sorting[sort].sort === "desc"
					? a.name.localeCompare(b.name)
					: b.name.localeCompare(a.name)
		);
	}
	return basicSortByPokemon(pokemonData);
};

const SortingArrow = ({ sort }: { sort: Sort }) => {
	if (sort === "asc") {
		return <ArrowUpNarrowWide />;
	}

	return <ArrowDownWideNarrow />;
};

const setState = ({
	pokemonData,
	sorting,
	sort,
	setSorting,
	setPokemonData,
	setSearchParams,
}: {
	pokemonData: Pokemon[];
	sorting: Sorting;
	sort: keyof Sorting;
	setSorting: Function;
	setPokemonData: Function;
	setSearchParams: Function;
}) => {
	const data = sortPokemonByType(pokemonData, sorting, sort);
	setSorting({
		...defaultSorting,
		[sort]: {
			sort: sorting[sort].sort === "asc" ? "desc" : "asc",
			selected: true,
		},
	});
	setPokemonData(data);

	const params = new URLSearchParams();
	params.set(sort, sorting[sort].sort === "asc" ? "desc" : "asc");
	setSearchParams(params);
};

const Pokedex: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [sorting, setSorting] = useState<Sorting>({
		...defaultSorting,
		id: {
			sort: "asc",
			selected: true,
		},
	});
	const [pokemonData, setPokemonData] = React.useState<Pokemon[]>([]);
	const { data, isLoading } = useQuery<PokedexResult>({
		queryKey: ["pokedex"],
		queryFn: async (): Promise<PokedexResult> => {
			const query = gql`
				query getPokedex {
					pokemon: pokemon_v2_pokemon {
						id
						name
						sprites: pokemon_v2_pokemonsprites {
							default: sprites(
								path: "other[\\"official-artwork\\"].front_default"
							)
						}
						types: pokemon_v2_pokemontypes {
							type: pokemon_v2_type {
								name
							}
						}
						specs: pokemon_v2_pokemonspecy {
							is_legendary
							is_mythical
							generation_id
						}
					}
				}
			`;
			const data: PokedexResult = await request(
				"https://beta.pokeapi.co/graphql/v1beta",
				query
			);
			return data;
		},
	});

	useEffect(() => {
		const params = new URLSearchParams();
		if (searchParams.size === 0) {
			params.set("id", sorting.id.sort);
			setSearchParams(params, {
				preventScrollReset: true,
			});
		} else {
			const history = Object.entries(Object.fromEntries(searchParams))[0];
			params.set(history[0], history[1]);
			setSearchParams(params, {
				preventScrollReset: true,
			});

			setSorting({
				...defaultSorting,
				[history[0]]: {
					sort: history[1],
					selected: true,
				},
			});
		}
	}, []);

	useEffect(() => {
		if (data) {
			const pokemonData = data.pokemon;
			const sort = getSortingKey(sorting);
			if (sort) {
				setPokemonData(
					sortPokemonByType(
						pokemonData,
						{
							...defaultSorting,
							[sort]: {
								sort:
									sorting?.[sort as keyof Sorting].sort === "asc"
										? "desc"
										: "asc",
								selected: true,
							},
						},
						sort as keyof Sorting
					)
				);
			} else {
				setPokemonData(pokemonData);
			}
		}
	}, [data]);

	return (
		<>
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-row flex-wrap w-full mb-4 md:sticky md:top-0 md:z-1 bg-white rounded-2xl border-2 border-black">
					<div className="p-[6px_10px] mb-4 mt-4">Sort By:</div>
					<Button
						aria-label="Filter by Id"
						className={buttonClass}
						onPress={() => {
							setState({
								pokemonData,
								sorting,
								sort: "id",
								setSorting,
								setPokemonData,
								setSearchParams,
							});
						}}
					>
						<div className="flex flex-row justify-between">
							Id
							{sorting["id"].selected ? (
								<SortingArrow sort={sorting["id"].sort} />
							) : null}
						</div>
					</Button>
					<Button
						aria-label="Filter by Name"
						className={buttonClass}
						onPress={() => {
							setState({
								pokemonData,
								sorting,
								sort: "name",
								setSorting,
								setPokemonData,
								setSearchParams,
							});
						}}
					>
						<div className="flex flex-row justify-between">
							Name
							{sorting["name"].selected ? (
								<SortingArrow sort={sorting["name"].sort} />
							) : null}
						</div>
					</Button>
					<Button
						aria-label="Filter by Type"
						className={buttonClass}
						onPress={() => {
							setState({
								pokemonData,
								sorting,
								sort: "type",
								setSorting,
								setPokemonData,
								setSearchParams,
							});
						}}
					>
						<div className="flex flex-row justify-between">
							Type
							{sorting["type"].selected ? (
								<SortingArrow sort={sorting["type"].sort} />
							) : null}
						</div>
					</Button>
					<Button
						aria-label="Filter by Legendary"
						className={`${buttonClass} bg-gray-300 hover:bg-gray-200`}
						onPress={() => {
							setState({
								pokemonData,
								sorting,
								sort: "isLegendary",
								setSorting,
								setPokemonData,
								setSearchParams,
							});
						}}
					>
						<div className="flex flex-row justify-between truncate">
							Legendary
							{sorting["isLegendary"].selected ? (
								<SortingArrow sort={sorting["isLegendary"].sort} />
							) : null}
						</div>
					</Button>
					<Button
						aria-label="Filter by Mythical"
						className={`${buttonClass} bg-yellow-400 hover:bg-yellow-300`}
						onPress={() => {
							setState({
								pokemonData,
								sorting,
								sort: "isMythical",
								setSorting,
								setPokemonData,
								setSearchParams,
							});
						}}
					>
						<div className="flex flex-row justify-between">
							Mythical
							{sorting["isMythical"].selected ? (
								<SortingArrow sort={sorting["isMythical"].sort} />
							) : null}
						</div>
					</Button>
					<Search
						data={data?.pokemon || []}
						onSubmit={(search) => {
							const sort = getSortingKey(sorting);
							if (sort) {
								setPokemonData(
									sortPokemonByType(
										search,
										{
											...defaultSorting,
											[sort]: {
												sort:
													sorting?.[sort as keyof Sorting].sort === "asc"
														? "desc"
														: "asc",
												selected: true,
											},
										},
										sort as keyof Sorting
									)
								);
							}
						}}
					/>
				</div>
				<div className={gridClass}>
					{isLoading
						? new Array(18)
								.fill(0)
								.map((_, index) => <PlaceholderCard key={index} />)
						: pokemonData.map((pokemon: Pokemon, index: number) => {
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
					<Button
						aria-label="Go to Top of Page"
						className="fixed rounded-full bottom-0 right-0 m-4 cursor-pointer bg-gray-700 hover:drop-shadow-md hover:drop-shadow-sky-400 transition-transform duration-300 ease-out transform hover:scale-105"
						onPress={() =>
							(document.getElementsByClassName("page")[0].scrollTop = 0)
						}
					>
						<ArrowUp color="white" size={42} />
					</Button>
				</div>
			</div>
		</>
	);
};

export default Pokedex;
