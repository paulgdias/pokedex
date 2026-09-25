import { ChevronDown, ListFilter } from "lucide-react";
import {
    Button,
    Dialog,
    DialogTrigger,
    Popover,
    ToggleButton,
} from "react-aria-components";

import { typeColors } from "@customTypes/PokemonTypes";

import { POKEMON_TYPES, PokemonType, capitalize } from "@utils/search";

import { typeDotClass } from "@styles/Pokedex";

const TypeFilter = ({
    types,
    resultCount,
    onChange,
}: {
    types: PokemonType[];
    resultCount: number;
    onChange: (types: PokemonType[]) => void;
}) => {
    const toggle = (type: PokemonType) =>
        onChange(
            types.includes(type)
                ? types.filter((selected) => selected !== type)
                : [...types, type]
        );

    return (
        <DialogTrigger>
            <Button className="flex h-10 items-center gap-2 rounded-[10px] border-[1.5px] border-line-strong bg-surface px-3.5 text-sm font-semibold text-ink">
                <ListFilter size={16} aria-hidden="true" />
                Type
                {types.length > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-xs text-white">
                        {types.length}
                    </span>
                )}
                <ChevronDown size={14} aria-hidden="true" />
            </Button>
            <Popover
                placement="bottom start"
                offset={8}
                className="w-[460px] max-w-[calc(100vw-2rem)] rounded-[14px] border border-line-strong bg-surface p-4 shadow-[0_18px_40px_rgba(40,32,20,.16)]"
            >
                <Dialog
                    aria-label="Filter by type"
                    className="flex flex-col gap-3.5 outline-none"
                >
                    {({ close }) => (
                        <>
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-bold">
                                    Match any selected type
                                </span>
                                <button
                                    type="button"
                                    className="p-1.5 text-[13px] font-semibold text-accent hover:text-accent-strong"
                                    onClick={() => onChange([])}
                                >
                                    Reset
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {POKEMON_TYPES.map((type) => (
                                    <ToggleButton
                                        key={type}
                                        isSelected={types.includes(type)}
                                        onChange={() => toggle(type)}
                                        className={({ isSelected }) =>
                                            `flex h-10 cursor-pointer items-center gap-2 rounded-[10px] px-3 text-sm font-semibold text-ink ${
                                                isSelected
                                                    ? "border-[1.5px] border-ink bg-chip"
                                                    : "border-[1.5px] border-line bg-surface"
                                            }`
                                        }
                                    >
                                        <span
                                            className={`${typeDotClass} size-2.5 ${typeColors[type]}`}
                                        />
                                        {capitalize(type)}
                                    </ToggleButton>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="h-11 rounded-[10px] bg-ink text-sm font-semibold text-white"
                                onClick={close}
                            >
                                Show {resultCount} results
                            </button>
                        </>
                    )}
                </Dialog>
            </Popover>
        </DialogTrigger>
    );
};

export default TypeFilter;
