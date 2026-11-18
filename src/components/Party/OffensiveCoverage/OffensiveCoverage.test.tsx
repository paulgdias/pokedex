import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { TypeEfficacy } from "@customTypes/PokemonTypes";
import { computeOffensiveCoverage } from "@utils/partyAnalyzer";
import { TYPE_ORDER } from "@utils/stats";

import {
    bulbasaur,
    CHARMANDER,
    DITTO,
    EFFICACY,
} from "../../__fixtures__/pokemon";
import OffensiveCoverage from ".";

describe("OffensiveCoverage", () => {
    // the gap pills, the summary and the prompts are covered by the stories;
    // which types are covered is computeOffensiveCoverage's job
    it("lists the types computeOffensiveCoverage returns, marking its gaps", async () => {
        const party = [bulbasaur, CHARMANDER];
        const screen = await render(
            <OffensiveCoverage party={party} efficacy={EFFICACY} />
        );
        const pills = screen
            .getByRole("listitem")
            .elements()
            .map((pill) => ({
                type: pill.textContent?.match(/^[a-z]+/)?.[0],
                covered: !pill.textContent?.includes("Coverage gap"),
            }));
        expect(pills).toEqual(computeOffensiveCoverage(party, EFFICACY));
    });

    it("counts a single gap in the singular", async () => {
        const efficacy: TypeEfficacy = {
            normal: Object.fromEntries(
                TYPE_ORDER.filter((type) => type !== "ghost").map((type) => [
                    type,
                    2,
                ])
            ),
        };
        const screen = await render(
            <OffensiveCoverage party={[DITTO]} efficacy={efficacy} />
        );
        await expect
            .element(screen.getByText("1 coverage gap:", { exact: false }))
            .toBeVisible();
    });
});
