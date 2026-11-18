import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import {
    bulbasaur,
    CHARMANDER,
    DRATINI,
    EFFICACY,
    PIDGEY,
} from "../../__fixtures__/pokemon";
import DefensiveProfile from ".";

type Screen = Awaited<ReturnType<typeof render>>;

/** The type names in one band, without the weak count or screen-reader text. */
const band = (screen: Screen, name: string) => {
    const region = screen.getByRole("region", { name, exact: true });
    return [...region.element().querySelectorAll("li")].map(
        (pill) => pill.textContent?.match(/^[a-z]+/)?.[0]
    );
};

describe("DefensiveProfile", () => {
    it("renders the four bands in order: Immune, Resistant, Neutral, Weak", async () => {
        const screen = await render(
            <DefensiveProfile party={[bulbasaur]} efficacy={EFFICACY} />
        );
        const headings = screen
            .getByRole("region", { name: "Defensive profile" })
            .getByRole("heading", { level: 3 })
            .elements()
            .map((heading) => heading.textContent);
        expect(headings).toEqual(["Immune", "Resistant", "Neutral", "Weak"]);
    });

    it("sorts every attacking type into one band", async () => {
        const screen = await render(
            <DefensiveProfile
                party={[bulbasaur, CHARMANDER]}
                efficacy={EFFICACY}
            />
        );
        // in the type chart's (/types) order
        expect(band(screen, "Weak")).toEqual([
            "ground",
            "fire",
            "water",
            "ice",
        ]);
        expect(band(screen, "Resistant")).toEqual(["grass", "electric"]);
        expect(band(screen, "Immune")).toEqual([]);
        const all = ["Immune", "Resistant", "Neutral", "Weak"].flatMap((name) =>
            band(screen, name)
        );
        expect(all).toHaveLength(18);
        expect(new Set(all).size).toBe(18);
    });

    it("shows an empty-state label for a band with no types", async () => {
        const screen = await render(
            <DefensiveProfile party={[CHARMANDER]} efficacy={EFFICACY} />
        );
        await expect
            .element(
                screen
                    .getByRole("region", { name: "Immune" })
                    .getByText("No types in this band")
            )
            .toBeVisible();
    });

    it("shows how many members each weakness hits", async () => {
        const screen = await render(
            <DefensiveProfile party={[bulbasaur, PIDGEY]} efficacy={EFFICACY} />
        );
        const weak = screen.getByRole("region", { name: "Weak" });
        await expect
            .element(weak.getByText("2 members weak to ice"))
            .toBeInTheDocument();
        await expect
            .element(weak.getByText("1 member weak to fire"))
            .toBeInTheDocument();
        // pidgey's ground immunity wins over bulbasaur's resistance
        expect(band(screen, "Immune")).toEqual(["ground"]);
    });

    it("keeps a weakness visible even when another member is immune", async () => {
        // ground: charmander takes 2×, pidgey takes 0×
        const screen = await render(
            <DefensiveProfile
                party={[CHARMANDER, PIDGEY]}
                efficacy={EFFICACY}
            />
        );
        await expect
            .element(
                screen
                    .getByRole("region", { name: "Weak" })
                    .getByText("1 member weak to ground")
            )
            .toBeInTheDocument();
        expect(band(screen, "Immune")).toEqual([]);
    });

    it("prompts for Pokémon when the party is empty", async () => {
        const screen = await render(
            <DefensiveProfile party={[]} efficacy={EFFICACY} />
        );
        await expect
            .element(
                screen.getByText("Add Pokémon to see the defensive profile")
            )
            .toBeVisible();
        expect(screen.getByRole("heading", { level: 3 }).query()).toBeNull();
    });

    it("leaves out a member whose type data is missing and says so", async () => {
        const screen = await render(
            <DefensiveProfile
                party={[bulbasaur, DRATINI]}
                efficacy={EFFICACY}
            />
        );
        await expect
            .element(screen.getByText("Type data unavailable for"))
            .toHaveTextContent("Type data unavailable for dratini");
        // the bands are bulbasaur's alone
        await expect
            .element(screen.getByText("1 member weak to fire"))
            .toBeInTheDocument();
    });

    it("leaves every band empty when no member has type data", async () => {
        const screen = await render(
            <DefensiveProfile party={[DRATINI]} efficacy={EFFICACY} />
        );
        expect(
            screen.getByText("No types in this band").elements()
        ).toHaveLength(4);
    });
});
