import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { DEX, makeDex } from "../../__fixtures__/pokemon";
import TestRouter from "../../__fixtures__/router";
import PokemonTable from ".";

const meta = {
    title: "Pokedex/PokemonList/PokemonTable",
    component: PokemonTable,
    args: {
        pokemon: DEX,
        sort: { key: "id", direction: "asc" },
        onSortChange: fn(),
    },
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <TestRouter initialEntries={["/pokedex?view=list"]}>
                <div className="flex h-[560px] w-[900px] flex-col p-4">
                    <Story />
                </div>
            </TestRouter>
        ),
    ],
} satisfies Meta<typeof PokemonTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const table = canvas.getByRole("table", { name: "Pokémon" });
        await expect(table).toHaveAttribute(
            "aria-rowcount",
            String(DEX.length + 1)
        );

        const link = await canvas.findByRole("link", { name: "venusaur" });
        const row = link.closest('[role="row"]') as HTMLElement;
        await expect(row).toHaveAttribute("aria-rowindex", "4");
        await expect(within(row).getByText("#0003")).toBeVisible();
        await expect(within(row).getByText("525")).toBeVisible();
        await expect(within(row).getByText("grass")).toBeVisible();
        await expect(link).toHaveAttribute("href", "/pokedex/venusaur");
    },
};

export const SortedDescending: Story = {
    args: { sort: { key: "total", direction: "desc" } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("columnheader", { name: "Total" })
        ).toHaveAttribute("aria-sort", "descending");

        // the active column shows its direction; the others show none
        await expect(
            canvasElement.querySelector(
                '[aria-sort="descending"] svg.lucide-arrow-down'
            )
        ).not.toBeNull();
        await expect(
            canvas.getByRole("columnheader", { name: "#" }).querySelector("svg")
        ).toBeNull();
    },
};

export const LongListScrollsToTop: Story = {
    args: { pokemon: makeDex(80) },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findByRole("link", { name: "mon-1" });
        await expect(canvas.queryByRole("link", { name: "mon-80" })).toBeNull();

        const list = canvas.getByRole("rowgroup");
        list.scrollTop = list.scrollHeight;
        await canvas.findByRole("link", { name: "mon-80" });

        await userEvent.click(
            canvas.getByRole("button", { name: "Go to Top of Page" })
        );
        await waitFor(() => expect(list.scrollTop).toBe(0));
    },
};
