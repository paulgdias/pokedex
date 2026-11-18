import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import AbilityList from ".";

// formatted names, effect text and the hidden badge are covered by the stories
describe("AbilityList", () => {
    it("leaves out the effect line, not just its text, when there is none", async () => {
        const screen = await render(
            <AbilityList
                abilities={[{ name: "run-away", isHidden: false, effect: "" }]}
            />
        );
        expect(
            screen.getByRole("listitem").element().querySelectorAll("span")
        ).toHaveLength(1);
    });
});
