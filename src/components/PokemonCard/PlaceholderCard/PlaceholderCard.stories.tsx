import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import PlaceholderCard from ".";

const meta = {
    title: "Pokedex/PokemonCard/PlaceholderCard",
    component: PlaceholderCard,
    args: { style: { width: 190, height: 216 } },
} satisfies Meta<typeof PlaceholderCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {
    play: async ({ canvasElement }) => {
        const card = canvasElement.firstElementChild as HTMLElement;
        // decorative: hidden from assistive tech, and no motion by default
        await expect(card).toHaveAttribute("aria-hidden", "true");
        await expect(card).not.toHaveClass("animate-pulse");
        await expect(getComputedStyle(card).width).toBe("190px");
    },
};

export const Animated: Story = {
    args: { animated: true },
    play: async ({ canvasElement }) => {
        const card = canvasElement.firstElementChild as HTMLElement;
        await expect(card).toHaveClass("animate-pulse");
        await expect(getComputedStyle(card).animationName).toBe("pulse");
    },
};
