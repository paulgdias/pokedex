import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import {
    bulbasaur,
    CHARMANDER,
    DRATINI,
    EFFICACY,
} from "../../__fixtures__/pokemon";
import MemberMatchups from ".";

describe("MemberMatchups", () => {
    it("gives each member a labelled section with its sprite, types and matchups", async () => {
        const screen = await render(
            <MemberMatchups
                party={[bulbasaur, CHARMANDER]}
                efficacy={EFFICACY}
            />
        );
        const bulba = screen.getByRole("region", {
            name: "bulbasaur matchups",
        });
        await expect.element(bulba).toBeVisible();
        await expect.element(bulba.getByText("poison")).toBeVisible();
        expect(bulba.element().querySelector("img")?.getAttribute("alt")).toBe(
            ""
        );
        // the grouped matchups come from TypeMatchups
        await expect.element(bulba.getByText("¼×")).toBeVisible();
        await expect
            .element(
                screen.getByRole("region", { name: "charmander matchups" })
            )
            .toBeVisible();
    });

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

    it("says so when the chart has no data for a member's types", async () => {
        // EFFICACY never mentions dragon
        const screen = await render(
            <MemberMatchups party={[DRATINI]} efficacy={EFFICACY} />
        );
        await expect
            .element(screen.getByText("Type data unavailable"))
            .toBeVisible();
        expect(
            screen.getByText("No weaknesses or resistances").query()
        ).toBeNull();
    });

    it("renders nothing for an empty party", async () => {
        const screen = await render(
            <MemberMatchups party={[]} efficacy={EFFICACY} />
        );
        expect(screen.container.textContent).toBe("");
    });
});
