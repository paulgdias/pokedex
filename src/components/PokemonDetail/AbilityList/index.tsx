import { PokemonInfo } from "@customTypes/PokemonTypes";
import { formatName } from "@utils/stats";

const AbilityList = ({
    abilities,
}: {
    abilities: PokemonInfo["abilities"];
}) => (
    <ul className="flex flex-col gap-3">
        {abilities.map(({ name, isHidden, effect }) => (
            <li key={name} className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 font-semibold">
                    {formatName(name)}
                    {isHidden && (
                        <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-bold tracking-wide text-pill-text uppercase">
                            Hidden
                        </span>
                    )}
                </span>
                {effect && <span className="text-sm text-muted">{effect}</span>}
            </li>
        ))}
    </ul>
);

export default AbilityList;
