import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";

import FilterChips from ".";

const meta = {
    title: "Pokedex/SearchBar/FilterChips",
    component: FilterChips,
    args: {
        filters: {
            text: " saur ",
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

export const ShowsActiveFilters: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // one chip per filter, in a fixed order, each named for what it removes
        await expect(
            canvas
                .getAllByRole("button")
                .map((button) => button.getAttribute("aria-label") ?? "")
        ).toEqual([
            "Remove filter Gen I · Kanto",
            "Remove filter Type Grass",
            "Remove filter Type Poison",
            "Remove filter Only Legendary",
            "Remove filter Search “saur”",
            "",
        ]);
        await expect(canvas.getByText("Clear all")).toBeVisible();
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
