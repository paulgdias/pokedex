import { PokemonInfo } from "@customTypes/PokemonTypes";
import {
    formatHeight,
    formatName,
    formatWeight,
    getFemaleShare,
} from "@utils/stats";

const GenderBar = ({ genderRate }: { genderRate: number }) => {
    const female = getFemaleShare(genderRate);

    if (female === null) {
        return <>Genderless</>;
    }

    return (
        <span className="flex flex-col gap-1.5">
            <span className="flex h-2 overflow-hidden rounded-full">
                <span
                    className="bg-fairy"
                    style={{ width: `${female * 100}%` }}
                />
                <span className="flex-1 bg-water" />
            </span>
            <span className="text-sm text-muted">
                {female * 100}% female · {(1 - female) * 100}% male
            </span>
        </span>
    );
};

const InfoFacts = ({ info }: { info: PokemonInfo }) => {
    const rows: [string, React.ReactNode][] = [
        ["Height", formatHeight(info.height)],
        ["Weight", formatWeight(info.weight)],
        ["Base experience", info.baseExperience ?? "—"],
        ["Capture rate", info.captureRate],
        ["Base happiness", info.baseHappiness ?? "—"],
        ["Gender", <GenderBar key="gender" genderRate={info.genderRate} />],
        ["Egg groups", info.eggGroups.map(formatName).join(", ") || "—"],
        ["Growth rate", info.growthRate ? formatName(info.growthRate) : "—"],
        ["Habitat", info.habitat ? formatName(info.habitat) : "—"],
        ["Color", info.color ? formatName(info.color) : "—"],
        ["Shape", info.shape ? formatName(info.shape) : "—"],
    ];

    return (
        <dl className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-2.5 text-sm">
            {rows.map(([label, value]) => (
                <div key={label} className="contents">
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-semibold">{value}</dd>
                </div>
            ))}
        </dl>
    );
};

export default InfoFacts;
