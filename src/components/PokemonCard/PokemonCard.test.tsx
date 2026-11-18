import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { CARD_HEIGHT, MIN_CARD_WIDTH } from "@components/PokemonList/utils";

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

    // the grid gives every card a CARD_HEIGHT row and shrinks a taller card
    // to fit, clipping it. One type, so the height does not depend on whether
    // two pills fit on a line: tests render in a fallback font (Nunito is a
    // web font), which is wider on CI than on a laptop
    it("is exactly the grid's row height at its narrowest", async () => {
        const screen = await render(
            <div style={{ width: MIN_CARD_WIDTH, fontFamily: "monospace" }}>
                <PokemonCard pokemon={makePokemon({ types: ["electric"] })} />
            </div>
        );
        const card = screen.getByLabelText("Pokemon Card for bulbasaur");
        expect(card.element().getBoundingClientRect().height).toBe(CARD_HEIGHT);
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
