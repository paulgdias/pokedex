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

export const SortsFromHeaders: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("columnheader", { name: "#" })
        ).toHaveAttribute("aria-sort", "ascending");
        await expect(
            canvas.getByRole("columnheader", { name: "Pokémon" })
        ).toHaveAttribute("aria-sort", "none");

        await userEvent.click(canvas.getByRole("button", { name: "#" }));
        await expect(args.onSortChange).toHaveBeenLastCalledWith({
            key: "id",
            direction: "desc",
        });

        await userEvent.click(canvas.getByRole("button", { name: "Pokémon" }));
        await expect(args.onSortChange).toHaveBeenLastCalledWith({
            key: "name",
            direction: "asc",
        });

        // number columns start with the highest
        await userEvent.click(canvas.getByRole("button", { name: "Total" }));
        await expect(args.onSortChange).toHaveBeenLastCalledWith({
            key: "total",
            direction: "desc",
        });
    },
};

export const RowsAndNavigation: Story = {
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

        await userEvent.click(link);
        const location = canvas.getByTestId("location");
        await waitFor(() =>
            expect(location).toHaveAttribute(
                "data-pathname",
                "/pokedex/venusaur"
            )
        );
        await expect(location).toHaveAttribute(
            "data-previous",
            "/pokedex?view=list"
        );
    },
};

export const SortedDescending: Story = {
    args: { sort: { key: "total", direction: "desc" } },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("columnheader", { name: "Total" })
        ).toHaveAttribute("aria-sort", "descending");

        // sorted descending: the next click flips to ascending
        await userEvent.click(canvas.getByRole("button", { name: "Total" }));
        await expect(args.onSortChange).toHaveBeenLastCalledWith({
            key: "total",
            direction: "asc",
        });
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
