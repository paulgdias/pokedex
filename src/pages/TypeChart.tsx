import { useEffect, useRef, useState } from "react";
import { preconnect } from "react-dom";

import { useQuery } from "@tanstack/react-query";
import {
    Button,
    Dialog,
    DialogTrigger,
    Popover,
    Tooltip,
    TooltipTrigger,
} from "react-aria-components";

import { TypeEfficacy, typeColors } from "@customTypes/PokemonTypes";

import { typeEfficacyQueryOptions } from "@api/pokedex";

import {
    TYPE_ORDER,
    describeMatchup,
    formatName,
    getOffense,
    getTypeMatchups,
} from "@utils/stats";

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

const GroupRow = ({
    label,
    types,
}: {
    label: string;
    types: PokemonType[];
}) => (
    <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-9 font-mono text-sm font-bold">{label}</span>
        {types.length > 0 ? (
            types.map((type) => <TypeChip key={type} type={type} />)
        ) : (
            <span className="text-sm text-muted">None</span>
        )}
    </div>
);

const OffenseDetails = ({
    type,
    efficacy,
}: {
    type: PokemonType;
    efficacy: TypeEfficacy;
}) => (
    <div className="flex flex-col gap-2">
        <div className="text-[13px] font-bold tracking-wider text-muted uppercase">
            <span className="capitalize">{type}</span> attacking
        </div>
        {getOffense(type, efficacy).map(({ multiplier, label, types }) => (
            <GroupRow key={multiplier} label={label} types={types} />
        ))}
    </div>
);

const DefenseDetails = ({
    type,
    efficacy,
}: {
    type: PokemonType;
    efficacy: TypeEfficacy;
}) => (
    <div className="flex flex-col gap-2">
        <div className="text-[13px] font-bold tracking-wider text-muted uppercase">
            <span className="capitalize">{type}</span> defending
        </div>
        {getTypeMatchups([type], efficacy).map(
            ({ multiplier, label, types }) => (
                <GroupRow
                    key={multiplier}
                    label={label}
                    types={types as PokemonType[]}
                />
            )
        )}
    </div>
);

const surfaceClass =
    "max-w-sm rounded-xl border border-line-strong bg-surface p-3 text-ink shadow-popover outline-none";

/** Whether the primary input can hover; tooltips need it, touch needs a tap. */
const useCanHover = () => {
    const [canHover, setCanHover] = useState(
        () => window.matchMedia?.("(hover: hover)").matches ?? true
    );

    useEffect(() => {
        const query = window.matchMedia?.("(hover: hover)");
        if (!query) {
            return;
        }
        const update = () => setCanHover(query.matches);
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);

    return canHover;
};

/**
 * A row (attacker) or column (defender) header. Mouse and keyboard get a
 * tooltip; touch gets the same content in a popover opened by a tap.
 */
const TypeHeader = ({
    type,
    role,
    efficacy,
    canHover,
    children,
}: {
    type: PokemonType;
    role: "attacker" | "defender";
    efficacy: TypeEfficacy;
    canHover: boolean;
    children: React.ReactNode;
}) => {
    const label = role === "attacker" ? "Attacking" : "Defending";
    const button = (
        <Button
            aria-label={`${label} ${type}`}
            className="flex h-9 w-full cursor-pointer items-center gap-1.5 rounded-lg px-1.5 text-xs font-bold uppercase hover:bg-chip focus-visible:-outline-offset-2"
        >
            <span className={`${typeDotClass} ${typeColors[type]}`} />
            {children}
        </Button>
    );
    const details =
        role === "attacker" ? (
            <OffenseDetails type={type} efficacy={efficacy} />
        ) : (
            <DefenseDetails type={type} efficacy={efficacy} />
        );

    if (!canHover) {
        return (
            <DialogTrigger>
                {button}
                <Popover placement="bottom" offset={6}>
                    <Dialog
                        aria-label={`${label} ${type}`}
                        className={surfaceClass}
                    >
                        {details}
                    </Dialog>
                </Popover>
            </DialogTrigger>
        );
    }

    return (
        <TooltipTrigger delay={150} closeDelay={100}>
            {button}
            <Tooltip placement="bottom" offset={6} className={surfaceClass}>
                {details}
            </Tooltip>
        </TooltipTrigger>
    );
};

const TypeChart: React.FC = () => {
    preconnect("https://beta.pokeapi.co");

    const { data: efficacy, isError } = useQuery(typeEfficacyQueryOptions);
    const canHover = useCanHover();
    // one tooltip for all 324 cells, anchored to the hovered one
    const [cell, setCell] = useState<{
        element: HTMLElement;
        attacker: PokemonType;
        defender: PokemonType;
    } | null>(null);
    const cellRef = useRef<HTMLElement | null>(null);
    cellRef.current = cell?.element ?? null;

    const handleCellHover = (event: React.PointerEvent<HTMLTableElement>) => {
        if (event.pointerType !== "mouse") {
            return;
        }
        const element = (event.target as HTMLElement).closest<HTMLElement>(
            "td[data-attacker]"
        );
        if (!element) {
            setCell(null);
            return;
        }
        const attacker = element.dataset.attacker as PokemonType;
        const defender = element.dataset.defender as PokemonType;
        setCell({ element, attacker, defender });
    };

    const clearCellHover = () => setCell(null);

    return (
        <div className="pokedex-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="flex flex-col gap-2 border-b border-line px-4 pt-6 pb-5 lg:px-8">
                <h1 className="font-display text-[34px] leading-tight font-bold tracking-tight">
                    Type chart
                </h1>
                <p className="text-[15px] text-muted">
                    Rows attack, columns defend. Empty cells are neutral (1×).{" "}
                    {canHover
                        ? "Hover or focus a type for details."
                        : "Tap a type for details."}
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
                    <div className="pokedex-scroll overflow-auto rounded-2xl border border-line bg-surface">
                        <table
                            onPointerOver={handleCellHover}
                            onPointerLeave={clearCellHover}
                            className="w-full min-w-[60rem] border-separate border-spacing-0 text-center"
                        >
                            <caption className="sr-only">
                                Damage multiplier of each attacking type (rows)
                                against each defending type (columns)
                            </caption>
                            <thead>
                                <tr>
                                    <th className="sticky top-0 left-0 z-20 bg-surface" />
                                    {TYPE_ORDER.map((type) => (
                                        <th
                                            key={type}
                                            scope="col"
                                            className="sticky top-0 z-10 min-w-14 bg-surface p-0.5"
                                        >
                                            <TypeHeader
                                                type={type}
                                                role="defender"
                                                efficacy={efficacy}
                                                canHover={canHover}
                                            >
                                                {type.slice(0, 3)}
                                            </TypeHeader>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {TYPE_ORDER.map((row) => (
                                    <tr key={row}>
                                        <th
                                            scope="row"
                                            className="sticky left-0 z-10 w-32 min-w-32 bg-surface p-0.5 text-left"
                                        >
                                            <TypeHeader
                                                type={row}
                                                role="attacker"
                                                efficacy={efficacy}
                                                canHover={canHover}
                                            >
                                                {row}
                                            </TypeHeader>
                                        </th>
                                        {TYPE_ORDER.map((column) => {
                                            const multiplier =
                                                efficacy[row]?.[column] ?? 1;
                                            const isHighlighted =
                                                cell?.attacker === row &&
                                                cell.defender === column;

                                            return (
                                                <td
                                                    key={column}
                                                    data-attacker={row}
                                                    data-defender={column}
                                                    className={`h-9 border border-line/60 text-sm ${cellClass(multiplier)} ${
                                                        isHighlighted
                                                            ? "outline-2 -outline-offset-2 outline-accent"
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
                )}
            </div>
            {efficacy && cell && (
                // a standalone Tooltip needs a TooltipTrigger, so the shared cell
                // tip is a non-modal popover; it is visual only (the header
                // tooltips and the sr-only multipliers carry the same info)
                <Popover
                    isOpen
                    isNonModal
                    triggerRef={cellRef}
                    placement="top"
                    offset={6}
                    aria-hidden="true"
                    className="pointer-events-none rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-sm font-semibold text-ink shadow-popover"
                >
                    {describeMatchup(
                        cell.attacker,
                        cell.defender,
                        efficacy[cell.attacker]?.[cell.defender] ?? 1
                    )}
                </Popover>
            )}
        </div>
    );
};

export default TypeChart;
