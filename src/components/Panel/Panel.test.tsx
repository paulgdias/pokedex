import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import Panel from ".";

describe("Panel", () => {
    it("renders its children in a div with the surface classes", async () => {
        const screen = await render(<Panel data-testid="p">Hello</Panel>);
        const panel = screen.getByTestId("p");
        await expect.element(panel).toHaveTextContent("Hello");
        expect(panel.element().tagName).toBe("DIV");
        await expect
            .element(panel)
            .toHaveClass("rounded-2xl", "border", "border-line", "bg-surface");
    });

    it("can be a labelled section", async () => {
        const screen = await render(
            <>
                <h2 id="t">Abilities</h2>
                <Panel as="section" aria-labelledby="t">
                    Blaze
                </Panel>
            </>
        );
        await expect
            .element(screen.getByRole("region", { name: "Abilities" }))
            .toBeVisible();
    });

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
