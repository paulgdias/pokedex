import { useMemo, useState } from "react";
import { preconnect } from "react-dom";
import { useLoaderData, useLocation, useSearchParams } from "react-router";

import { useQueries } from "@tanstack/react-query";

import { X } from "lucide-react";
import {
    Button,
    ComboBox,
    Input,
    ListBox,
    ListBoxItem,
    Popover,
} from "react-aria-components";

import { PokemonDetails, typeColors } from "@customTypes/PokemonTypes";

import { pokemonInfoQueryOptions } from "@api/pokedex";

import { getGeneration } from "@utils/generations";
import { formatPokedexNumber, getPokemonSuggestions } from "@utils/search";
import {
    MAX_STAT,
    STAT_LABELS,
    formatHeight,
    formatName,
    formatWeight,
} from "@utils/stats";
import { useNavigateToPokemon } from "@utils/useNavigateToPokemon";

import { typeDotClass, typePillClass } from "@styles/Pokedex";

const IDS_PARAM = "ids";
const MAX_COMPARED = 3;

const parseIds = (params: URLSearchParams) => [
    ...new Set(
        (params.get(IDS_PARAM) ?? "")
            .split(",")
            .map(Number)
            .filter((id) => Number.isInteger(id) && id > 0)
    ),
];

/** Positions holding the highest value, when the values actually differ. */
const bestPositions = (values: number[]) => {
    const max = Math.max(...values);
    return values.length > 1 && values.some((value) => value !== max)
        ? new Set(values.flatMap((v, i) => (v === max ? [i] : [])))
        : new Set<number>();
};

const Picker = ({
    pokemon,
    excludedIds,
    onAdd,
}: {
    pokemon: PokemonDetails[];
    excludedIds: number[];
    onAdd: (id: number) => void;
}) => {
    const [text, setText] = useState("");
    const suggestions = useMemo(
        () =>
            getPokemonSuggestions(pokemon, text, 30)
                .filter((item) => !excludedIds.includes(item.id))
                .slice(0, 8),
        [pokemon, text, excludedIds]
    );

    return (
        <ComboBox
            aria-label="Add a Pokémon to compare"
            items={suggestions}
            inputValue={text}
            onInputChange={setText}
            selectedKey={null}
            onSelectionChange={(key) => {
                if (key !== null) {
                    onAdd(Number(key));
                    setText("");
                }
            }}
            allowsEmptyCollection
            className="relative w-full max-w-sm"
        >
            <Input
                placeholder="Add a Pokémon by name or number"
                className="h-13 w-full rounded-[14px] border-[1.5px] border-line-strong bg-surface px-4 text-[15px] placeholder:text-subtle focus:border-accent"
            />
            <Popover className="w-(--trigger-width) rounded-[14px] border border-line-strong bg-surface p-2 shadow-popover">
                <ListBox
                    className="max-h-72 overflow-y-auto outline-none"
                    renderEmptyState={() => (
                        <div className="px-3 py-2 text-sm text-muted">
                            {text.trim()
                                ? "No matches"
                                : "Start typing a name or number"}
                        </div>
                    )}
                >
                    {(item: PokemonDetails) => (
                        <ListBoxItem
                            id={item.id}
                            textValue={item.name}
                            className="flex cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-1.5 outline-none data-[focused]:bg-chip"
                        >
                            <img
                                src={item.sprite}
                                alt=""
                                className="size-8 object-contain"
                            />
                            <span className="w-11 font-mono text-xs text-subtle">
                                {formatPokedexNumber(item.id)}
                            </span>
                            <span className="font-semibold capitalize">
                                {item.name}
                            </span>
                        </ListBoxItem>
                    )}
                </ListBox>
            </Popover>
        </ComboBox>
    );
};

const Compare: React.FC = () => {
    preconnect("https://beta.pokeapi.co");
    preconnect("https://raw.githubusercontent.com/");

    const allPokemon = useLoaderData() as PokemonDetails[];
    const [params, setParams] = useSearchParams();
    const { pathname, search, state } = useLocation();
    // arriving from a pokémon page hands over where that page came from, so
    // Back from the next pokémon returns there rather than to this page
    const cameFrom = (state as { previous?: string } | null)?.previous;
    const navigateToPokemon = useNavigateToPokemon(
        cameFrom ?? pathname + search
    );

    const ids = parseIds(params).slice(0, MAX_COMPARED);
    const selected = ids
        .map((id) => allPokemon.find((item) => item.id === id))
        .filter((item): item is PokemonDetails => Boolean(item));

    const infoQueries = useQueries({
        queries: selected.map((item) => pokemonInfoQueryOptions(item.id)),
    });

    const setIds = (next: number[]) => {
        const updated = new URLSearchParams(params);
        if (next.length > 0) {
            updated.set(IDS_PARAM, next.join(","));
        } else {
            updated.delete(IDS_PARAM);
        }
        // keep the router state, or editing the list forgets where we came from
        setParams(updated, { replace: true, preventScrollReset: true, state });
    };

    const selectedIds = selected.map((item) => item.id);
    const statRows = STAT_LABELS.map((label, index) => ({
        label,
        values: selected.map((item) => item.stats[index] ?? 0),
    }));
    const totalRow = selected.map((item) => item.statTotal);

    const infoCell = (
        index: number,
        render: (
            info: NonNullable<(typeof infoQueries)[number]["data"]>
        ) => React.ReactNode
    ) => {
        const query = infoQueries[index];
        return query.data ? (
            render(query.data)
        ) : (
            <span className="text-muted">{query.isError ? "—" : "…"}</span>
        );
    };

    const headerCell = "px-3 py-3 align-bottom";
    const labelCell =
        "px-3 py-2.5 text-left text-sm font-normal text-muted whitespace-nowrap";
    const valueCell = "px-3 py-2.5 align-top text-sm";

    return (
        <div className="pokedex-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="flex flex-col gap-4 border-b border-line px-4 pt-6 pb-5 lg:px-8">
                <h1 className="font-display text-[34px] leading-tight font-bold tracking-tight">
                    Compare
                </h1>
                {selected.length < MAX_COMPARED && (
                    <Picker
                        pokemon={allPokemon}
                        excludedIds={selectedIds}
                        onAdd={(id) => setIds([...selectedIds, id])}
                    />
                )}
            </div>

            <div className="px-4 py-7 lg:px-8">
                {selected.length < 2 ? (
                    <p className="text-[15px] text-muted">
                        {selected.length === 0
                            ? "Add two or three Pokémon to compare their stats side by side."
                            : "Add at least one more Pokémon to compare."}
                    </p>
                ) : null}

                {selected.length > 0 && (
                    <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
                        <table className="w-full min-w-[34rem] table-fixed border-collapse">
                            <caption className="sr-only">
                                Stats compared for{" "}
                                {selected.map((item) => item.name).join(", ")}
                            </caption>
                            <colgroup>
                                <col className="w-24" />
                                {selected.map((item) => (
                                    <col key={item.id} />
                                ))}
                            </colgroup>
                            <thead>
                                <tr className="border-b border-line">
                                    <td />
                                    {selected.map((item) => (
                                        <th
                                            key={item.id}
                                            scope="col"
                                            className={`${headerCell} text-left font-normal`}
                                        >
                                            <div className="flex flex-col items-start gap-1.5">
                                                <div className="flex w-full items-start justify-between">
                                                    <span className="font-mono text-xs text-subtle">
                                                        {formatPokedexNumber(
                                                            item.id
                                                        )}
                                                    </span>
                                                    <Button
                                                        aria-label={`Remove ${item.name}`}
                                                        onPress={() =>
                                                            setIds(
                                                                selectedIds.filter(
                                                                    (id) =>
                                                                        id !==
                                                                        item.id
                                                                )
                                                            )
                                                        }
                                                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-chip hover:text-ink"
                                                    >
                                                        <X
                                                            size={16}
                                                            aria-hidden="true"
                                                        />
                                                    </Button>
                                                </div>
                                                <img
                                                    src={item.sprite}
                                                    alt=""
                                                    className="h-28 w-auto max-w-full self-center object-contain"
                                                />
                                                <a
                                                    href={`/pokedex/${item.name}`}
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        navigateToPokemon(
                                                            event,
                                                            item
                                                        );
                                                    }}
                                                    className="truncate font-display text-xl font-bold capitalize"
                                                >
                                                    {item.name}
                                                </a>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                <tr>
                                    <th scope="row" className={labelCell}>
                                        Types
                                    </th>
                                    {selected.map((item) => (
                                        <td key={item.id} className={valueCell}>
                                            <div className="flex flex-wrap gap-1.5">
                                                {item.types.map((type) => (
                                                    <span
                                                        key={type}
                                                        className={
                                                            typePillClass
                                                        }
                                                    >
                                                        <span
                                                            className={`${typeDotClass} ${typeColors[type]}`}
                                                        />
                                                        {type}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <th scope="row" className={labelCell}>
                                        Generation
                                    </th>
                                    {selected.map((item) => (
                                        <td key={item.id} className={valueCell}>
                                            {getGeneration(item.generationId)
                                                ?.region ?? "—"}
                                        </td>
                                    ))}
                                </tr>
                                {statRows.map(({ label, values }) => {
                                    const best = bestPositions(values);
                                    return (
                                        <tr key={label}>
                                            <th
                                                scope="row"
                                                className={labelCell}
                                            >
                                                {label}
                                            </th>
                                            {values.map((value, index) => (
                                                <td
                                                    key={selected[index].id}
                                                    className={valueCell}
                                                >
                                                    <span
                                                        className={`font-mono font-semibold ${
                                                            best.has(index)
                                                                ? "text-accent"
                                                                : ""
                                                        }`}
                                                    >
                                                        {value}
                                                        {best.has(index) && (
                                                            <span className="sr-only">
                                                                {" "}
                                                                (highest)
                                                            </span>
                                                        )}
                                                    </span>
                                                    <div
                                                        aria-hidden="true"
                                                        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-track"
                                                    >
                                                        <div
                                                            className={`h-full rounded-full ${best.has(index) ? "bg-accent" : "bg-subtle"}`}
                                                            style={{
                                                                width: `${(Math.min(value, MAX_STAT) / MAX_STAT) * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                                <tr>
                                    <th
                                        scope="row"
                                        className={`${labelCell} font-semibold text-ink`}
                                    >
                                        Total
                                    </th>
                                    {totalRow.map((value, index) => (
                                        <td
                                            key={selected[index].id}
                                            className={`${valueCell} font-mono font-bold ${
                                                bestPositions(totalRow).has(
                                                    index
                                                )
                                                    ? "text-accent"
                                                    : ""
                                            }`}
                                        >
                                            {value}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <th scope="row" className={labelCell}>
                                        Height
                                    </th>
                                    {selected.map((item, index) => (
                                        <td key={item.id} className={valueCell}>
                                            {infoCell(index, (info) =>
                                                formatHeight(info.height)
                                            )}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <th scope="row" className={labelCell}>
                                        Weight
                                    </th>
                                    {selected.map((item, index) => (
                                        <td key={item.id} className={valueCell}>
                                            {infoCell(index, (info) =>
                                                formatWeight(info.weight)
                                            )}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <th scope="row" className={labelCell}>
                                        Abilities
                                    </th>
                                    {selected.map((item, index) => (
                                        <td key={item.id} className={valueCell}>
                                            {infoCell(index, (info) => (
                                                <ul className="flex flex-col gap-1">
                                                    {info.abilities.map(
                                                        (ability) => (
                                                            <li
                                                                key={
                                                                    ability.name
                                                                }
                                                            >
                                                                {formatName(
                                                                    ability.name
                                                                )}
                                                                {ability.isHidden && (
                                                                    <span className="text-muted">
                                                                        {" "}
                                                                        (hidden)
                                                                    </span>
                                                                )}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            ))}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Compare;
