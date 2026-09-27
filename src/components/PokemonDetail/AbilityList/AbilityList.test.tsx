import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import AbilityList from ".";

describe("AbilityList", () => {
    it("formats names and shows each effect", async () => {
        const screen = await render(
            <AbilityList
                abilities={[
                    {
                        name: "lightning-rod",
                        isHidden: false,
                        effect: "Draws in Electric moves.",
                    },
                ]}
            />
        );
        await expect.element(screen.getByText("Lightning Rod")).toBeVisible();
        await expect
            .element(screen.getByText("Draws in Electric moves."))
            .toBeVisible();
        expect(screen.getByText("Hidden").query()).toBeNull();
    });

    it("badges only the hidden ability", async () => {
        const screen = await render(
            <AbilityList
                abilities={[
                    { name: "static", isHidden: false, effect: "a" },
                    { name: "lightning-rod", isHidden: true, effect: "b" },
                ]}
            />
        );
        const items = screen.getByRole("listitem").elements();
        expect(items[0].textContent).not.toContain("Hidden");
        expect(items[1].textContent).toContain("Hidden");
    });

    it("omits the effect line when there is none", async () => {
        const screen = await render(
            <AbilityList
                abilities={[{ name: "run-away", isHidden: false, effect: "" }]}
            />
        );
        expect(
            screen.getByRole("listitem").element().querySelectorAll("span")
        ).toHaveLength(1);
    });

    it("renders an empty list for no abilities", async () => {
        const screen = await render(<AbilityList abilities={[]} />);
        expect(screen.getByRole("listitem").query()).toBeNull();
    });
});
