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
        const [card] = canvas.getAllByRole("listitem");
        await expect(canvas.getAllByRole("listitem")).toHaveLength(1);
        // a card: sprite, dex number, name and type pills
        const sprite = card.querySelector("img");
        await expect(sprite).toBeVisible();
        await expect(sprite).toHaveAttribute("alt", "");
        await expect(within(card).getByText("#0025")).toBeVisible();
        await expect(within(card).getByText("pikachu")).toBeVisible();
        await expect(within(card).getByText("electric")).toBeVisible();
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
