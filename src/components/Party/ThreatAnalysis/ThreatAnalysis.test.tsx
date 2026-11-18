import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { PokemonDetails } from "@customTypes/PokemonTypes";

import {
    bulbasaur,
    CHARMANDER,
    EFFICACY,
    makePokemon,
    PIDGEY,
} from "../../__fixtures__/pokemon";
import ThreatAnalysis from ".";

type Screen = Awaited<ReturnType<typeof render>>;

const setup = async (party: PokemonDetails[], threats: string[]) => {
    const onAddThreat = vi.fn();
    const onRemoveThreat = vi.fn();
    const props = { efficacy: EFFICACY, onAddThreat, onRemoveThreat };
    const screen = await render(
        <ThreatAnalysis party={party} threats={threats} {...props} />
    );
    const picker = screen.getByRole("button", { name: /Add a threat type/ });
    return { screen, picker, props, onAddThreat, onRemoveThreat };
};

/** Each body row's visible labels, keyed by the member's name. */
const grid = (screen: Screen) =>
    Object.fromEntries(
        [...screen.container.querySelectorAll("tbody tr")].map((row) => [
            row.querySelector("th")?.textContent,
            [...row.querySelectorAll("td")].map(
                (cell) => cell.querySelector("[aria-hidden]")?.textContent
            ),
        ])
    );

const columns = (screen: Screen) =>
    [...screen.container.querySelectorAll("thead th")]
        .slice(1)
        .map((cell) => cell.textContent);

describe("ThreatAnalysis prompts", () => {
    it("describes the feature when there is no party and no threat", async () => {
        const { screen } = await setup([], []);
        await expect
            .element(screen.getByText("Pick up to three opponent types"))
            .toBeVisible();
        expect(screen.getByRole("table").query()).toBeNull();
    });

    it("asks for Pokémon when only threats are set", async () => {
        const { screen } = await setup([], ["fire"]);
        await expect
            .element(screen.getByText("Add Pokémon to your party"))
            .toBeVisible();
    });

    it("asks for a threat when only the party is set", async () => {
        const { screen } = await setup([bulbasaur], []);
        await expect
            .element(screen.getByText("Add a threat type to see"))
            .toBeVisible();
    });
});

describe("ThreatAnalysis grid", () => {
    it("has a row per member and a column per threat", async () => {
        const { screen } = await setup(
            [bulbasaur, CHARMANDER],
            ["fire", "water"]
        );
        expect(columns(screen)).toEqual(["fire", "water"]);
        expect(grid(screen)).toEqual({
            bulbasaur: ["2×", "½×"],
            charmander: ["½×", "2×"],
        });
    });

    it("labels 0×, ¼×, ½×, 2× and 4×", async () => {
        const GRASS_FLYING = makePokemon({
            id: 187,
            name: "hoppip",
            types: ["grass", "flying"],
        });
        const { screen } = await setup(
            [bulbasaur, PIDGEY, GRASS_FLYING],
            ["grass", "ground", "ice"]
        );
        expect(grid(screen)).toEqual({
            bulbasaur: ["¼×", "½×", "2×"],
            pidgey: ["½×", "0×", "2×"],
            hoppip: ["¼×", "0×", "4×"],
        });
    });

    it("color-codes cells by band", async () => {
        const { screen } = await setup([PIDGEY], ["ground", "ice", "normal"]);
        const cell = (multiplier: string) =>
            screen.container.querySelector(
                `td[data-multiplier="${multiplier}"]`
            )?.className ?? "";
        expect(cell("0")).toContain("bg-ink");
        expect(cell("2")).toContain("--color-fighting");
        expect(cell("1")).toContain("text-muted");
    });

    it("describes every cell for screen readers", async () => {
        const { screen } = await setup([bulbasaur], ["fire"]);
        await expect
            .element(screen.getByText("Fire → Bulbasaur: 2× (super effective)"))
            .toBeInTheDocument();
        await expect
            .element(screen.getByRole("table"))
            .toHaveAccessibleName(/Damage each party member takes from fire/);
    });

    it("drops a column when its threat is removed", async () => {
        const { screen, props } = await setup([bulbasaur], ["fire", "water"]);
        await screen.rerender(
            <ThreatAnalysis
                party={[bulbasaur]}
                threats={["water"]}
                {...props}
            />
        );
        expect(columns(screen)).toEqual(["water"]);
    });
});

describe("ThreatAnalysis controls", () => {
    it("offers every type not yet added and reports the pick", async () => {
        const { screen, picker, onAddThreat } = await setup([], ["fire"]);
        await picker.click();
        const options = screen.getByRole("option").elements();
        expect(options).toHaveLength(17);
        expect(options.map((option) => option.textContent)).not.toContain(
            "fire"
        );
        await screen.getByRole("option", { name: "water" }).click();
        expect(onAddThreat).toHaveBeenCalledWith("water");
        // the list closes and stays closed instead of covering the grid
        await expect.element(picker).toHaveAttribute("aria-expanded", "false");
        await expect.element(picker).toHaveTextContent("Pick a type");
    });

    it("disables the picker once three threats are set", async () => {
        const { picker } = await setup([], ["fire", "water", "grass"]);
        await expect.element(picker).toBeDisabled();
        await expect
            .element(picker)
            .toHaveTextContent("Up to three threat types");
    });

    it("removes a threat from its pill", async () => {
        const { screen, onRemoveThreat } = await setup([], ["fire", "water"]);
        await screen
            .getByRole("button", { name: "Remove water threat" })
            .click();
        expect(onRemoveThreat).toHaveBeenCalledWith("water");
    });

    it("can pick with the keyboard", async () => {
        const { picker, onAddThreat } = await setup([], []);
        (picker.element() as HTMLElement).focus();
        // opens on the first type; type-to-select jumps to "ice"
        await userEvent.keyboard("{Enter}");
        await userEvent.keyboard("ice");
        await userEvent.keyboard("{Enter}");
        expect(onAddThreat).toHaveBeenCalledWith("ice");
    });
});
