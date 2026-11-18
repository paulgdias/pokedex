import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, within } from "storybook/test";

import { DEX } from "../../__fixtures__/pokemon";
import SlotPicker from ".";

const meta = {
    title: "Party/SlotPicker",
    component: SlotPicker,
    args: { index: 0, allPokemon: DEX, excludedIds: [1], onSelect: fn() },
    // room for the suggestions
    decorators: [
        (Story) => (
            <div className="h-80 w-72 bg-paper p-6">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof SlotPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PicksAPokemon: Story = {
    play: async ({ args, canvasElement }) => {
        const input = within(canvasElement).getByRole("combobox", {
            name: "Slot 1 Pokémon",
        });
        await userEvent.type(input, "saur");
        // bulbasaur is already in the party; the list is portalled
        const options = await screen.findAllByRole("option");
        await expect(options.map((option) => option.textContent)).toEqual([
            "#0002ivysaur",
            "#0003venusaur",
        ]);
        await userEvent.click(options[0]);
        await expect(args.onSelect).toHaveBeenCalledWith(2);
        await expect(input).toHaveValue("");
    },
};
