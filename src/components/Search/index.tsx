import { useCallback, useState } from "react";

import { SearchIcon, Info } from "lucide-react";

import {
    Input,
    SearchField,
    Tooltip,
    TooltipTrigger,
    Focusable,
} from "react-aria-components";

import { PokemonDetails } from "@customTypes/PokemonTypes";

import { advancedSearch, searchRegex } from "@utils/search";

import { twMerge } from "tailwind-merge";

const searchFunction = (data: PokemonDetails[], search: string): PokemonDetails[] => {
    if (search === "") {
        return data;
    }
    return advancedSearch(data, search);
};

const Search = ({
    className,
    data,
    value,
    isDisabled,
    onSubmit,
    onChange,
}: {
    className?: string;
    data: PokemonDetails[];
    value?: string;
    isDisabled?: boolean;
    onSubmit?: (results: PokemonDetails[], searches?: RegExpExecArray[]) => void;
    onChange?: (text: string) => void;
}) => {
    const [search, setSearch] = useState<string>(value ?? "");

    return (
        <div
            className={`${twMerge("flex flex-row p-[6px_10px] my-3 mx-2 max-w-sm", className)}`}
        >
            <SearchIcon className="fill-white stroke-black mr-2" size={26} />
            <SearchField
                aria-label="Search Field"
                className="mr-2 flex flex-row"
                onChange={(text) => {
                    setSearch(text);
                    if (text === "") {
                        if (onSubmit) onSubmit(data);
                    } else {
                        if (onChange) onChange(text);
                    }
                }}
                onSubmit={(search) => {
                    if (onSubmit && search !== "") {
                        if (!search.includes("+") && !search.includes(":")) {
                            const results = searchFunction(
                                data,
                                `+name:${search}`
                            );
                            onSubmit(results, [
                                ...`+name:${search}`.matchAll(searchRegex),
                            ]);
                        }
                        const results = searchFunction(data, search);
                        onSubmit(results, [...search.matchAll(searchRegex)]);
                    }
                }}
                onClear={() => {
                    if (onSubmit) onSubmit(data);
                }}
                value={search}
            >
                <Input
                    title="Search Input"
                    className={
                        "bg-white border-1 border-black w-56 disabled:disabled-component"
                    }
                    placeholder="Search"
                    {...(isDisabled ? { disabled: isDisabled } : {})}
                />
            </SearchField>

            <TooltipTrigger delay={100} closeDelay={100}>
                <Focusable>
                    <Info
                        className="fill-white stroke-sky-700 mt-1"
                        size={18}
                    ></Info>
                </Focusable>
                <Tooltip
                    placement="top"
                    className="bg-sky-700 text-white text-xs p-2 ml-2"
                >
                    Advanced Search: <br />{" "}
                    {`ex. +gen=1 +isLegendary=true +type=flying`}
                </Tooltip>
            </TooltipTrigger>
        </div>
    );
};

export default Search;
