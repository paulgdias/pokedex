import { useEffect, useRef } from "react";

import { ArrowDown, ArrowUp } from "lucide-react";
import AutoSizer from "react-virtualized/dist/es/AutoSizer";
import List from "react-virtualized/dist/es/List";

import ScrollTopButton from "@components/Buttons/ScrollTopButton";
import { PokemonDetails, typeColors } from "@customTypes/PokemonTypes";
import { STAT_SORT_KEYS, SortKey, SortState } from "@customTypes/SortingTypes";

import { formatPokedexNumber } from "@utils/search";
import { getNextSort } from "@utils/sort";
import { STAT_LABELS } from "@utils/stats";
import { useNavigateToPokemon } from "@utils/useNavigateToPokemon";

import { typeDotClass } from "@styles/Pokedex";

import "react-virtualized/styles.css";

const ROW_HEIGHT = 56;
const COLUMNS =
    "grid items-center gap-x-3 px-4 grid-cols-[3.5rem_minmax(0,3fr)_minmax(5rem,1fr)_3.5rem] md:grid-cols-[3.5rem_minmax(0,3fr)_minmax(5rem,1fr)_repeat(6,3.25rem)_3.5rem]";
const STAT_CELL = "hidden text-right md:block";

const SHORT_STAT_LABELS = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];

const HeaderCell = ({
    label,
    sortKey,
    sort,
    onSortChange,
    align = "left",
    className,
}: {
    label: string;
    sortKey: SortKey;
    sort: SortState;
    onSortChange: (sort: SortState) => void;
    align?: "left" | "right";
    className?: string;
}) => {
    const isSorted = sort.key === sortKey;
    // numeric columns start high-to-low, since that is what you look for
    const isNumeric =
        sortKey !== "id" && sortKey !== "name" && sortKey !== "type";
    const Arrow = sort.direction === "asc" ? ArrowUp : ArrowDown;

    return (
        <div
            role="columnheader"
            aria-sort={
                isSorted
                    ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                    : "none"
            }
            className={className}
        >
            <button
                type="button"
                onClick={() =>
                    onSortChange(
                        isNumeric && !isSorted
                            ? { key: sortKey, direction: "desc" }
                            : getNextSort(sort, sortKey)
                    )
                }
                className={`flex h-9 w-full cursor-pointer items-center gap-1 rounded-lg text-xs font-bold tracking-wide uppercase focus-visible:-outline-offset-2 ${
                    align === "right" ? "justify-end" : ""
                } ${isSorted ? "text-ink" : "text-muted hover:text-ink"}`}
            >
                {label}
                {isSorted && <Arrow size={12} aria-hidden="true" />}
            </button>
        </div>
    );
};

const PokemonTable = ({
    pokemon,
    sort,
    onSortChange,
    previous,
}: {
    pokemon: PokemonDetails[];
    sort: SortState;
    onSortChange: (sort: SortState) => void;
    previous?: string;
}) => {
    const list = useRef<List | null>(null);
    const navigateToPokemon = useNavigateToPokemon(previous);

    useEffect(() => {
        list.current?.scrollToPosition(0);
    }, [pokemon]);

    return (
        <div className="flex min-h-0 flex-1 flex-col pb-4">
            <div
                role="table"
                aria-label="Pokémon"
                aria-rowcount={pokemon.length + 1}
                className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface"
            >
                <div
                    role="row"
                    className={`${COLUMNS} border-b border-line bg-wash`}
                >
                    <HeaderCell
                        label="#"
                        sortKey="id"
                        sort={sort}
                        onSortChange={onSortChange}
                    />
                    <HeaderCell
                        label="Pokémon"
                        sortKey="name"
                        sort={sort}
                        onSortChange={onSortChange}
                    />
                    <HeaderCell
                        label="Types"
                        sortKey="type"
                        sort={sort}
                        onSortChange={onSortChange}
                    />
                    {STAT_SORT_KEYS.map((key, index) => (
                        <HeaderCell
                            key={key}
                            label={SHORT_STAT_LABELS[index]}
                            sortKey={key}
                            sort={sort}
                            onSortChange={onSortChange}
                            align="right"
                            className={STAT_CELL}
                        />
                    ))}
                    <HeaderCell
                        label="Total"
                        sortKey="total"
                        sort={sort}
                        onSortChange={onSortChange}
                        align="right"
                    />
                </div>
                <div className="min-h-0 flex-1">
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                ref={list}
                                className="pokedex-scroll"
                                width={width}
                                height={height}
                                rowCount={pokemon.length}
                                rowHeight={ROW_HEIGHT}
                                overscanRowCount={8}
                                role="rowgroup"
                                containerRole="presentation"
                                aria-label="Pokémon list"
                                // aria-readonly is not valid on a rowgroup
                                aria-readonly={null as never}
                                tabIndex={-1}
                                style={{ outline: "none" }}
                                rowRenderer={({ index, key, style }) => {
                                    const item = pokemon[index];

                                    return (
                                        <div
                                            key={key}
                                            role="row"
                                            aria-rowindex={index + 2}
                                            style={style}
                                            className={`${COLUMNS} relative border-b border-line hover:bg-chip`}
                                        >
                                            <div
                                                role="cell"
                                                className="font-mono text-xs text-subtle"
                                            >
                                                {formatPokedexNumber(item.id)}
                                            </div>
                                            <div
                                                role="cell"
                                                className="flex min-w-0 items-center gap-3"
                                            >
                                                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sand">
                                                    {item.sprite && (
                                                        <img
                                                            src={item.sprite}
                                                            alt=""
                                                            loading="lazy"
                                                            decoding="async"
                                                            className="size-9 object-contain"
                                                        />
                                                    )}
                                                </span>
                                                <a
                                                    href={`/pokedex/${item.name}`}
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        navigateToPokemon(
                                                            event,
                                                            item
                                                        );
                                                    }}
                                                    className="truncate font-semibold capitalize after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
                                                >
                                                    {item.name}
                                                </a>
                                            </div>
                                            <div
                                                role="cell"
                                                className="flex flex-col gap-0.5"
                                            >
                                                {item.types.map((type) => (
                                                    <span
                                                        key={type}
                                                        className="flex items-center gap-1.5 text-xs font-semibold capitalize text-pill-text"
                                                    >
                                                        <span
                                                            className={`${typeDotClass} ${typeColors[type]}`}
                                                        />
                                                        {type}
                                                    </span>
                                                ))}
                                            </div>
                                            {STAT_LABELS.map((label, stat) => (
                                                <div
                                                    key={label}
                                                    role="cell"
                                                    className={`${STAT_CELL} font-mono text-sm`}
                                                >
                                                    {item.stats[stat] ?? "—"}
                                                </div>
                                            ))}
                                            <div
                                                role="cell"
                                                className="text-right font-mono text-sm font-bold"
                                            >
                                                {item.statTotal}
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                        )}
                    </AutoSizer>
                </div>
            </div>
            <ScrollTopButton
                onPress={() => list.current?.scrollToPosition(0)}
            />
        </div>
    );
};

export default PokemonTable;
