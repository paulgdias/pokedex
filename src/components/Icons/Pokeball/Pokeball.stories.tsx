import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import Pokeball from ".";

const meta = {
    title: "Shared/Icons/Pokeball",
    component: Pokeball,
} satisfies Meta<typeof Pokeball>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const svg = canvasElement.querySelector("svg") as SVGSVGElement;
        await expect(svg.getBoundingClientRect().width).toBe(32);
        await expect(svg.getBoundingClientRect().height).toBe(32);
    },
};

export const Large: Story = {
    args: { width: 96, height: 64 },
    play: async ({ canvasElement }) => {
        const svg = canvasElement.querySelector("svg") as SVGSVGElement;
        await expect(svg.getBoundingClientRect().width).toBe(96);
        await expect(svg.getBoundingClientRect().height).toBe(64);
        // the viewBox follows the size so the image is never cropped
        await expect(svg.getAttribute("viewBox")).toBe("0 0 96 64");
    },
};
