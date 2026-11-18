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
    // the six slots and their layout are covered by the stories
    it("clears the right slot", async () => {
        const { screen, onSet } = await setup();
        await screen.getByRole("button", { name: "Remove charmander" }).click();
        expect(onSet).toHaveBeenCalledWith(4, null);
    });

    it("fills the right slot and never offers a member twice", async () => {
        const { screen, onSet } = await setup();
        const slot3 = screen.getByRole("combobox", { name: "Slot 3 Pokémon" });
        await slot3.fill("saur");
        const ivysaur = screen.getByRole("option", { name: /ivysaur/ });
        // wait for the list before checking what it leaves out
        await expect.element(ivysaur).toBeVisible();
        expect(
            screen.getByRole("option", { name: /bulbasaur/ }).query()
        ).toBeNull();
        await ivysaur.click();
        expect(onSet).toHaveBeenCalledWith(2, 2);
    });
});
