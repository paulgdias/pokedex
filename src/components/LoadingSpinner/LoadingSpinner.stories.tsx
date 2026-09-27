import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import LoadingSpinner from ".";

const meta = {
    title: "Shared/LoadingSpinner",
    component: LoadingSpinner,
    parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spinning: Story = {
    play: async ({ canvasElement }) => {
        const spinner = canvasElement.firstElementChild as HTMLElement;
        await expect(spinner).toHaveClass("animate-spin");
        // the animation is really applied, not just named
        await expect(getComputedStyle(spinner).animationName).toBe("spin");
        await expect(spinner.querySelector("svg")).not.toBeNull();
    },
};
