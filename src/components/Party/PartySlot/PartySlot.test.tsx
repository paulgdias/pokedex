import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { PokemonDetails } from "@customTypes/PokemonTypes";

import { bulbasaur, DEX } from "../../__fixtures__/pokemon";
import PartySlot from ".";

const setup = async (
    pokemon: PokemonDetails | null,
    selectedIds: number[] = []
) => {
    const onSet = vi.fn();
    const screen = await render(
        <PartySlot
            index={0}
            pokemon={pokemon}
            allPokemon={DEX}
            selectedIds={selectedIds}
            onSet={onSet}
        />
    );
    return { screen, onSet };
};

describe("PartySlot", () => {
    // the filled and empty looks are covered by the stories
    it("fills the slot with the picked Pokémon", async () => {
        const { screen, onSet } = await setup(null);
        await screen.getByRole("combobox").fill("char");
        await screen.getByRole("option", { name: /charmander/ }).click();
        expect(onSet).toHaveBeenCalledWith(4);
    });

    it("does not offer Pokémon already in the party", async () => {
        const { screen } = await setup(null, [1]);
        await screen.getByRole("combobox").fill("saur");
        // wait for the list before checking what it leaves out
        await expect
            .element(screen.getByRole("option", { name: /ivysaur/ }))
            .toBeVisible();
        expect(
            screen.getByRole("option", { name: /bulbasaur/ }).query()
        ).toBeNull();
    });

    it("clears the slot from its remove button", async () => {
        const { screen, onSet } = await setup(bulbasaur);
        await screen.getByRole("button", { name: "Remove bulbasaur" }).click();
        expect(onSet).toHaveBeenCalledWith(null);
    });
});
