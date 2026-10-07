import { useState } from "react";

import { PokemonInfo } from "@customTypes/PokemonTypes";
import { formatFlavorText, formatName } from "@utils/stats";

const PokedexEntry = ({ info }: { info: PokemonInfo }) => {
    const [index, setIndex] = useState(0);
    const { flavorTexts } = info;
    const entry = flavorTexts[index];

    return (
        <div className="flex flex-col gap-3">
            {info.genus && (
                <p className="font-display text-lg font-bold">{info.genus}</p>
            )}
            {entry ? (
                <>
                    <p className="text-[15px] leading-relaxed">
                        {formatFlavorText(entry.text)}
                    </p>
                    <label className="flex items-center gap-2 text-sm text-muted">
                        Game
                        <select
                            value={index}
                            onChange={(event) =>
                                setIndex(Number(event.target.value))
                            }
                            className="h-9 rounded-lg border border-line-strong bg-surface px-2 text-sm font-semibold text-ink"
                        >
                            {flavorTexts.map(({ version }, position) => (
                                <option key={version} value={position}>
                                    {formatName(version)}
                                </option>
                            ))}
                        </select>
                    </label>
                </>
            ) : (
                <p className="text-sm text-muted">No entry available.</p>
            )}
        </div>
    );
};

export default PokedexEntry;
