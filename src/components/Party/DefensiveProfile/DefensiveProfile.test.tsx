import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { computeDefensiveProfile } from "@utils/partyAnalyzer";

import {
    bulbasaur,
    CHARMANDER,
    DRATINI,
    EFFICACY,
    PIDGEY,
} from "../../__fixtures__/pokemon";
import DefensiveProfile from ".";

type Screen = Awaited<ReturnType<typeof render>>;

const BANDS = [
    ["Immune", "immune"],
    ["Resistant", "resistant"],
    ["Neutral", "neutral"],
    ["Weak", "weak"],
] as const;

/** The type names in one band, without the weak count or screen-reader text. */
const band = (screen: Screen, name: string) => {
    const region = screen.getByRole("region", { name, exact: true });
    return [...region.element().querySelectorAll("li")].map(
        (pill) => pill.textContent?.match(/^[a-z]+/)?.[0]
    );
};

describe("DefensiveProfile", () => {
    // the band order, empty bands, weak counts and prompts are covered by the
    // stories; which band a type lands in is computeDefensiveProfile's job
    it("puts each type in the band computeDefensiveProfile gives it", async () => {
        const party = [bulbasaur, CHARMANDER, PIDGEY];
        const screen = await render(
            <DefensiveProfile party={party} efficacy={EFFICACY} />
        );
        const profile = computeDefensiveProfile(party, EFFICACY);
        for (const [label, value] of BANDS) {
            expect(band(screen, label)).toEqual(
                profile
                    .filter((entry) => entry.band === value)
                    .map((entry) => entry.type)
            );
        }
    });

    it("leaves out a member whose type data is missing", async () => {
        // with dratini counted, every type would read as Neutral
        const screen = await render(
            <DefensiveProfile party={[DRATINI]} efficacy={EFFICACY} />
        );
        expect(
            screen.getByText("No types in this band").elements()
        ).toHaveLength(4);
    });
});
