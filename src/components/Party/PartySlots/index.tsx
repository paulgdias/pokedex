import { PokemonDetails } from "@customTypes/PokemonTypes";

import PartySlot from "../PartySlot";

/**
 * The party: six slots in a grid, two columns on small screens and three from
 * `md` up. `onSet(index, id)` fills a slot, `onSet(index, null)` clears it.
 */
const PartySlots = ({
    party,
    allPokemon,
    onSet,
}: {
    party: (PokemonDetails | null)[];
    allPokemon: PokemonDetails[];
    onSet: (index: number, id: number | null) => void;
}) => {
    const selectedIds = party
        .filter((pokemon): pokemon is PokemonDetails => pokemon !== null)
        .map((pokemon) => pokemon.id);

    return (
        <ul
            aria-label="Party"
            className="grid grid-cols-2 gap-4 md:grid-cols-3"
        >
            {party.map((pokemon, index) => (
                // a slot is its position
                <li key={index}>
                    <PartySlot
                        index={index}
                        pokemon={pokemon}
                        allPokemon={allPokemon}
                        selectedIds={selectedIds}
                        onSet={(id) => onSet(index, id)}
                    />
                </li>
            ))}
        </ul>
    );
};

export default PartySlots;
