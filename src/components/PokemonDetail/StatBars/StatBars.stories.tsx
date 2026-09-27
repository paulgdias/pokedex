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

export const Bulbasaur: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const speed = canvas.getByRole("meter", { name: "Speed" });
        await expect(speed).toHaveAttribute("aria-valuenow", "45");
        await expect(speed).toHaveAttribute("aria-valuemax", "255");
        await expect(canvas.getAllByRole("meter")).toHaveLength(6);
        await expect(canvas.getByText("318")).toBeVisible();

        // bar length is the stat's share of the highest possible stat
        const fill = speed.firstElementChild as HTMLElement;
        await expect(parseFloat(fill.style.width)).toBeCloseTo(
            (45 / 255) * 100,
            2
        );
    },
};

export const CapsAtTheMaximum: Story = {
    args: { stats: [255, 300, 0, 10, 10, 10], total: 585 },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const bar = (name: string) =>
            canvas.getByRole("meter", { name })
                .firstElementChild as HTMLElement;
        await expect(bar("HP").style.width).toBe("100%");
        await expect(bar("Attack").style.width).toBe("100%");
        await expect(bar("Defense").style.width).toBe("0%");
    },
};
