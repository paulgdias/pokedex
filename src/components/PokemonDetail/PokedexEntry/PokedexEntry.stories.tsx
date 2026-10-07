import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { makeInfo } from "../../__fixtures__/pokemon";
import PokedexEntry from ".";

const meta = {
    title: "PokemonDetail/PokedexEntry",
    component: PokedexEntry,
    args: { info: makeInfo() },
    decorators: [
        (Story) => (
            <div className="w-96">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof PokedexEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SwitchesGameVersion: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("Seed Pokémon")).toBeVisible();
        // the newest entry first, with PokeAPI's hard line wraps removed
        await expect(
            canvas.getByText("A strange seed was planted on its back at birth.")
        ).toBeVisible();

        await userEvent.selectOptions(canvas.getByLabelText("Game"), "Ruby");
        await expect(
            canvas.getByText("It can go without eating for days.")
        ).toBeVisible();
        await expect(canvas.queryByText(/strange seed/)).toBeNull();
    },
};

export const NoEntries: Story = {
    args: { info: makeInfo({ flavorTexts: [], genus: "" }) },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("No entry available.")).toBeVisible();
        await expect(canvas.queryByLabelText("Game")).toBeNull();
    },
};
