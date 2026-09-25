import { useState } from "react";
import { preconnect } from "react-dom";

import { useQuery } from "@tanstack/react-query";

import { TypeEfficacy, typeColors } from "@customTypes/PokemonTypes";

import { typeEfficacyQueryOptions } from "@api/pokedex";

import { TYPE_ORDER, getOffense, getTypeMatchups } from "@utils/stats";

import { typeDotClass, typePillClass } from "@styles/Pokedex";

type PokemonType = (typeof TYPE_ORDER)[number];

const CELL_LABELS: Record<number, string> = {
    4: "4×",
    2: "2×",
    0.5: "½×",
    0: "0×",
};

const cellClass = (multiplier: number) => {
    switch (multiplier) {
        case 2:
            return "bg-[color-mix(in_srgb,var(--color-grass)_45%,var(--color-surface))] font-bold";
        case 0.5:
            return "bg-[color-mix(in_srgb,var(--color-fighting)_30%,var(--color-surface))]";
        case 0:
            return "bg-ink text-paper font-bold";
        default:
            return "";
    }
};

const TypeChip = ({ type }: { type: PokemonType }) => (
    <span className={typePillClass}>
        <span className={`${typeDotClass} ${typeColors[type]}`} />
        {type}
    </span>
);

const Summary = ({
    attacker,
    defender,
    efficacy,
}: {
    attacker: PokemonType | null;
    defender: PokemonType | null;
    efficacy: TypeEfficacy;
}) => (
    <div aria-live="polite" className="flex flex-col gap-4">
        {!attacker && !defender && (
            <p className="text-sm text-muted">
                Select a row or column header to see what a type hits and what
                it takes.
            </p>
        )}
        {attacker && (
            <div className="flex flex-col gap-2">
                <h2 className="text-[13px] font-bold tracking-wider text-muted uppercase">
                    <span className="capitalize">{attacker}</span> attacking
                </h2>
                {getOffense(attacker, efficacy).map(
                    ({ multiplier, label, types }) => (
                        <div
                            key={multiplier}
                            className="flex flex-wrap items-center gap-1.5"
                        >
                            <span className="w-9 font-mono text-sm font-bold">
                                {label}
                            </span>
                            {types.length > 0 ? (
                                types.map((type) => (
                                    <TypeChip key={type} type={type} />
                                ))
                            ) : (
                                <span className="text-sm text-muted">None</span>
                            )}
                        </div>
                    )
                )}
            </div>
        )}
        {defender && (
            <div className="flex flex-col gap-2">
                <h2 className="text-[13px] font-bold tracking-wider text-muted uppercase">
                    <span className="capitalize">{defender}</span> defending
                </h2>
                {getTypeMatchups([defender], efficacy).map(
                    ({ multiplier, label, types }) => (
                        <div
                            key={multiplier}
                            className="flex flex-wrap items-center gap-1.5"
                        >
                            <span className="w-9 font-mono text-sm font-bold">
                                {label}
                            </span>
                            {types.map((type) => (
                                <TypeChip key={type} type={type} />
                            ))}
                        </div>
                    )
                )}
            </div>
        )}
    </div>
);

const HeaderButton = ({
    type,
    isSelected,
    onPress,
    label,
    children,
}: {
    type: PokemonType;
    isSelected: boolean;
    onPress: () => void;
    label: string;
    children: React.ReactNode;
}) => (
    <button
        type="button"
        aria-pressed={isSelected}
        aria-label={`${label} ${type}`}
        onClick={onPress}
        className={`flex h-9 w-full cursor-pointer items-center gap-1.5 rounded-lg px-1.5 text-xs font-bold uppercase focus-visible:-outline-offset-2 ${
            isSelected ? "bg-chip-hover text-ink" : "hover:bg-chip"
        }`}
    >
        <span className={`${typeDotClass} ${typeColors[type]}`} />
        {children}
    </button>
);

const TypeChart: React.FC = () => {
    preconnect("https://beta.pokeapi.co");

    const { data: efficacy, isError } = useQuery(typeEfficacyQueryOptions);
    const [attacker, setAttacker] = useState<PokemonType | null>(null);
    const [defender, setDefender] = useState<PokemonType | null>(null);

    return (
        <div className="pokedex-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="flex flex-col gap-2 border-b border-line px-4 pt-6 pb-5 lg:px-8">
                <h1 className="font-display text-[34px] leading-tight font-bold tracking-tight">
                    Type chart
                </h1>
                <p className="text-[15px] text-muted">
                    Rows attack, columns defend. Empty cells are neutral (1×).
                </p>
            </div>

            <div className="flex flex-col gap-6 px-4 py-7 lg:px-8">
                {!efficacy ? (
                    <p className="text-[15px] text-muted">
                        {isError
                            ? "Couldn’t load the type chart. Please try again."
                            : "Loading…"}
                    </p>
                ) : (
                    <>
                        <div className="pokedex-scroll overflow-auto rounded-2xl border border-line bg-surface">
                            <table className="border-separate border-spacing-0 text-center">
                                <caption className="sr-only">
                                    Damage multiplier of each attacking type
                                    (rows) against each defending type (columns)
                                </caption>
                                <thead>
                                    <tr>
                                        <th className="sticky top-0 left-0 z-20 bg-surface" />
                                        {TYPE_ORDER.map((type) => (
                                            <th
                                                key={type}
                                                scope="col"
                                                className="sticky top-0 z-10 min-w-12 bg-surface p-0.5"
                                            >
                                                <HeaderButton
                                                    type={type}
                                                    label="Defending"
                                                    isSelected={
                                                        defender === type
                                                    }
                                                    onPress={() =>
                                                        setDefender(
                                                            defender === type
                                                                ? null
                                                                : type
                                                        )
                                                    }
                                                >
                                                    {type.slice(0, 3)}
                                                </HeaderButton>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {TYPE_ORDER.map((row) => (
                                        <tr key={row}>
                                            <th
                                                scope="row"
                                                className="sticky left-0 z-10 min-w-28 bg-surface p-0.5 text-left"
                                            >
                                                <HeaderButton
                                                    type={row}
                                                    label="Attacking"
                                                    isSelected={
                                                        attacker === row
                                                    }
                                                    onPress={() =>
                                                        setAttacker(
                                                            attacker === row
                                                                ? null
                                                                : row
                                                        )
                                                    }
                                                >
                                                    {row}
                                                </HeaderButton>
                                            </th>
                                            {TYPE_ORDER.map((column) => {
                                                const multiplier =
                                                    efficacy[row]?.[column] ??
                                                    1;
                                                const isHighlighted =
                                                    attacker === row ||
                                                    defender === column;

                                                return (
                                                    <td
                                                        key={column}
                                                        className={`h-9 border border-line/60 text-sm ${cellClass(multiplier)} ${
                                                            isHighlighted
                                                                ? "outline-2 -outline-offset-2 outline-accent/60"
                                                                : ""
                                                        }`}
                                                    >
                                                        {CELL_LABELS[
                                                            multiplier
                                                        ] ?? (
                                                            <span className="sr-only">
                                                                1×
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Summary
                            attacker={attacker}
                            defender={defender}
                            efficacy={efficacy}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default TypeChart;
