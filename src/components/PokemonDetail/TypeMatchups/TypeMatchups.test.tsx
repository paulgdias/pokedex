import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { EFFICACY } from "../../__fixtures__/pokemon";
import TypeMatchups from ".";

// the groups and their pills are covered by the stories; the grouping and the
// multiplier math by the getTypeMatchups tests (@utils/stats)
describe("TypeMatchups", () => {
    it("announces each group as damage taken", async () => {
        const screen = await render(
            <TypeMatchups types={["grass", "flying"]} efficacy={EFFICACY} />
        );
        const terms = screen.container.querySelectorAll("dt");
        expect(terms.length).toBeGreaterThan(0);
        for (const term of terms) {
            expect(term.textContent).toMatch(/^Damage taken: /);
        }
    });
});
