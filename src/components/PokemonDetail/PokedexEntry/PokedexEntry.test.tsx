import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { makeInfo } from "../../__fixtures__/pokemon";
import PokedexEntry from ".";

describe("PokedexEntry", () => {
    it("shows the genus and the newest entry with wraps collapsed", async () => {
        const screen = await render(<PokedexEntry info={makeInfo()} />);
        await expect.element(screen.getByText("Seed Pokémon")).toBeVisible();
        await expect
            .element(
                screen.getByText(
                    "A strange seed was planted on its back at birth."
                )
            )
            .toBeVisible();
    });

    it("lists every game with a formatted name", async () => {
        const screen = await render(<PokedexEntry info={makeInfo()} />);
        const options = screen.getByRole("option").elements();
        expect(options.map((option) => option.textContent)).toEqual([
            "Sword",
            "Ruby",
        ]);
    });

    it("swaps the text when another game is chosen", async () => {
        const screen = await render(<PokedexEntry info={makeInfo()} />);

        await userEvent.selectOptions(screen.getByLabelText("Game"), "1");

        await expect
            .element(screen.getByText("It can go without eating for days."))
            .toBeVisible();
    });

    it("omits the genus when the species has none", async () => {
        const screen = await render(
            <PokedexEntry info={makeInfo({ genus: "" })} />
        );
        expect(screen.getByText("Seed Pokémon").query()).toBeNull();
    });

    it("says so when there are no entries", async () => {
        const screen = await render(
            <PokedexEntry info={makeInfo({ flavorTexts: [] })} />
        );
        await expect
            .element(screen.getByText("No entry available."))
            .toBeVisible();
        expect(screen.getByRole("combobox").query()).toBeNull();
    });
});
