import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { DRATINI, EFFICACY } from "../../__fixtures__/pokemon";
import MemberMatchups from ".";

describe("MemberMatchups", () => {
    // the member panels and the missing-data note are covered by the story
    it("says so when a member has no weaknesses or resistances", async () => {
        // dragon is in this chart, but nothing hits it for anything but 1×
        const screen = await render(
            <MemberMatchups
                party={[DRATINI]}
                efficacy={{ normal: { dragon: 1 } }}
            />
        );
        await expect
            .element(screen.getByText("No weaknesses or resistances"))
            .toBeVisible();
    });

    it("renders nothing for an empty party", async () => {
        const screen = await render(
            <MemberMatchups party={[]} efficacy={EFFICACY} />
        );
        expect(screen.container.textContent).toBe("");
    });
});
