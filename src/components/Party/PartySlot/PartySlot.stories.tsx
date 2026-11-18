import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { bulbasaur, DEX } from "../../__fixtures__/pokemon";
import PartySlot from ".";

const meta = {
    title: "Party/PartySlot",
    component: PartySlot,
    args: {
        index: 0,
        pokemon: bulbasaur,
        allPokemon: DEX,
        selectedIds: [1],
        onSet: fn(),
    },
    decorators: [
        (Story) => (
            <div className="h-72 w-72 bg-paper p-6">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof PartySlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("bulbasaur")).toBeVisible();
        await userEvent.click(
            canvas.getByRole("button", { name: "Remove bulbasaur" })
        );
        await expect(args.onSet).toHaveBeenCalledWith(null);
    },
};

export const Empty: Story = {
    args: { index: 1, pokemon: null },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole("combobox", {
                name: "Slot 2 Pokémon",
            })
        ).toBeVisible();
    },
};
