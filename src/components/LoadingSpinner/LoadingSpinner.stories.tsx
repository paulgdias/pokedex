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
        const ball = spinner.querySelector("svg") as SVGSVGElement;
        // the animation is really applied, not just named
        await expect(getComputedStyle(spinner).animationName).toBe("spin");
        await expect(ball.getBoundingClientRect().width).toBe(52);
        await expect(ball.getBoundingClientRect().height).toBe(52);
        // centred in the full viewport height
        await expect(spinner.getBoundingClientRect().height).toBe(
            window.innerHeight
        );
    },
};
