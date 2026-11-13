import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import Panel from ".";

const meta = {
    title: "Shared/Panel",
    component: Panel,
    args: { children: "Charizard", className: "p-5" },
    decorators: [
        (Story) => (
            <div className="bg-paper p-6">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const panel = within(canvasElement).getByText("Charizard");
        await expect(panel).toBeVisible();
        await expect(panel).toHaveClass("rounded-2xl", "bg-surface");
    },
};

export const LabelledSection: Story = {
    render: (args) => (
        <Panel {...args} as="section" aria-labelledby="abilities">
            <h2 id="abilities" className="font-bold">
                Abilities
            </h2>
            Blaze
        </Panel>
    ),
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole("region", { name: "Abilities" })
        ).toBeVisible();
    },
};

export const TranslucentOverride: Story = {
    args: { className: "bg-surface/60 p-5" },
    play: async ({ canvasElement }) => {
        const panel = within(canvasElement).getByText("Charizard");
        await expect(panel).toHaveClass("bg-surface/60");
        await expect(panel).not.toHaveClass("bg-surface");
    },
};
