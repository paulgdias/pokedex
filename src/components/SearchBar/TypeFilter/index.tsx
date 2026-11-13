import { ChevronDown, ListFilter } from "lucide-react";
import {
    Dialog,
    DialogTrigger,
    Popover,
    ToggleButton,
} from "react-aria-components";

import Button from "@components/Buttons/Button";
import { typeColors } from "@customTypes/PokemonTypes";
import { typeDotClass } from "@styles/Pokedex";
import { capitalize, POKEMON_TYPES, PokemonType } from "@utils/search";

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
            <Button variant="field" size="lg" className="px-4">
                <ListFilter size={16} aria-hidden="true" />
                Type
                {types.length > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-xs text-paper">
                        {types.length}
                    </span>
                )}
                <ChevronDown size={14} aria-hidden="true" />
            </Button>
            <Popover
                placement="bottom start"
                offset={8}
                className="w-[460px] max-w-[calc(100vw-2rem)] rounded-[14px] border border-line-strong bg-surface p-4 shadow-popover"
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
                                <Button
                                    variant="link"
                                    size="sm"
                                    onPress={() => onChange([])}
                                >
                                    Reset
                                </Button>
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
                            <Button variant="primary" size="lg" onPress={close}>
                                Show {resultCount} results
                            </Button>
                        </>
                    )}
                </Dialog>
            </Popover>
        </DialogTrigger>
    );
};

export default TypeFilter;
