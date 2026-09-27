import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import ScrollTopButton from ".";

const meta = {
    title: "Shared/ScrollTopButton",
    component: ScrollTopButton,
    args: { onPress: fn() },
} satisfies Meta<typeof ScrollTopButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ args, canvasElement }) => {
        const button = within(canvasElement).getByRole("button", {
            name: "Go to Top of Page",
        });

        await userEvent.click(button);
        await expect(args.onPress).toHaveBeenCalledTimes(1);

        button.focus();
        await userEvent.keyboard("{Enter}");
        await expect(args.onPress).toHaveBeenCalledTimes(2);
    },
};
