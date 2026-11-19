import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { makeInfo } from "../../__fixtures__/pokemon";
import InfoFacts from ".";

// every row, the dashes, the gender bar and "Genderless" are covered by the
// stories; the formatting rules by the @utils/stats tests
describe("InfoFacts", () => {
    it("draws the bar for an all-male species instead of calling it genderless", async () => {
        const screen = await render(
            <InfoFacts info={makeInfo({ genderRate: 0 })} />
        );
        await expect
            .element(screen.getByText("0% female · 100% male"))
            .toBeVisible();
    });
});
