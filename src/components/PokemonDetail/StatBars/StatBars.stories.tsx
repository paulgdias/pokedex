import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import StatBars from ".";

const meta = {
    title: "PokemonDetail/StatBars",
    component: StatBars,
    args: { stats: [45, 49, 49, 65, 65, 45], total: 318 },
    decorators: [
        (Story) => (
            <div className="w-96">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof StatBars>;

export default meta;
type Story = StoryObj<typeof meta>;

/** How much of the meter's track its fill covers, as drawn. */
const filled = (meter: HTMLElement) =>
    (meter.firstElementChild as HTMLElement).getBoundingClientRect().width /
    meter.getBoundingClientRect().width;

export const Bulbasaur: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const speed = canvas.getByRole("meter", { name: "Speed" });
        await expect(speed).toHaveAttribute("aria-valuenow", "45");
        await expect(speed).toHaveAttribute("aria-valuemax", "255");
        await expect(canvas.getAllByRole("meter")).toHaveLength(6);
        await expect(canvas.getByText("318")).toBeVisible();

        // bar length is the stat's share of the highest possible stat
        await expect(filled(speed)).toBeCloseTo(45 / 255, 2);
    },
};

export const CapsAtTheMaximum: Story = {
    args: { stats: [255, 300, 0, 10, 10, 10], total: 585 },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const bar = (name: string) =>
            filled(canvas.getByRole("meter", { name }));
        await expect(bar("HP")).toBe(1);
        await expect(bar("Attack")).toBe(1);
        await expect(bar("Defense")).toBe(0);
    },
};
