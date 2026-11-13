import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import PageHeader from ".";

const meta = {
    title: "Shared/PageHeader",
    component: PageHeader,
    args: {
        className: "gap-2",
        children: (
            <>
                <h1 className="font-display text-[34px] leading-tight font-bold tracking-tight">
                    Type chart
                </h1>
                <p className="text-[15px] text-muted">
                    Rows attack, columns defend.
                </p>
            </>
        ),
    },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("heading", { name: "Type chart" })
        ).toBeVisible();
        await expect(canvas.getByText(/Rows attack/)).toBeVisible();
    },
};

export const DenserWithBackground: Story = {
    args: {
        className: "gap-4 pt-5 pb-4",
        style: { background: "linear-gradient(135deg, #f5a65b, #fbd3a8)" },
    },
    play: async ({ canvasElement }) => {
        const header = within(canvasElement)
            .getByRole("heading", { name: "Type chart" })
            .closest("div");
        await expect(header).toHaveClass("pt-5", "pb-4");
        await expect(header).not.toHaveClass("pt-6");
    },
};
