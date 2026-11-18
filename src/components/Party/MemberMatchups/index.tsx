import { useId } from "react";

import Panel from "@components/Panel";
import TypeMatchups from "@components/PokemonDetail/TypeMatchups";
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
import { hasTypeData } from "@utils/partyAnalyzer";
import { getTypeMatchups } from "@utils/stats";

const Member = ({
    pokemon,
    efficacy,
}: {
    pokemon: PokemonDetails;
    efficacy: TypeEfficacy;
}) => {
    const id = useId();

    return (
        <Panel
            as="section"
            aria-labelledby={id}
            className="flex flex-col gap-4 p-5"
        >
            <div className="flex items-center gap-3">
                <img
                    src={pokemon.sprite || undefined}
                    alt=""
                    className="size-14 shrink-0 object-contain"
                />
                <div className="flex min-w-0 flex-col gap-1.5">
                    <h3
                        id={id}
                        className="truncate font-display text-lg font-bold capitalize"
                    >
                        {pokemon.name}
                        <span className="sr-only"> matchups</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {pokemon.types.map((type) => (
                            <span key={type} className={typePillClass}>
                                <span
                                    className={`${typeDotClass} ${typeColors[type as keyof typeof typeColors]}`}
                                />
                                {type}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            {!hasTypeData(pokemon.types, efficacy) ? (
                <p className="text-sm text-muted">Type data unavailable</p>
            ) : getTypeMatchups(pokemon.types, efficacy).length > 0 ? (
                <TypeMatchups types={pokemon.types} efficacy={efficacy} />
            ) : (
                <p className="text-sm text-muted">
                    No weaknesses or resistances
                </p>
            )}
        </Panel>
    );
};

/** One panel per party member with its own defensive matchups. */
const MemberMatchups = ({
    party,
    efficacy,
}: {
    party: PokemonDetails[];
    efficacy: TypeEfficacy;
}) => {
    const headingId = useId();

    if (party.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby={headingId} className="flex flex-col gap-4">
            <h2 id={headingId} className={sectionHeadingClass}>
                Member matchups
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {party.map((pokemon) => (
                    <Member
                        key={pokemon.id}
                        pokemon={pokemon}
                        efficacy={efficacy}
                    />
                ))}
            </div>
        </section>
    );
};

export default MemberMatchups;
