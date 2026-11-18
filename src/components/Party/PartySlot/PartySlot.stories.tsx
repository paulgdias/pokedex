import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";

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
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("Slot 1")).toBeVisible();
        await expect(canvas.getByText("bulbasaur")).toBeVisible();
        await expect(canvas.getByText("#0001")).toBeVisible();
        await expect(canvas.getByText("grass")).toBeVisible();
        await expect(canvas.getByText("poison")).toBeVisible();
        // the sprite is decorative: the name is right beside it
        const sprite = canvasElement.querySelector("img");
        await expect(sprite).toBeVisible();
        await expect(sprite).toHaveAttribute("alt", "");
        await expect(
            canvas.getByRole("button", { name: "Remove bulbasaur" })
        ).toBeVisible();
        await expect(canvas.queryByRole("combobox")).toBeNull();
    },
};

export const Empty: Story = {
    args: { index: 1, pokemon: null },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("Slot 2")).toBeVisible();
        await expect(
            canvas.getByRole("combobox", { name: "Slot 2 Pokémon" })
        ).toBeVisible();
        await expect(canvas.queryByRole("button")).toBeNull();
    },
};
