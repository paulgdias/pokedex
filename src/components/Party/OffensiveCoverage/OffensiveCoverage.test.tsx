import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { TypeEfficacy } from "@customTypes/PokemonTypes";
import { TYPE_ORDER } from "@utils/stats";

import { CHARMANDER, DITTO, EFFICACY } from "../../__fixtures__/pokemon";
import OffensiveCoverage from ".";

type Screen = Awaited<ReturnType<typeof render>>;

const pills = (screen: Screen) =>
    screen
        .getByRole("listitem")
        .elements()
        .map((pill) => ({
            type: pill.textContent?.match(/^[a-z]+/)?.[0],
            covered: pill.dataset.covered === "true",
            pill,
        }));

describe("OffensiveCoverage", () => {
    it("lists all 18 types, covered or not", async () => {
        const screen = await render(
            <OffensiveCoverage party={[CHARMANDER]} efficacy={EFFICACY} />
        );
        const all = pills(screen);
        expect(all.map(({ type }) => type)).toEqual([...TYPE_ORDER]);
        // fire hits grass and ice for 2×
        expect(
            all.filter(({ covered }) => covered).map(({ type }) => type)
        ).toEqual(["grass", "ice"]);
        await expect
            .element(screen.getByText("16 coverage gaps", { exact: false }))
            .toBeVisible();
    });

    it("draws gaps differently and names them for screen readers", async () => {
        const screen = await render(
            <OffensiveCoverage party={[CHARMANDER]} efficacy={EFFICACY} />
        );
        const [grass, water] = ["grass", "water"].map(
            (name) => pills(screen).find(({ type }) => type === name)?.pill
        );
        expect(grass?.className).not.toContain("border-dashed");
        expect(grass?.textContent).not.toContain("Coverage gap");
        expect(water?.className).toContain("border-dashed");
        expect(water?.textContent).toContain("Coverage gap");
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

    it("confirms full coverage and shows no gaps", async () => {
        const efficacy: TypeEfficacy = {
            normal: Object.fromEntries(TYPE_ORDER.map((type) => [type, 2])),
        };
        const screen = await render(
            <OffensiveCoverage party={[DITTO]} efficacy={efficacy} />
        );
        await expect
            .element(screen.getByText("Full coverage", { exact: false }))
            .toBeVisible();
        expect(screen.getByText("Coverage gap").query()).toBeNull();
        expect(pills(screen).every(({ covered }) => covered)).toBe(true);
    });

    it("prompts for Pokémon and classifies nothing when the party is empty", async () => {
        const screen = await render(
            <OffensiveCoverage party={[]} efficacy={EFFICACY} />
        );
        await expect
            .element(screen.getByText("Add Pokémon", { exact: false }))
            .toBeVisible();
        expect(screen.getByRole("listitem").query()).toBeNull();
    });
});
