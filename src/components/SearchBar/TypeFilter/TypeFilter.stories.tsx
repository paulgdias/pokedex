import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";

import { PokemonType } from "@utils/search";

import TypeFilter from ".";

const meta = {
    title: "Pokedex/SearchBar/TypeFilter",
    component: TypeFilter,
    args: { types: [], resultCount: 42, onChange: fn() },
    // room for the popover
    decorators: [
        (Story) => (
            <div className="h-96 w-[480px]">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof TypeFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PicksTypes: Story = {
    render: (args) => {
        const [types, setTypes] = useState<PokemonType[]>(args.types);
        return (
            <TypeFilter
                {...args}
                types={types}
                onChange={(next) => {
                    setTypes(next);
                    args.onChange(next);
                }}
            />
        );
    },
    play: async ({ args, canvasElement }) => {
        const trigger = within(canvasElement).getByRole("button", {
            name: "Type",
        });
        await userEvent.click(trigger);

        // the popover is portalled outside the canvas
        const dialog = await screen.findByRole("dialog", {
            name: "Filter by type",
        });
        await expect(
            within(dialog).getAllByRole("button", { pressed: false })
        ).toHaveLength(18);

        await userEvent.click(
            within(dialog).getByRole("button", { name: "Fire" })
        );
        await expect(args.onChange).toHaveBeenLastCalledWith(["fire"]);
        await userEvent.click(
            within(dialog).getByRole("button", { name: "Water" })
        );
        await expect(args.onChange).toHaveBeenLastCalledWith(["fire", "water"]);
        await expect(
            within(dialog).getByRole("button", { name: "Fire", pressed: true })
        ).toBeVisible();

        // deselecting removes only that type
        await userEvent.click(
            within(dialog).getByRole("button", { name: "Fire" })
        );
        await expect(args.onChange).toHaveBeenLastCalledWith(["water"]);

        await userEvent.click(
            within(dialog).getByRole("button", { name: "Reset" })
        );
        await expect(args.onChange).toHaveBeenLastCalledWith([]);

        await userEvent.click(
            within(dialog).getByRole("button", { name: "Show 42 results" })
        );
        await waitFor(() =>
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        );
    },
};

export const ShowsSelectionCount: Story = {
    args: { types: ["fire", "water", "grass"] },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole("button", { name: /Type\s*3/ })
        ).toBeVisible();
    },
};
