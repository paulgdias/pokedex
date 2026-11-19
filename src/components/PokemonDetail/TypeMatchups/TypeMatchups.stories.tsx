import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { EFFICACY } from "../../__fixtures__/pokemon";
import TypeMatchups from ".";

const meta = {
    title: "PokemonDetail/TypeMatchups",
    component: TypeMatchups,
    args: { types: ["grass", "poison"], efficacy: EFFICACY },
    decorators: [
        (Story) => (
            <div className="w-96">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof TypeMatchups>;

export default meta;
type Story = StoryObj<typeof meta>;

const attackers = (canvas: ReturnType<typeof within>, label: string) => {
    const term = canvas.getByText(label, { exact: false });
    return [...(term.closest("dt")?.nextElementSibling?.children ?? [])].map(
        (pill) => pill.textContent
    );
};

export const SingleAndDualTypes: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(attackers(canvas, "2×")).toEqual(["fire", "ice"]);
        await expect(attackers(canvas, "½×")).toEqual([
            "water",
            "electric",
            "ground",
        ]);
        await expect(attackers(canvas, "¼×")).toEqual(["grass"]);

        // each pill's dot is drawn in its own type's color
        const dots = [...canvasElement.querySelectorAll("dd > span > span")];
        const colors = dots.map((dot) => getComputedStyle(dot).backgroundColor);
        await expect(colors).toHaveLength(6);
        await expect(colors).not.toContain("rgba(0, 0, 0, 0)");
        await expect(new Set(colors).size).toBe(6);
    },
};

export const ImmunityAndDoubleWeakness: Story = {
    args: { types: ["grass", "flying"] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(attackers(canvas, "4×")).toEqual(["ice"]);
        await expect(attackers(canvas, "0×")).toEqual(["ground"]);
    },
};
