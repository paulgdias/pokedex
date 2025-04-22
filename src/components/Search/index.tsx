import { useCallback, useState } from "react";

import { SearchIcon } from "lucide-react";

import { Button, Input, SearchField } from "react-aria-components";

import { Pokemon } from "@customTypes/PokemonTypes";

const Search = ({
	data,
	onSubmit,
}: {
	data: Pokemon[];
	onSubmit?: (results: Pokemon[]) => void;
}) => {
	const [search, setSearch] = useState<string>("");

	const searchCallback = useCallback(
		(data: Pokemon[], search: string): Pokemon[] => {
			if (search !== "") {
				const searchResults = data.filter((item) => {
					const number = Number(search);
					if (isNaN(number)) {
						return item.name.includes(search.toLowerCase());
					}
					return item.id === number;
				});
				return searchResults;
			}
			return data;
		},
		[data, search]
	);

	return (
		<div className="flex flex-row p-[6px_10px] my-4 mx-2">
			<SearchIcon color="black" className="mr-2" />
			<SearchField
				aria-label="Search Field"
				type="text"
				onChange={(text) => {
					setSearch(text)
					if (text === "") {
						if (onSubmit) onSubmit(data);
					}
				}}
				onSubmit={(search) => {
					if (onSubmit && search !== "") {
						const results = searchCallback(data, search);
						onSubmit(results);
					}
				}}
				onClear={() => {
					if (onSubmit) onSubmit(data);
				}}
				value={search}
			>
				{({ state }) => (
					<>
						<Input
							title="Search Input"
							className={"border-1 border-black w-56"}
							placeholder="Search by Name or Id"
						/>
						{state.value !== "" && (
							<Button className="cursor-pointer w-6">
								<div tabIndex={0}>x</div>
							</Button>
						)}
					</>
				)}
			</SearchField>
		</div>
	);
};

export default Search;
