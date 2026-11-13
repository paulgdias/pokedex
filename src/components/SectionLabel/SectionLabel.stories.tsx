import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import SectionLabel from ".";

const meta = {
    title: "Shared/SectionLabel",
    component: SectionLabel,
    args: { children: "Abilities" },
} satisfies Meta<typeof SectionLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const label = within(canvasElement).getByText("Abilities");
        await expect(label).toBeVisible();
        await expect(label).toHaveClass("uppercase", "font-bold");
    },
};

export const AsHeading: Story = {
    args: { as: "h2" },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole("heading", {
                level: 2,
                name: "Abilities",
            })
        ).toBeVisible();
    },
};

export const WithInlineText: Story = {
    render: (args) => (
        <SectionLabel {...args}>
            <span className="capitalize">fire</span> attacking
        </SectionLabel>
    ),
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByText("fire")).toBeVisible();
        await expect(
            within(canvasElement).getByText(/attacking/)
        ).toBeVisible();
    },
};
