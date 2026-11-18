import { ChevronDown, X } from "lucide-react";
import { useId } from "react";
import {
    ListBox,
    ListBoxItem,
    Popover,
    Select,
    SelectValue,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";

import Button from "@components/Buttons/Button";
import Panel from "@components/Panel";
import {
    PokemonDetails,
    TypeEfficacy,
    typeColors,
} from "@customTypes/PokemonTypes";
import {
    sectionHeadingClass,
    typeDotClass,
    typePillClass,
} from "@styles/Pokedex";
import { computeThreatGrid, PartyType } from "@utils/partyAnalyzer";
import { describeMatchup, TYPE_ORDER } from "@utils/stats";

const MAX_THREATS = 3;

const MULTIPLIER_LABELS: Record<number, string> = {
    0: "0×",
    0.25: "¼×",
    0.5: "½×",
    1: "1×",
    2: "2×",
    4: "4×",
};

/** Cell fill from the defender's point of view: red is bad, green is good. */
const cellClass = (multiplier: number) => {
    if (multiplier >= 4) {
        return "bg-[color-mix(in_srgb,var(--color-fighting)_45%,var(--color-surface))] font-bold";
    }
    if (multiplier >= 2) {
        return "bg-[color-mix(in_srgb,var(--color-fighting)_25%,var(--color-surface))] font-bold";
    }
    if (multiplier === 0) {
        return "bg-ink text-paper font-bold";
    }
    if (multiplier <= 0.25) {
        return "bg-[color-mix(in_srgb,var(--color-grass)_45%,var(--color-surface))] font-bold";
    }
    if (multiplier < 1) {
        return "bg-[color-mix(in_srgb,var(--color-grass)_25%,var(--color-surface))]";
    }
    return "text-muted";
};

const dotClass = (type: string) =>
    `${typeDotClass} ${typeColors[type as PartyType]}`;

/**
 * A select of the types not yet added. A select rather than a combobox: with
 * only 18 fixed options there is nothing to search, and it closes after each
 * pick instead of reopening over the grid.
 */
const ThreatPicker = ({
    threats,
    onAddThreat,
}: {
    threats: string[];
    onAddThreat: (type: string) => void;
}) => {
    const options = TYPE_ORDER.filter((type) => !threats.includes(type)).map(
        (type) => ({ id: type })
    );
    const isFull = threats.length >= MAX_THREATS;

    return (
        <Select
            aria-label="Add a threat type"
            placeholder={isFull ? "Up to three threat types" : "Pick a type"}
            selectedKey={null}
            onSelectionChange={(key) => {
                if (key !== null) {
                    onAddThreat(String(key));
                }
            }}
            isDisabled={isFull}
            className="w-full max-w-xs"
        >
            <Button className="h-11 w-full justify-between rounded-[14px] px-4 text-[15px] font-normal">
                <SelectValue className="truncate text-muted" />
                <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-muted"
                />
            </Button>
            <Popover className="w-(--trigger-width) rounded-[14px] border border-line-strong bg-surface p-2 shadow-popover">
                <ListBox
                    items={options}
                    className="max-h-72 overflow-y-auto outline-none"
                >
                    {(item) => (
                        <ListBoxItem
                            id={item.id}
                            textValue={item.id}
                            className="flex cursor-pointer items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-sm font-semibold capitalize outline-none data-[focused]:bg-chip"
                        >
                            <span className={dotClass(item.id)} />
                            {item.id}
                        </ListBoxItem>
                    )}
                </ListBox>
            </Popover>
        </Select>
    );
};

const ThreatGrid = ({
    party,
    threats,
    efficacy,
}: {
    party: PokemonDetails[];
    threats: string[];
    efficacy: TypeEfficacy;
}) => (
    <Panel className="overflow-x-auto">
        <table className="w-full border-collapse">
            <caption className="sr-only">
                Damage each party member takes from {threats.join(", ")}
            </caption>
            <thead>
                <tr className="border-b border-line">
                    <th
                        scope="col"
                        className="px-4 py-3 text-left text-sm font-normal text-muted"
                    >
                        Pokémon
                    </th>
                    {threats.map((threat) => (
                        <th
                            key={threat}
                            scope="col"
                            className="px-4 py-3 text-center text-xs font-bold uppercase"
                        >
                            <span className="inline-flex items-center gap-1.5">
                                <span className={dotClass(threat)} />
                                {threat}
                            </span>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-line">
                {computeThreatGrid(party, threats, efficacy).map(
                    ({ pokemon, multipliers }) => (
                        <tr key={pokemon.id}>
                            <th scope="row" className="px-4 py-2 text-left">
                                <span className="flex items-center gap-2.5">
                                    <img
                                        src={pokemon.sprite || undefined}
                                        alt=""
                                        className="size-9 shrink-0 object-contain"
                                    />
                                    <span className="font-semibold capitalize">
                                        {pokemon.name}
                                    </span>
                                </span>
                            </th>
                            {threats.map((threat) => {
                                const multiplier = multipliers[threat];
                                return (
                                    <td
                                        key={threat}
                                        data-multiplier={multiplier}
                                        className={twMerge(
                                            "px-4 py-2 text-center font-mono text-sm",
                                            cellClass(multiplier)
                                        )}
                                    >
                                        <span aria-hidden="true">
                                            {MULTIPLIER_LABELS[multiplier] ??
                                                `${multiplier}×`}
                                        </span>
                                        <span className="sr-only">
                                            {describeMatchup(
                                                threat,
                                                pokemon.name,
                                                multiplier
                                            )}
                                        </span>
                                    </td>
                                );
                            })}
                        </tr>
                    )
                )}
            </tbody>
        </table>
    </Panel>
);

/**
 * Up to three opponent types and a grid of how much damage each party member
 * takes from each of them.
 */
const ThreatAnalysis = ({
    party,
    threats,
    efficacy,
    onAddThreat,
    onRemoveThreat,
}: {
    party: PokemonDetails[];
    threats: string[];
    efficacy: TypeEfficacy;
    onAddThreat: (type: string) => void;
    onRemoveThreat: (type: string) => void;
}) => {
    const headingId = useId();

    const prompt =
        party.length === 0 && threats.length === 0
            ? "Pick up to three opponent types to see how much damage each party member takes from them."
            : party.length === 0
              ? "Add Pokémon to your party to see how they fare against these types."
              : threats.length === 0
                ? "Add a threat type to see how each member fares against it."
                : null;

    return (
        <section aria-labelledby={headingId} className="flex flex-col gap-4">
            <h2 id={headingId} className={sectionHeadingClass}>
                Threat analysis
            </h2>
            <div className="flex flex-wrap items-center gap-3">
                <ThreatPicker threats={threats} onAddThreat={onAddThreat} />
                {threats.length > 0 && (
                    <ul aria-label="Threat types" className="flex gap-2">
                        {threats.map((threat) => (
                            <li
                                key={threat}
                                className={twMerge(typePillClass, "h-8 pr-1")}
                            >
                                <span className={dotClass(threat)} />
                                {threat}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon
                                    aria-label={`Remove ${threat} threat`}
                                    onPress={() => onRemoveThreat(threat)}
                                    className="size-6 rounded-full"
                                >
                                    <X size={14} aria-hidden="true" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {prompt ? (
                <p className="text-[15px] text-muted">{prompt}</p>
            ) : (
                <ThreatGrid
                    party={party}
                    threats={threats}
                    efficacy={efficacy}
                />
            )}
        </section>
    );
};

export default ThreatAnalysis;
