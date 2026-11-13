import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import SectionLabel from ".";

describe("SectionLabel", () => {
    it("renders its children in a div with the label classes", async () => {
        const screen = await render(
            <SectionLabel data-testid="l">Abilities</SectionLabel>
        );
        const label = screen.getByTestId("l");
        await expect.element(label).toHaveTextContent("Abilities");
        expect(label.element().tagName).toBe("DIV");
        await expect
            .element(label)
            .toHaveClass(
                "text-[13px]",
                "font-bold",
                "tracking-wider",
                "text-muted",
                "uppercase"
            );
    });

    it.each([
        ["h2", 2],
        ["h3", 3],
    ] as const)("renders a heading with as=%s", async (tag, level) => {
        const screen = await render(
            <SectionLabel as={tag}>Abilities</SectionLabel>
        );
        await expect
            .element(screen.getByRole("heading", { level, name: "Abilities" }))
            .toBeVisible();
    });

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
