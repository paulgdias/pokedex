import { useId } from "react";

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
import { getGeneration } from "@utils/generations";
import { rankReplacements } from "@utils/partyAnalyzer";
import { formatPokedexNumber } from "@utils/search";

/**
 * Suggests swapping the party's weakest offensive contributor for up to three
 * Pokémon of the same generation that would leave the party covering more
 * types. Renders nothing when there is no gap, fewer than two members, or no
 * candidate with a net gain.
 */
const ReplacementSuggestions = ({
    party,
    allPokemon,
    efficacy,
}: {
    /** the six slots, empty ones as null */
    party: (PokemonDetails | null)[];
    allPokemon: PokemonDetails[];
    efficacy: TypeEfficacy;
}) => {
    const headingId = useId();
    const suggestion = rankReplacements(party, allPokemon, efficacy);

    if (!suggestion) {
        return null;
    }

    const { slotIndex, currentPokemon, candidates } = suggestion;
    const region = getGeneration(currentPokemon.generationId)?.region;

    return (
        <section aria-labelledby={headingId} className="flex flex-col gap-4">
            <h2 id={headingId} className={sectionHeadingClass}>
                Suggested replacement
            </h2>
            <p className="text-[15px] text-muted">
                <span className="font-semibold text-ink capitalize">
                    {currentPokemon.name}
                </span>{" "}
                (slot {slotIndex + 1}) adds the least unique coverage. These{" "}
                {region ? `${region} ` : ""}Pokémon in its place would leave
                your party covering more types:
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {candidates.map((candidate) => (
                    <li key={candidate.id}>
                        <Panel className="flex items-center gap-3 p-4">
                            <img
                                src={candidate.sprite || undefined}
                                alt=""
                                className="size-14 shrink-0 object-contain"
                            />
                            <div className="flex min-w-0 flex-col gap-1">
                                <span className="font-mono text-xs text-subtle">
                                    {formatPokedexNumber(candidate.id)}
                                </span>
                                <span className="truncate font-display text-lg font-bold capitalize">
                                    {candidate.name}
                                </span>
                                <span className="flex flex-wrap gap-1.5">
                                    {candidate.types.map((type) => (
                                        <span
                                            key={type}
                                            className={typePillClass}
                                        >
                                            <span
                                                className={`${typeDotClass} ${typeColors[type as keyof typeof typeColors]}`}
                                            />
                                            {type}
                                        </span>
                                    ))}
                                </span>
                            </div>
                        </Panel>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default ReplacementSuggestions;
