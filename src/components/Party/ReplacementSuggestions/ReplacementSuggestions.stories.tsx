import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import {
    bulbasaur,
    CHARMANDER,
    DEX,
    EFFICACY,
    PIKACHU,
} from "../../__fixtures__/pokemon";
import ReplacementSuggestions from ".";

const meta = {
    title: "Party/ReplacementSuggestions",
    component: ReplacementSuggestions,
    args: {
        party: [bulbasaur, CHARMANDER],
        allPokemon: [...DEX, PIKACHU],
        efficacy: EFFICACY,
    },
    decorators: [
        (Story) => (
            <div className="max-w-3xl bg-paper p-6">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof ReplacementSuggestions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("heading", { name: "Suggested replacement" })
        ).toBeVisible();
        // squirtle would trade bulbasaur's water for fire: no net gain
        await expect(canvas.getAllByRole("listitem")).toHaveLength(1);
        await expect(canvas.getByText("pikachu")).toBeVisible();
    },
};

export const Hidden: Story = {
    args: { party: [bulbasaur] },
    play: async ({ canvasElement }) => {
        // a single member has nothing to compare against
        await expect(
            within(canvasElement).queryByRole("heading")
        ).not.toBeInTheDocument();
    },
};
