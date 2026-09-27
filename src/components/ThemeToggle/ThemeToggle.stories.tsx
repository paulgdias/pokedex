import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import ThemeToggle from ".";

const meta = {
    title: "Layout/ThemeToggle",
    component: ThemeToggle,
    // the toggle is styled for the (always dark) sidebar
    decorators: [
        (Story) => (
            <div className="bg-sidebar p-4">
                <Story />
            </div>
        ),
    ],
    beforeEach: ({ globals }) => {
        localStorage.removeItem("theme");
        return () => {
            localStorage.removeItem("theme");
            // back to the theme the toolbar / Vitest project selected
            document.documentElement.dataset.theme = globals.theme;
        };
    },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ChoosesTheme: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const system = canvas.getByRole("radio", { name: "System theme" });
        const dark = canvas.getByRole("radio", { name: "Dark theme" });
        const light = canvas.getByRole("radio", { name: "Light theme" });
        await expect(system).toBeChecked();

        await userEvent.click(dark);
        await expect(dark).toBeChecked();
        await expect(localStorage.getItem("theme")).toBe("dark");
        await expect(document.documentElement.dataset.theme).toBe("dark");

        await userEvent.click(light);
        await expect(light).toBeChecked();
        await expect(localStorage.getItem("theme")).toBe("light");
        await expect(document.documentElement.dataset.theme).toBe("light");
    },
};

export const RestoresSavedChoice: Story = {
    beforeEach: () => {
        localStorage.setItem("theme", "dark");
    },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole("radio", { name: "Dark theme" })
        ).toBeChecked();
    },
};
