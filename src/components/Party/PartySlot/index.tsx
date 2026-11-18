import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";

import Button from "@components/Buttons/Button";
import Panel from "@components/Panel";
import SectionLabel from "@components/SectionLabel";
import { PokemonDetails, typeColors } from "@customTypes/PokemonTypes";
import { typeDotClass, typePillClass } from "@styles/Pokedex";
import { formatPokedexNumber } from "@utils/search";

import SlotPicker from "../SlotPicker";

/**
 * One of the six party slots: a search box when empty, or the chosen
 * Pokémon's sprite, name and types with a remove button.
 */
const PartySlot = ({
    index,
    pokemon,
    allPokemon,
    selectedIds,
    onSet,
}: {
    index: number;
    pokemon: PokemonDetails | null;
    allPokemon: PokemonDetails[];
    selectedIds: number[];
    onSet: (id: number | null) => void;
}) => (
    <Panel
        className={twMerge(
            "flex h-full min-h-32 flex-col gap-3 p-4",
            !pokemon && "border-dashed border-line-strong bg-surface/60"
        )}
    >
        <div className="flex items-center justify-between gap-2">
            <SectionLabel aria-hidden="true">Slot {index + 1}</SectionLabel>
            {pokemon && (
                <Button
                    variant="ghost"
                    size="sm"
                    icon
                    aria-label={`Remove ${pokemon.name}`}
                    onPress={() => onSet(null)}
                    className="-my-1 -mr-1"
                >
                    <X size={16} aria-hidden="true" />
                </Button>
            )}
        </div>
        {pokemon ? (
            <div className="flex items-center gap-3">
                <img
                    src={pokemon.sprite || undefined}
                    alt=""
                    className="size-16 shrink-0 object-contain"
                />
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-mono text-xs text-subtle">
                        {formatPokedexNumber(pokemon.id)}
                    </span>
                    <span className="truncate font-display text-lg font-bold capitalize">
                        {pokemon.name}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                        {pokemon.types.map((type) => (
                            <span key={type} className={typePillClass}>
                                <span
                                    className={`${typeDotClass} ${typeColors[type as keyof typeof typeColors]}`}
                                />
                                {type}
                            </span>
                        ))}
                    </span>
                </div>
            </div>
        ) : (
            <SlotPicker
                index={index}
                allPokemon={allPokemon}
                excludedIds={selectedIds}
                onSelect={(id) => onSet(id)}
            />
        )}
    </Panel>
);

export default PartySlot;
