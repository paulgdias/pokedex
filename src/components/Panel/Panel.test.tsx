import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import Panel from ".";

// the surface look and the labelled-section landmark are covered by the stories
describe("Panel", () => {
    it("passes attributes through", async () => {
        const screen = await render(
            <Panel role="table" aria-label="Pokémon" aria-rowcount={3} />
        );
        await expect
            .element(screen.getByRole("table", { name: "Pokémon" }))
            .toHaveAttribute("aria-rowcount", "3");
    });

    it("lets className add layout and override the surface", async () => {
        const screen = await render(
            <Panel data-testid="p" className="flex p-5 bg-surface/60" />
        );
        const panel = screen.getByTestId("p");
        await expect.element(panel).toHaveClass("flex", "p-5", "bg-surface/60");
        await expect.element(panel).not.toHaveClass("bg-surface");
        await expect.element(panel).toHaveClass("rounded-2xl");
    });
});
