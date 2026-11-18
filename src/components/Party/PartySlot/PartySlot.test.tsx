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
    it("shows a picker when empty", async () => {
        const { screen } = await setup(null);
        await expect
            .element(screen.getByRole("combobox", { name: "Slot 1 Pokémon" }))
            .toBeVisible();
        expect(screen.getByRole("button").query()).toBeNull();
    });

    it("fills the slot with the picked Pokémon", async () => {
        const { screen, onSet } = await setup(null);
        await screen.getByRole("combobox").fill("char");
        await screen.getByRole("option", { name: /charmander/ }).click();
        expect(onSet).toHaveBeenCalledWith(4);
    });

    it("does not offer Pokémon already in the party", async () => {
        const { screen } = await setup(null, [1]);
        await screen.getByRole("combobox").fill("saur");
        expect(
            screen.getByRole("option", { name: /bulbasaur/ }).query()
        ).toBeNull();
        await expect
            .element(screen.getByRole("option", { name: /ivysaur/ }))
            .toBeVisible();
    });

    it("shows the member's sprite, number, name and types when filled", async () => {
        const { screen } = await setup(bulbasaur);
        await expect.element(screen.getByText("bulbasaur")).toBeVisible();
        await expect.element(screen.getByText("#0001")).toBeVisible();
        await expect.element(screen.getByText("poison")).toBeVisible();
        expect(screen.getByRole("combobox").query()).toBeNull();
        expect(screen.container.querySelector("img")?.getAttribute("alt")).toBe(
            ""
        );
    });

    it("clears the slot from its remove button", async () => {
        const { screen, onSet } = await setup(bulbasaur);
        await screen.getByRole("button", { name: "Remove bulbasaur" }).click();
        expect(onSet).toHaveBeenCalledWith(null);
    });
});
