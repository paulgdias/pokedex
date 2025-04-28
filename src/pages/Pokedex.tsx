import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { request, gql } from "graphql-request";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { Button } from "react-aria-components";
import { ArrowUp, ChevronsLeft, ChevronsRight, Funnel } from "lucide-react";

import PokemonCard from "@components/PokemonCard";
import PlaceholderCard from "@components/PokemonCard/PlaceholderCard";
import Search from "@components/Search";
import SortingArrow from "@components/Buttons/SortingArrow";

import { Pokemon, PokedexResult } from "@customTypes/PokemonTypes";
import { Sort, Sorting } from "@customTypes/SortingTypes";
import { PokedexSetState } from "@customTypes/PokedexTypes";

import {
	advancedSearch,
	createURLSearchParams,
	convertToSearch,
} from "@utils/search";
import { defaultSorting, getSortingKey, sortPokemonByType } from "@utils/sort";

import { buttonClass, gridClass } from "@styles/Pokedex";
import { twMerge } from "tailwind-merge";
const toggleButtonClass = twMerge(buttonClass, "w-12");

const setState: PokedexSetState = ({
	pokemonData,
	sorting,
	sort,
	setSorting,
	setPokemonData,
	urlParams,
	setURLParams,
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

	const params: Record<string, string> = {
		sort: `${sort}:${sorting[sort].sort === "asc" ? "desc" : "asc"}`,
	};

	if (urlParams) {
		for (const [key, value] of urlParams) {
			if (!params[key]) {
				params[key] = value;
			}
		}
	}

	setURLParams(params, {
		preventScrollReset: true,
	});
};

const Pokedex: React.FC = () => {
	const navigate = useNavigate();
	const [urlParams, setURLParams] = useSearchParams();
	const [showFilters, setShowFilters] = useState<boolean>(false);
	const [sorting, setSorting] = useState<Sorting>({
		...defaultSorting,
		id: {
			sort: "asc",
			selected: true,
		},
	});
	const [pokemonData, setPokemonData] = React.useState<Pokemon[]>([]);

	const { data, isLoading } = useQuery<PokedexResult, Error>({
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
		placeholderData: keepPreviousData,
	});

	useEffect(() => {
		let params: { sort: string; query?: string } = {
			sort: "",
		};
		if (urlParams.size === 0) {
			setURLParams(
				{
					...params,
					sort: `id:${sorting.id.sort}`,
				},
				{
					preventScrollReset: true,
				}
			);
		} else {
			for (const [key, value] of urlParams) {
				params = {
					...params,
					[key]: value,
				};
			}
			if (params) {
				setURLParams(params, {
					preventScrollReset: true,
				});

				const values = params.sort.split(":");
				setSorting({
					...defaultSorting,
					[values[0]]: {
						sort: values[1] ?? "asc",
						selected: true,
					},
				});
			}
		}
	}, []);

	useEffect(() => {
		if (data) {
			const pokemonData = urlParams.has("query")
				? advancedSearch(data.pokemon, convertToSearch(urlParams))
				: data.pokemon;
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
				<div
					className={`flex max-md:flex-col flex-row flex-wrap w-full mb-2 sticky top-0 z-1`}
				>
					<div className="flex flex-row">
						<Funnel className="my-auto mx-1 fill-sky-400" />
						<Button
							aria-label={`${showFilters ? "Show Filters" : "Hide Filters"}`}
							className={`${toggleButtonClass} bg-white`}
							onPress={() => setShowFilters(!showFilters)}
						>
							<div className="flex">
								{showFilters ? (
									<ChevronsLeft className="h-6 w-6 text-black" />
								) : (
									<ChevronsRight className="h-6 w-6 text-black" />
								)}
							</div>
						</Button>
					</div>
					<Search
						className={`${showFilters ? "" : "hidden invisible"}`}
						data={data?.pokemon || []}
						value={convertToSearch(urlParams)}
						isDisabled={isLoading}
						onSubmit={(results, searches) => {
							const sort = getSortingKey(sorting);
							if (sort) {
								const sortingConfig = {
									...defaultSorting,
									[sort]: {
										sort: (sorting?.[sort as keyof Sorting].sort === "asc"
											? "desc"
											: "asc") as Sort,
										selected: true,
									},
								};

								setState({
									pokemonData: sortPokemonByType(
										results,
										sortingConfig,
										sort as keyof Sorting
									),
									setPokemonData,
									sorting: sortingConfig,
									sort: sort as keyof Sorting,
									setSorting,
									urlParams: createURLSearchParams(searches),
									setURLParams,
								});
							}
						}}
					/>
					<Button
						aria-label="Filter by Id"
						className={`${buttonClass} bg-white ${showFilters ? "" : "hidden invisible"} disabled:disabled-component`}
						isDisabled={isLoading}
						onPress={() => {
							setState({
								pokemonData,
								setPokemonData,
								sorting,
								sort: "id",
								setSorting,
								urlParams,
								setURLParams,
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
						className={`${buttonClass} bg-white ${showFilters ? "" : "hidden invisible"} disabled:disabled-component`}
						isDisabled={isLoading}
						onPress={() => {
							setState({
								pokemonData,
								setPokemonData,
								sorting,
								sort: "name",
								setSorting,
								urlParams,
								setURLParams,
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
						className={`${buttonClass} bg-white ${showFilters ? "" : "hidden invisible"} disabled:disabled-component`}
						isDisabled={isLoading}
						onPress={() => {
							setState({
								pokemonData,
								setPokemonData,
								sorting,
								sort: "type",
								setSorting,
								urlParams,
								setURLParams,
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
						className={`${buttonClass} bg-gray-300 hover:bg-gray-200 ${showFilters ? "" : "hidden invisible"} disabled:disabled-component`}
						isDisabled={isLoading}
						onPress={() => {
							setState({
								pokemonData,
								setPokemonData,
								sorting,
								sort: "isLegendary",
								setSorting,
								urlParams,
								setURLParams,
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
						className={`${buttonClass} bg-yellow-400 hover:bg-yellow-300 ${showFilters ? "" : "hidden invisible"} disabled:disabled-component`}
						isDisabled={isLoading}
						onPress={() => {
							setState({
								pokemonData,
								setPokemonData,
								sorting,
								sort: "isMythical",
								setSorting,
								urlParams,
								setURLParams,
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
				</div>
				<div className={gridClass}>
					{isLoading
						? new Array(36)
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
