import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, within } from "storybook/test";

import { PokemonDetails } from "@customTypes/PokemonTypes";

import { bulbasaur, DEX } from "../../__fixtures__/pokemon";
import PartySlots from ".";

const meta = {
    title: "Party/PartySlots",
    component: PartySlots,
    args: {
        party: [bulbasaur, null, null, null, null, null],
        allPokemon: DEX,
        onSet: fn(),
    },
    decorators: [
        (Story) => (
            <div className="min-h-[36rem] max-w-4xl bg-paper p-6">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof PartySlots>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The party kept in local state, as the page keeps it in the URL. */
export const BuildsAParty: Story = {
    render: (args) => {
        const [party, setParty] = useState<(PokemonDetails | null)[]>(
            args.party
        );
        return (
            <PartySlots
                {...args}
                party={party}
                onSet={(index, id) => {
                    setParty((current) =>
                        current.map((slot, i) =>
                            i === index
                                ? (DEX.find((p) => p.id === id) ?? null)
                                : slot
                        )
                    );
                    args.onSet(index, id);
                }}
            />
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const list = canvas.getByRole("list", { name: "Party" });
        await expect(within(list).getAllByRole("listitem")).toHaveLength(6);
        // two columns below md (48rem), three from md up
        const columns = window.matchMedia("(min-width: 48rem)").matches ? 3 : 2;
        await expect(
            getComputedStyle(list).gridTemplateColumns.split(" ")
        ).toHaveLength(columns);

        await userEvent.type(
            canvas.getByRole("combobox", { name: "Slot 2 Pokémon" }),
            "char"
        );
        // the suggestions are portalled outside the canvas
        await userEvent.click(
            await screen.findByRole("option", { name: /charmander/ })
        );
        await expect(
            canvas.getByRole("button", { name: "Remove charmander" })
        ).toBeVisible();

        await userEvent.click(
            canvas.getByRole("button", { name: "Remove bulbasaur" })
        );
        await expect(
            canvas.getByRole("combobox", { name: "Slot 1 Pokémon" })
        ).toBeVisible();
    },
};
