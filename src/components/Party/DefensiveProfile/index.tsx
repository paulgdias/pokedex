import { useId } from "react";

import Panel from "@components/Panel";
import SectionLabel from "@components/SectionLabel";
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
import {
    computeDefensiveProfile,
    DefensiveBand,
    DefensiveProfileEntry,
    hasTypeData,
} from "@utils/partyAnalyzer";

const BANDS: { band: DefensiveBand; label: string; hint: string }[] = [
    {
        band: "immune",
        label: "Immune",
        hint: "Nobody is weak and someone takes no damage",
    },
    {
        band: "resistant",
        label: "Resistant",
        hint: "Nobody is weak or immune; someone resists",
    },
    { band: "neutral", label: "Neutral", hint: "Every member takes 1×" },
    {
        band: "weak",
        label: "Weak",
        hint: "Members taking 2× or more",
    },
];

const Band = ({
    label,
    hint,
    entries,
}: {
    label: string;
    hint: string;
    entries: DefensiveProfileEntry[];
}) => {
    const id = useId();

    return (
        <Panel
            as="section"
            aria-labelledby={id}
            className="flex flex-col gap-3 p-5"
        >
            <div className="flex flex-col gap-0.5">
                <SectionLabel as="h3" id={id}>
                    {label}
                </SectionLabel>
                <p className="text-xs text-muted">{hint}</p>
            </div>
            {entries.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                    {entries.map(({ type, band, weakCount }) => (
                        <li key={type} className={typePillClass}>
                            <span
                                className={`${typeDotClass} ${typeColors[type]}`}
                            />
                            {type}
                            {band === "weak" && (
                                <>
                                    <span
                                        aria-hidden="true"
                                        className="-mr-1 ml-0.5 flex size-4 items-center justify-center rounded-full bg-ink font-mono text-[10px] text-paper"
                                    >
                                        {weakCount}
                                    </span>
                                    <span className="sr-only">
                                        {` ${weakCount} ${weakCount === 1 ? "member" : "members"} weak to ${type}`}
                                    </span>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted">No types in this band</p>
            )}
        </Panel>
    );
};

/**
 * The party's combined defence: every attacking type sorted into Immune,
 * Resistant, Neutral or Weak, with how many members a weakness hits.
 */
const DefensiveProfile = ({
    party,
    efficacy,
}: {
    party: PokemonDetails[];
    efficacy: TypeEfficacy;
}) => {
    const headingId = useId();
    // a member whose types the chart does not know would read as all 1×
    const unavailable = party.filter(
        (member) => !hasTypeData(member.types, efficacy)
    );
    const known = party.filter((member) => !unavailable.includes(member));
    const entries = known.length
        ? computeDefensiveProfile(known, efficacy)
        : [];

    return (
        <section aria-labelledby={headingId} className="flex flex-col gap-4">
            <h2 id={headingId} className={sectionHeadingClass}>
                Defensive profile
            </h2>
            {party.length === 0 ? (
                <p className="text-[15px] text-muted">
                    Add Pokémon to see the defensive profile
                </p>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        {BANDS.map(({ band, label, hint }) => (
                            <Band
                                key={band}
                                label={label}
                                hint={hint}
                                entries={entries.filter(
                                    (entry) => entry.band === band
                                )}
                            />
                        ))}
                    </div>
                    {unavailable.map((member) => (
                        <p key={member.id} className="text-sm text-muted">
                            Type data unavailable for{" "}
                            <span className="capitalize">{member.name}</span>
                        </p>
                    ))}
                </>
            )}
        </section>
    );
};

export default DefensiveProfile;
