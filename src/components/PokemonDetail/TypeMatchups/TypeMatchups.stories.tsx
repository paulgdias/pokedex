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
        // dual types multiply: grass × poison resists grass twice over
        await expect(attackers(canvas, "¼×")).toEqual(["grass"]);
    },
};

export const ImmunityAndDoubleWeakness: Story = {
    args: { types: ["grass", "flying"] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(attackers(canvas, "4×")).toEqual(["ice"]);
        await expect(attackers(canvas, "0×")).toEqual(["ground"]);
        // spoken as damage taken, not just a bare multiplier
        await expect(
            canvas.getAllByText("Damage taken:", { exact: false }).length
        ).toBeGreaterThan(0);
    },
};
