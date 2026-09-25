import { useState } from "react";

import {
    ArrowDown01,
    ArrowDown10,
    ArrowDownAZ,
    ArrowDownZA,
    ArrowUpDown,
    LucideIcon,
    Search,
    X,
} from "lucide-react";
import { ToggleButton, ToggleButtonGroup } from "react-aria-components";

import { PokemonDetails, typeColors } from "@customTypes/PokemonTypes";
import { SortState } from "@customTypes/SortingTypes";

import { GENERATIONS } from "@utils/generations";
import {
    Category,
    PokedexFilters,
    formatPokedexNumber,
    getFilterSuggestions,
    getPokemonSuggestions,
} from "@utils/search";

import { typeDotClass } from "@styles/Pokedex";

import FilterChips from "./FilterChips";
import TypeFilter from "./TypeFilter";

const SORT_OPTIONS: { label: string; value: SortState; icon: LucideIcon }[] = [
    {
        label: "Number Asc",
        value: { key: "id", direction: "asc" },
        icon: ArrowDown01,
    },
    {
        label: "Number Desc",
        value: { key: "id", direction: "desc" },
        icon: ArrowDown10,
    },
    {
        label: "Name A–Z",
        value: { key: "name", direction: "asc" },
        icon: ArrowDownAZ,
    },
    {
        label: "Name Z–A",
        value: { key: "name", direction: "desc" },
        icon: ArrowDownZA,
    },
];

const sortValue = ({ key, direction }: SortState) => `${key}:${direction}`;

const CATEGORY_OPTIONS: { id: "all" | Category; label: string }[] = [
    { id: "all", label: "All" },
    { id: "legendary", label: "Legendary" },
    { id: "mythical", label: "Mythical" },
];

const sectionLabelClass =
    "px-2.5 pt-2 pb-1 text-[11px] font-bold tracking-widest text-subtle uppercase";

const SearchBar = ({
    pokemon,
    filters,
    onFiltersChange,
    onTextChange,
    onClearAll,
    sort,
    onSortChange,
    resultCount,
}: {
    /** the whole dex; suggestions ignore the current filters */
    pokemon: PokemonDetails[];
    filters: PokedexFilters;
    onFiltersChange: (patch: Partial<PokedexFilters>) => void;
    onTextChange: (text: string) => void;
    onClearAll: () => void;
    sort: SortState;
    onSortChange: (sort: SortState) => void;
    resultCount: number;
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    // the icon mirrors the active sort (e.g. arrow-down-a-z for Name A–Z)
    const SortIcon =
        SORT_OPTIONS.find(({ value }) => sortValue(value) === sortValue(sort))
            ?.icon ?? ArrowUpDown;

    const query = filters.text.trim();
    const filterSuggestions = getFilterSuggestions(query, filters);
    const pokemonSuggestions = getPokemonSuggestions(pokemon, query);
    const showSuggestions = isFocused && query !== "";
    const isEmpty =
        filterSuggestions.length === 0 && pokemonSuggestions.length === 0;

    // one flat list so arrow keys walk through both groups
    const options = [
        ...filterSuggestions.map(
            (suggestion) => () => onFiltersChange(suggestion.patch)
        ),
        ...pokemonSuggestions.map(
            (item) => () =>
                onFiltersChange({
                    text: item.name,
                    generation: null,
                    category: null,
                    types: [],
                })
        ),
    ];

    const pick = (index: number) => {
        options[index]?.();
        setIsFocused(false);
        setActiveIndex(-1);
    };

    const optionId = (index: number) => `pokedex-suggestion-${index}`;

    return (
        <div className="relative z-5 flex flex-col gap-3.5 border-b border-line bg-paper px-4 pt-5 pb-3.5 lg:px-8">
            <div className="flex items-center gap-3">
                <div className="relative grow">
                    <label className="flex h-13 items-center gap-3 rounded-[14px] border-[1.5px] border-line-strong bg-surface px-4 focus-within:border-accent focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-accent)_12%,transparent)]">
                        <Search
                            size={20}
                            className="shrink-0 text-muted"
                            aria-hidden="true"
                        />
                        <span className="sr-only">Search Pokémon</span>
                        <input
                            type="search"
                            role="combobox"
                            aria-expanded={showSuggestions}
                            aria-controls="pokedex-suggestions"
                            aria-autocomplete="list"
                            aria-activedescendant={
                                showSuggestions && activeIndex >= 0
                                    ? optionId(activeIndex)
                                    : undefined
                            }
                            value={filters.text}
                            placeholder="Search by name, number, type or region…"
                            className="h-full min-w-0 grow bg-transparent text-base text-ink placeholder:text-subtle"
                            onChange={(event) => {
                                onTextChange(event.target.value);
                                setActiveIndex(-1);
                                setIsFocused(true);
                            }}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onKeyDown={(event) => {
                                if (event.key === "Escape") {
                                    setIsFocused(false);
                                } else if (event.key === "ArrowDown") {
                                    event.preventDefault();
                                    setIsFocused(true);
                                    setActiveIndex((index) =>
                                        Math.min(index + 1, options.length - 1)
                                    );
                                } else if (event.key === "ArrowUp") {
                                    event.preventDefault();
                                    setActiveIndex((index) =>
                                        Math.max(index - 1, -1)
                                    );
                                } else if (event.key === "Enter") {
                                    if (showSuggestions && activeIndex >= 0) {
                                        event.preventDefault();
                                        pick(activeIndex);
                                    } else {
                                        setIsFocused(false);
                                    }
                                }
                            }}
                        />
                        {filters.text && (
                            <button
                                type="button"
                                aria-label="Clear search"
                                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-chip text-muted"
                                onClick={() => onTextChange("")}
                            >
                                <X size={14} aria-hidden="true" />
                            </button>
                        )}
                    </label>

                    {showSuggestions && (
                        <div
                            id="pokedex-suggestions"
                            role="listbox"
                            aria-label="Suggestions"
                            className="absolute inset-x-0 top-15 flex flex-col gap-1 rounded-[14px] border border-line-strong bg-surface p-2 shadow-popover"
                        >
                            {filterSuggestions.length > 0 && (
                                <>
                                    <div className={sectionLabelClass}>
                                        Add filter
                                    </div>
                                    <div className="flex flex-wrap gap-2 px-2 pb-2">
                                        {filterSuggestions.map(
                                            (suggestion, index) => (
                                                <div
                                                    key={suggestion.key}
                                                    id={optionId(index)}
                                                    role="option"
                                                    aria-selected={
                                                        activeIndex === index
                                                    }
                                                    onMouseDown={(event) => {
                                                        event.preventDefault();
                                                        pick(index);
                                                    }}
                                                    className={`flex h-[34px] cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-semibold text-ink ${
                                                        activeIndex === index
                                                            ? "border-ink bg-chip"
                                                            : "border-line-strong bg-wash"
                                                    }`}
                                                >
                                                    {suggestion.type ? (
                                                        <span
                                                            className={`${typeDotClass} size-2.5 ${typeColors[suggestion.type]}`}
                                                        />
                                                    ) : (
                                                        <span
                                                            className={`size-2.5 rounded-[3px] ${suggestion.kind === "only" ? "bg-ink" : "bg-accent"}`}
                                                        />
                                                    )}
                                                    {suggestion.label}
                                                    <span className="font-medium text-subtle">
                                                        {suggestion.kind}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </>
                            )}
                            {pokemonSuggestions.length > 0 && (
                                <>
                                    <div className={sectionLabelClass}>
                                        Pokémon
                                    </div>
                                    {pokemonSuggestions.map((item, i) => {
                                        const index =
                                            filterSuggestions.length + i;
                                        return (
                                            <div
                                                key={item._id}
                                                id={optionId(index)}
                                                role="option"
                                                aria-selected={
                                                    activeIndex === index
                                                }
                                                onMouseDown={(event) => {
                                                    event.preventDefault();
                                                    pick(index);
                                                }}
                                                className={`flex h-12 cursor-pointer items-center gap-3 rounded-[10px] px-2.5 text-[15px] text-ink hover:bg-chip ${
                                                    activeIndex === index
                                                        ? "bg-chip"
                                                        : ""
                                                }`}
                                            >
                                                <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sand">
                                                    {item.sprite && (
                                                        <img
                                                            src={item.sprite}
                                                            alt=""
                                                            loading="lazy"
                                                            className="size-8 object-contain"
                                                        />
                                                    )}
                                                </span>
                                                <span className="w-11 font-mono text-xs text-subtle">
                                                    {formatPokedexNumber(
                                                        item._id
                                                    )}
                                                </span>
                                                <span className="grow truncate font-semibold capitalize">
                                                    {item.name}
                                                </span>
                                                <span className="flex gap-1.5">
                                                    {item.types.map((type) => (
                                                        <span
                                                            key={type}
                                                            className="flex items-center gap-1.5 text-xs text-muted capitalize"
                                                        >
                                                            <span
                                                                className={`${typeDotClass} ${typeColors[type]}`}
                                                            />
                                                            {type}
                                                        </span>
                                                    ))}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                            {isEmpty && (
                                <div className="px-2.5 py-3.5 text-sm text-subtle">
                                    No matches for “{query}”
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <label className="flex h-13 shrink-0 items-center gap-2 rounded-[14px] border-[1.5px] border-line-strong bg-surface pr-1.5 pl-3.5 text-sm text-muted">
                    <SortIcon size={18} aria-hidden="true" />
                    <span className="max-sm:sr-only">Sort</span>
                    <select
                        value={sortValue(sort)}
                        onChange={(event) => {
                            const option = SORT_OPTIONS.find(
                                ({ value }) =>
                                    sortValue(value) === event.target.value
                            );
                            if (option) onSortChange(option.value);
                        }}
                        className="h-10 bg-transparent pr-1.5 text-sm font-semibold text-ink"
                    >
                        {SORT_OPTIONS.map(({ label, value }) => (
                            <option key={label} value={sortValue(value)}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <TypeFilter
                    types={filters.types}
                    resultCount={resultCount}
                    onChange={(types) => onFiltersChange({ types })}
                />

                {/* the sidebar lists generations on wide screens */}
                <label className="flex h-10 items-center gap-2 rounded-[10px] border-[1.5px] border-line-strong bg-surface pl-3.5 text-sm font-semibold text-ink lg:hidden">
                    Gen
                    <select
                        value={filters.generation ?? 0}
                        onChange={(event) =>
                            onFiltersChange({
                                generation: Number(event.target.value) || null,
                            })
                        }
                        className="h-9 bg-transparent pr-1.5"
                    >
                        <option value={0}>All</option>
                        {GENERATIONS.map(({ id, roman, region }) => (
                            <option key={id} value={id}>
                                {roman} · {region}
                            </option>
                        ))}
                    </select>
                </label>

                <ToggleButtonGroup
                    aria-label="Category"
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={[filters.category ?? "all"]}
                    onSelectionChange={(keys) => {
                        const [id] = Array.from(keys);
                        onFiltersChange({
                            category: id === "all" ? null : (id as Category),
                        });
                    }}
                    className="flex gap-0.5 rounded-xl bg-track p-[3px]"
                >
                    {CATEGORY_OPTIONS.map(({ id, label }) => (
                        <ToggleButton
                            key={id}
                            id={id}
                            className={({ isSelected }) =>
                                `h-[34px] cursor-pointer rounded-[9px] px-3.5 text-sm font-semibold ${
                                    isSelected
                                        ? "bg-surface text-ink shadow-segment"
                                        : "text-muted"
                                }`
                            }
                        >
                            {label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>

                <div className="grow" />
                <div className="text-sm text-muted" aria-live="polite">
                    <strong className="text-ink">{resultCount}</strong> shown
                </div>
            </div>

            <FilterChips
                filters={filters}
                onChange={onFiltersChange}
                onClearAll={onClearAll}
            />
        </div>
    );
};

export default SearchBar;
