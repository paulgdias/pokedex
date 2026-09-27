import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import FilterChips from ".";

const meta = {
    title: "Pokedex/SearchBar/FilterChips",
    component: FilterChips,
    args: {
        filters: {
            text: "saur",
            generation: 1,
            types: ["grass", "poison"],
            category: "legendary",
        },
        onChange: fn(),
        onClearAll: fn(),
    },
} satisfies Meta<typeof FilterChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RemovesOneFilter: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole("button")).toHaveLength(6);

        await userEvent.click(
            canvas.getByRole("button", { name: "Remove filter Type Poison" })
        );
        await expect(args.onChange).toHaveBeenLastCalledWith({
            types: ["grass"],
        });

        await userEvent.click(
            canvas.getByRole("button", { name: "Remove filter Gen I · Kanto" })
        );
        await expect(args.onChange).toHaveBeenLastCalledWith({
            generation: null,
        });

        await userEvent.click(
            canvas.getByRole("button", { name: "Remove filter Only Legendary" })
        );
        await expect(args.onChange).toHaveBeenLastCalledWith({
            category: null,
        });

        await userEvent.click(
            canvas.getByRole("button", { name: "Remove filter Search “saur”" })
        );
        await expect(args.onChange).toHaveBeenLastCalledWith({ text: "" });
    },
};

export const ClearsAll: Story = {
    play: async ({ args, canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole("button", { name: "Clear all" })
        );
        await expect(args.onClearAll).toHaveBeenCalledTimes(1);
        await expect(args.onChange).not.toHaveBeenCalled();
    },
};

export const NothingToShow: Story = {
    args: {
        filters: { text: "  ", generation: null, types: [], category: null },
    },
    play: async ({ canvasElement }) => {
        // blank search text does not count as a filter
        await expect(canvasElement).toBeEmptyDOMElement();
    },
};
