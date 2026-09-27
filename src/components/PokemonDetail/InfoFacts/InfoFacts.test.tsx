import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import InfoFacts from ".";
import { makeInfo } from "../../__fixtures__/pokemon";

const rows = (screen: Awaited<ReturnType<typeof render>>) =>
    Object.fromEntries(
        [...screen.container.querySelectorAll("dt")].map((term) => [
            term.textContent,
            term.nextElementSibling?.textContent,
        ])
    );

describe("InfoFacts", () => {
    it("formats size, rates and names", async () => {
        const screen = await render(<InfoFacts info={makeInfo()} />);
        expect(rows(screen)).toMatchObject({
            Height: "0.7 m (2′04″)",
            Weight: "6.9 kg (15.2 lb)",
            "Base experience": "64",
            "Capture rate": "45",
            "Base happiness": "50",
            "Egg groups": "Monster, Plant",
            "Growth rate": "Medium Slow",
            Habitat: "Grassland",
            Color: "Green",
            Shape: "Quadruped",
        });
    });

    it("draws the gender split proportional to the female share", async () => {
        const screen = await render(
            <InfoFacts info={makeInfo({ genderRate: 4 })} />
        );
        expect(rows(screen).Gender).toBe("50% female · 50% male");
        const female = screen.container.querySelector(
            ".bg-fairy"
        ) as HTMLElement;
        expect(female.style.width).toBe("50%");
    });

    it("handles all-male and all-female species", async () => {
        const male = await render(
            <InfoFacts info={makeInfo({ genderRate: 0 })} />
        );
        expect(rows(male).Gender).toBe("0% female · 100% male");
        await male.unmount();

        const female = await render(
            <InfoFacts info={makeInfo({ genderRate: 8 })} />
        );
        expect(rows(female).Gender).toBe("100% female · 0% male");
    });

    it("says genderless for genderless species", async () => {
        const screen = await render(
            <InfoFacts info={makeInfo({ genderRate: -1 })} />
        );
        expect(rows(screen).Gender).toBe("Genderless");
        expect(screen.container.querySelector(".bg-fairy")).toBeNull();
    });

    it("shows a dash for missing values", async () => {
        const screen = await render(
            <InfoFacts
                info={makeInfo({
                    baseExperience: null,
                    baseHappiness: null,
                    habitat: null,
                    color: null,
                    shape: null,
                    growthRate: null,
                    eggGroups: [],
                })}
            />
        );
        const shown = rows(screen);
        for (const label of [
            "Base experience",
            "Base happiness",
            "Egg groups",
            "Growth rate",
            "Habitat",
            "Color",
            "Shape",
        ]) {
            expect(shown[label]).toBe("—");
        }
    });
});
