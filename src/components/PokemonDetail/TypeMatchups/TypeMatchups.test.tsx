import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { EFFICACY } from "../../__fixtures__/pokemon";
import TypeMatchups from ".";

const groups = (screen: Awaited<ReturnType<typeof render>>) =>
    Object.fromEntries(
        [...screen.container.querySelectorAll("dt")].map((term) => [
            term.textContent?.replace("Damage taken: ", ""),
            [...(term.nextElementSibling?.children ?? [])].map(
                (pill) => pill.textContent
            ),
        ])
    );

describe("TypeMatchups", () => {
    it("groups attackers by multiplier and leaves out neutral ones", async () => {
        const screen = await render(
            <TypeMatchups types={["grass", "poison"]} efficacy={EFFICACY} />
        );
        expect(groups(screen)).toEqual({
            "2×": ["fire", "ice"],
            "½×": ["water", "electric", "ground"],
            "¼×": ["grass"],
        });
    });

    it("multiplies for dual types, including 4× and 0×", async () => {
        const screen = await render(
            <TypeMatchups types={["grass", "flying"]} efficacy={EFFICACY} />
        );
        const shown = groups(screen);
        expect(shown["4×"]).toEqual(["ice"]);
        expect(shown["0×"]).toEqual(["ground"]);
        expect(shown["2×"]).toEqual(["fire"]);
    });

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

    it("renders no groups when everything is neutral", async () => {
        const screen = await render(
            <TypeMatchups types={["dragon"]} efficacy={EFFICACY} />
        );
        expect(screen.container.querySelectorAll("dt")).toHaveLength(0);
    });
});
