import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { bulbasaur, CHARMANDER, DEX } from "../../__fixtures__/pokemon";
import PartySlots from ".";

const setup = async () => {
    const onSet = vi.fn();
    const screen = await render(
        <PartySlots
            party={[null, bulbasaur, null, null, CHARMANDER, null]}
            allPokemon={DEX}
            onSet={onSet}
        />
    );
    return { screen, onSet };
};

describe("PartySlots", () => {
    it("renders exactly six slots in a two-then-three column grid", async () => {
        const { screen } = await setup();
        const list = screen.getByRole("list", { name: "Party" });
        expect(list.getByRole("listitem").elements()).toHaveLength(6);
        await expect.element(list).toHaveClass("grid-cols-2", "md:grid-cols-3");
        // four empty slots, labelled by position
        expect(screen.getByRole("combobox").elements()).toHaveLength(4);
        await expect
            .element(screen.getByRole("combobox", { name: "Slot 6 Pokémon" }))
            .toBeVisible();
    });

    it("clears the right slot", async () => {
        const { screen, onSet } = await setup();
        await screen.getByRole("button", { name: "Remove charmander" }).click();
        expect(onSet).toHaveBeenCalledWith(4, null);
    });

    it("fills the right slot and never offers a member twice", async () => {
        const { screen, onSet } = await setup();
        const slot3 = screen.getByRole("combobox", { name: "Slot 3 Pokémon" });
        await slot3.fill("saur");
        expect(
            screen.getByRole("option", { name: /bulbasaur/ }).query()
        ).toBeNull();
        await screen.getByRole("option", { name: /ivysaur/ }).click();
        expect(onSet).toHaveBeenCalledWith(2, 2);
    });
});
