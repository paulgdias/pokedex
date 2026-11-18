import { useId } from "react";
import { twMerge } from "tailwind-merge";

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
import { computeOffensiveCoverage } from "@utils/partyAnalyzer";

// a gap reads as an outline of a pill: no fill, dashed border, muted text
const gapPillClass = twMerge(
    typePillClass,
    "border-[1.5px] border-dashed border-line-strong bg-transparent text-muted"
);

/**
 * Which of the 18 types the party hits super-effectively with its own types,
 * and which are coverage gaps nobody hits for 2×.
 */
const OffensiveCoverage = ({
    party,
    efficacy,
}: {
    party: PokemonDetails[];
    efficacy: TypeEfficacy;
}) => {
    const headingId = useId();
    const entries = computeOffensiveCoverage(party, efficacy);
    const gaps = entries.filter((entry) => !entry.covered);

    return (
        <section aria-labelledby={headingId} className="flex flex-col gap-4">
            <h2 id={headingId} className={sectionHeadingClass}>
                Offensive coverage
            </h2>
            {party.length === 0 ? (
                <p className="text-[15px] text-muted">
                    Add Pokémon to see which types your party hits
                    super-effectively
                </p>
            ) : (
                <Panel className="flex flex-col gap-4 p-5">
                    <p className="text-sm text-muted">
                        {gaps.length === 0
                            ? "Full coverage: your party hits all 18 types super-effectively."
                            : `${gaps.length} coverage ${gaps.length === 1 ? "gap" : "gaps"}: no member hits the dashed types for 2× or more.`}
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                        {entries.map(({ type, covered }) => (
                            <li
                                key={type}
                                data-covered={covered}
                                className={
                                    covered ? typePillClass : gapPillClass
                                }
                            >
                                <span
                                    className={`${typeDotClass} ${typeColors[type]}`}
                                />
                                {type}
                                {!covered && (
                                    <span className="sr-only">
                                        {" "}
                                        Coverage gap
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}
        </section>
    );
};

export default OffensiveCoverage;
