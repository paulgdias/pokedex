import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "react-aria-components";

import SortingArrow from "@components/Buttons/SortingArrow";
import Pokeball from "@components/Icons/Pokeball";
import Search from "@components/Search";

import { PokemonDetails } from "@customTypes/PokemonTypes";
import { Sorting } from "@customTypes/SortingTypes";

import {
    basicSearch,
    convertToSearch,
    createURLSearchParams,
} from "@utils/search";
import { getSortingKey } from "@utils/sort";

import { buttonClass } from "@styles/Pokedex";
import { twMerge } from "tailwind-merge";

const toggleButtonClass = twMerge(buttonClass, "w-12");

const sortButtons: {
    key: keyof Sorting;
    label: string;
    className?: string;
}[] = [
    { key: "id", label: "Id" },
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    {
        key: "isLegendary",
        label: "Legendary",
        className: "bg-gray-300 hover:bg-gray-200",
    },
    {
        key: "isMythical",
        label: "Mythical",
        className: "bg-yellow-400 hover:bg-yellow-300",
    },
];

const SearchBar = ({
    initialData,
    urlParams,
    setURLParams,
    sorting,
    setSort,
    showFilters,
    setShowFilters,
    setPreviewData,
}: {
    initialData: PokemonDetails[];
    urlParams: URLSearchParams;
    setURLParams: (
        params: URLSearchParams,
        options?: { preventScrollReset?: boolean; replace?: boolean }
    ) => void;
    sorting: Sorting;
    setSort: (sortKey: keyof Sorting) => void;
    showFilters: boolean;
    setShowFilters: (showFilters: boolean) => void;
    setPreviewData: (data: PokemonDetails[] | null) => void;
}) => {
    return (
        <div
            className={`
                flex max-md:flex-col flex-row flex-wrap m-auto mt-4 fixed top-0 z-1
                bg-white/20 rounded-2xl shadow-lg backdrop-blur-sm border border-white/30
                `}
        >
            <div className="flex flex-row">
                <div className="my-4 mx-1">
                    <Pokeball />
                </div>
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
                data={initialData}
                value={convertToSearch(urlParams)}
                onChange={(text) => {
                    if (!text.includes("+")) {
                        setPreviewData(basicSearch(initialData, text));
                    }
                }}
                onSubmit={(_results, searches) => {
                    const sortKey = getSortingKey(sorting) as keyof Sorting;

                    const params = new URLSearchParams();
                    params.set("sort", `${sortKey}:${sorting[sortKey].sort}`);
                    const query = createURLSearchParams(searches).get("query");
                    if (query) params.set("query", query);

                    setURLParams(params, {
                        preventScrollReset: true,
                    });
                    setPreviewData(null);

                    // hide filters if less than md breakpoint
                    if (window.innerWidth < 640) {
                        setShowFilters(false);
                    }
                }}
            />
            {sortButtons.map(({ key, label, className }) => (
                <Button
                    key={key}
                    aria-label={`Filter by ${label}`}
                    className={`${buttonClass} ${className ?? "bg-white"} ${showFilters ? "" : "hidden invisible"} disabled:disabled-component`}
                    onPress={() => setSort(key)}
                >
                    <div className="flex flex-row justify-between truncate">
                        {label}
                        {sorting[key].selected ? (
                            <SortingArrow sort={sorting[key].sort} />
                        ) : null}
                    </div>
                </Button>
            ))}
        </div>
    );
};

export default SearchBar;
