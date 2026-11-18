import { useMemo, useState } from "react";
import {
    ComboBox,
    Input,
    ListBox,
    ListBoxItem,
    Popover,
} from "react-aria-components";

import { PokemonDetails } from "@customTypes/PokemonTypes";
import { formatPokedexNumber, getPokemonSuggestions } from "@utils/search";

/**
 * The search box of an empty party slot: type a name or dex number and pick
 * from up to eight matches. Pokémon already in the party are left out.
 */
const SlotPicker = ({
    index,
    allPokemon,
    excludedIds,
    onSelect,
}: {
    index: number;
    allPokemon: PokemonDetails[];
    excludedIds: number[];
    onSelect: (id: number) => void;
}) => {
    const [text, setText] = useState("");
    const suggestions = useMemo(
        () =>
            getPokemonSuggestions(
                allPokemon.filter((item) => !excludedIds.includes(item.id)),
                text,
                8
            ),
        [allPokemon, text, excludedIds]
    );

    return (
        <ComboBox
            aria-label={`Slot ${index + 1} Pokémon`}
            items={suggestions}
            inputValue={text}
            onInputChange={setText}
            selectedKey={null}
            onSelectionChange={(key) => {
                if (key !== null) {
                    onSelect(Number(key));
                    setText("");
                }
            }}
            allowsEmptyCollection
            className="relative w-full"
        >
            <Input
                placeholder="Name or number"
                className="h-11 w-full rounded-[14px] border-[1.5px] border-line-strong bg-surface px-4 text-[15px] placeholder:text-subtle focus:border-accent"
            />
            <Popover className="w-(--trigger-width) min-w-64 rounded-[14px] border border-line-strong bg-surface p-2 shadow-popover">
                <ListBox
                    className="max-h-72 overflow-y-auto outline-none"
                    renderEmptyState={() => (
                        <div className="px-3 py-2 text-sm text-muted">
                            {text.trim()
                                ? "No matches"
                                : "Start typing a name or number"}
                        </div>
                    )}
                >
                    {(item: PokemonDetails) => (
                        <ListBoxItem
                            id={item.id}
                            textValue={item.name}
                            className="flex cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-1.5 outline-none data-[focused]:bg-chip"
                        >
                            <img
                                src={item.sprite || undefined}
                                alt=""
                                className="size-8 object-contain"
                            />
                            <span className="w-11 font-mono text-xs text-subtle">
                                {formatPokedexNumber(item.id)}
                            </span>
                            <span className="font-semibold capitalize">
                                {item.name}
                            </span>
                        </ListBoxItem>
                    )}
                </ListBox>
            </Popover>
        </ComboBox>
    );
};

export default SlotPicker;
