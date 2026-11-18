import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import SectionLabel from ".";

// the label look and the heading variant are covered by the stories
describe("SectionLabel", () => {
    it("passes attributes through, such as an id to label a section", async () => {
        const screen = await render(
            <SectionLabel as="h2" id="abilities">
                Abilities
            </SectionLabel>
        );
        await expect
            .element(screen.getByRole("heading"))
            .toHaveAttribute("id", "abilities");
    });

    it("lets className override the color", async () => {
        const screen = await render(
            <SectionLabel data-testid="l" className="text-accent">
                Abilities
            </SectionLabel>
        );
        const label = screen.getByTestId("l");
        await expect.element(label).toHaveClass("text-accent");
        await expect.element(label).not.toHaveClass("text-muted");
    });
});
