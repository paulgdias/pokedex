import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { makePokemon } from "../__fixtures__/pokemon";
import PokemonCard from "./index";

const bulbasaur = makePokemon();

// what the card shows (name, number, pills, badges, artwork, watermark, the
// static card) is covered by the stories
describe("PokemonCard", () => {
    it("links to the detail page and calls navigateCallback on click", async () => {
        const navigate = vi.fn();
        const screen = await render(
            <PokemonCard pokemon={bulbasaur} navigateCallback={navigate} />
        );
        await expect
            .element(
                screen.getByRole("link", { name: "Navigate to bulbasaur" })
            )
            .toHaveAttribute("href", "/pokedex/bulbasaur");
        await screen.getByLabelText("Pokemon Card for bulbasaur").click();
        expect(navigate).toHaveBeenCalledTimes(1);
        expect(navigate.mock.calls[0][1]).toBe(bulbasaur);
    });

    it("calls navigateCallback on Enter only", async () => {
        const navigate = vi.fn();
        const screen = await render(
            <PokemonCard pokemon={bulbasaur} navigateCallback={navigate} />
        );
        (
            screen
                .getByLabelText("Pokemon Card for bulbasaur")
                .element() as HTMLElement
        ).focus();

        await userEvent.keyboard(" a");
        expect(navigate).not.toHaveBeenCalled();

        await userEvent.keyboard("{Enter}");
        expect(navigate).toHaveBeenCalledTimes(1);
    });
});
