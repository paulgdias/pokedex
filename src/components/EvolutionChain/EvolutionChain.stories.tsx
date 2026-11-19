import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import {
    DITTO,
    EEVEE_LINE,
    ivysaur,
    MEOWTH_LINE,
    venusaurMega,
} from "../__fixtures__/pokemon";
import TestRouter from "../__fixtures__/router";
import EvolutionChain from ".";

const meta = {
    title: "PokemonDetail/EvolutionChain",
    component: EvolutionChain,
    args: { pokemon: ivysaur },
    decorators: [
        (Story) => (
            <TestRouter initialEntries={["/pokedex/ivysaur?view=list"]}>
                <Story />
            </TestRouter>
        ),
    ],
    parameters: { layout: "padded" },
} satisfies Meta<typeof EvolutionChain>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The computed value of a color token in the current theme. */
const accent = (canvasElement: HTMLElement) => {
    const probe = document.createElement("span");
    probe.style.color = "var(--color-accent)";
    canvasElement.append(probe);
    const { color } = getComputedStyle(probe);
    probe.remove();
    return color;
};

const card = (canvasElement: HTMLElement, name: string) =>
    within(canvasElement).getByText(name, { selector: ".capitalize" })
        .parentElement?.parentElement?.parentElement as HTMLElement;

export const ThreeStageLine: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("heading", { name: "Evolution chain" })
        ).toBeVisible();
        // a single lane has no lane label
        await expect(canvas.queryAllByRole("heading", { level: 3 })).toEqual(
            []
        );

        // each card shows the dex number and the types
        await expect(canvas.getByText("#0002")).toBeVisible();
        await expect(canvas.getAllByText("poison")).toHaveLength(3);

        // the current pokémon has the 2px accent border
        const current = getComputedStyle(card(canvasElement, "ivysaur"));
        await expect(current.borderTopColor).toBe(accent(canvasElement));
        await expect(current.borderTopWidth).toBe("2px");
        await expect(
            getComputedStyle(card(canvasElement, "bulbasaur")).borderTopColor
        ).not.toBe(accent(canvasElement));

        // one arrow between each pair of stages, none before the first
        const arrows = [
            ...canvasElement.querySelectorAll("section svg"),
        ].filter((arrow) => arrow.getBoundingClientRect().width > 0);
        await expect(arrows).toHaveLength(2);

        // the stages run across from md up and stack vertically below it (the
        // test project renders stories at desktop width; the unit test checks
        // the stacking)
        const first = card(canvasElement, "bulbasaur").getBoundingClientRect();
        const second = card(canvasElement, "ivysaur").getBoundingClientRect();
        if (window.matchMedia("(min-width: 48rem)").matches) {
            await expect(second.left).toBeGreaterThanOrEqual(first.right);
        } else {
            await expect(second.top).toBeGreaterThanOrEqual(first.bottom);
            await expect(second.left).toBe(first.left);
        }
    },
};

export const OtherForms: Story = {
    args: { pokemon: venusaurMega },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const box = canvas.getByText("Other forms")
            .parentElement as HTMLElement;
        await expect(box).toBeVisible();
        await expect(getComputedStyle(box).borderTopStyle).toBe("dashed");

        // the current form has the accent border, the other one does not
        const row = (name: string) =>
            canvas.getByText(name).parentElement?.parentElement as HTMLElement;
        await expect(
            getComputedStyle(row("Mega Venusaur")).borderTopColor
        ).toBe(accent(canvasElement));
        await expect(
            getComputedStyle(row("Gigantamax Venusaur")).borderTopColor
        ).not.toBe(accent(canvasElement));
    },
};

export const BranchingEvolutions: Story = {
    args: { pokemon: EEVEE_LINE[0] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("Use Water Stone")).toBeVisible();
        await expect(canvas.getByText("Use Thunder Stone")).toBeVisible();
        await expect(
            canvas.getByRole("link", { name: /vaporeon/ })
        ).toBeVisible();
        await expect(
            canvas.getByRole("link", { name: /jolteon/ })
        ).toBeVisible();
    },
};

export const RegionalLanes: Story = {
    args: { pokemon: MEOWTH_LINE[0] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const headings = canvas
            .getAllByRole("heading", { level: 3 })
            .map((heading) => heading.textContent);
        await expect(headings).toEqual(["Standard", "Alola", "Galar"]);
    },
};

export const NoEvolutions: Story = {
    args: { pokemon: { ...DITTO, evolutions: [DITTO] } },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).queryByRole("heading", {
                name: "Evolution chain",
            })
        ).toBeNull();
    },
};
