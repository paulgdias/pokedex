import { TypeEfficacy, typeColors } from "@customTypes/PokemonTypes";
import { typeDotClass, typePillClass } from "@styles/Pokedex";
import { getTypeMatchups } from "@utils/stats";

const TypeMatchups = ({
    types,
    efficacy,
}: {
    types: string[];
    efficacy: TypeEfficacy;
}) => {
    const groups = getTypeMatchups(types, efficacy);

    return (
        <dl className="flex flex-col gap-3">
            {groups.map(({ multiplier, label, types: attackers }) => (
                <div
                    key={multiplier}
                    className="grid grid-cols-[2.5rem_1fr] items-start gap-3"
                >
                    <dt className="pt-0.5 font-mono text-sm font-bold">
                        <span className="sr-only">Damage taken: </span>
                        {label}
                    </dt>
                    <dd className="flex flex-wrap gap-1.5">
                        {attackers.map((type) => (
                            <span key={type} className={typePillClass}>
                                <span
                                    className={`${typeDotClass} ${typeColors[type]}`}
                                />
                                {type}
                            </span>
                        ))}
                    </dd>
                </div>
            ))}
        </dl>
    );
};

export default TypeMatchups;
