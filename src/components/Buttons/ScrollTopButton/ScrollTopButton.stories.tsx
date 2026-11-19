import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";

import ScrollTopButton from ".";

const meta = {
    title: "Shared/ScrollTopButton",
    component: ScrollTopButton,
    args: { onPress: fn() },
} satisfies Meta<typeof ScrollTopButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole("button", {
            name: "Go to Top of Page",
        });
        // floats over the page; pressing it is covered by the unit test
        await expect(button).toBeVisible();
        await expect(getComputedStyle(button).position).toBe("fixed");
    },
};
