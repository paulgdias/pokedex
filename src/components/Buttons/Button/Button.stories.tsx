import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";

import Button from ".";

const meta = {
    title: "Shared/Button",
    component: Button,
    args: { onPress: fn(), children: "Save" },
    argTypes: {
        variant: {
            control: "select",
            options: ["primary", "secondary", "ghost", "link", "field"],
        },
        size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ args, canvasElement }) => {
        const button = within(canvasElement).getByRole("button", {
            name: "Save",
        });

        await userEvent.click(button);
        await expect(args.onPress).toHaveBeenCalledTimes(1);

        button.focus();
        await userEvent.keyboard("{Enter}");
        await expect(args.onPress).toHaveBeenCalledTimes(2);
    },
};

export const Variants: Story = {
    render: (args) => (
        <div className="flex flex-wrap items-center gap-3 p-4">
            <Button {...args} variant="primary">
                Primary
            </Button>
            <Button {...args} variant="secondary">
                Secondary
            </Button>
            <Button {...args} variant="ghost">
                Ghost
            </Button>
            <Button {...args} variant="link">
                Link
            </Button>
            <Button {...args} variant="field">
                Field
            </Button>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const name of ["Primary", "Secondary", "Ghost", "Link", "Field"]) {
            await expect(canvas.getByRole("button", { name })).toBeVisible();
        }
    },
};

export const Sizes: Story = {
    render: (args) => (
        <div className="flex flex-wrap items-center gap-3 p-4">
            <Button {...args} size="sm">
                Small
            </Button>
            <Button {...args} size="md">
                Medium
            </Button>
            <Button {...args} size="lg">
                Large
            </Button>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const heights = ["Small", "Medium", "Large"].map(
            (name) =>
                canvas.getByRole("button", { name }).getBoundingClientRect()
                    .height
        );
        await expect(heights[0]).toBeLessThan(heights[1]);
        await expect(heights[1]).toBeLessThan(heights[2]);
    },
};

export const IconOnly: Story = {
    args: { icon: true, "aria-label": "Add", children: <Plus size={16} /> },
    play: async ({ args, canvasElement }) => {
        const button = within(canvasElement).getByRole("button", {
            name: "Add",
        });
        const { width, height } = button.getBoundingClientRect();
        await expect(width).toBe(height);

        await userEvent.click(button);
        await expect(args.onPress).toHaveBeenCalledTimes(1);
    },
};

export const Disabled: Story = {
    args: { isDisabled: true },
    play: async ({ args, canvasElement }) => {
        const button = within(canvasElement).getByRole("button", {
            name: "Save",
        });

        await expect(button).toBeDisabled();
        await userEvent.click(button);
        await expect(args.onPress).not.toHaveBeenCalled();
    },
};
