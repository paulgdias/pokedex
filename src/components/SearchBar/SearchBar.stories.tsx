import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, within } from "storybook/test";

import { EMPTY_FILTERS } from "@utils/search";

import SearchBarHarness from "../__fixtures__/SearchBarHarness";

const meta = {
    title: "Pokedex/SearchBar",
    component: SearchBarHarness,
    args: {
        onFiltersChange: fn(),
        onTextChange: fn(),
        onClearAll: fn(),
        onSortChange: fn(),
        onViewChange: fn(),
    },
    parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SearchBarHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SuggestsAndPicksWithKeyboard: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const search = canvas.getByRole("combobox", { name: "Search Pokémon" });
        await expect(search).toHaveAttribute("aria-expanded", "false");

        await userEvent.type(search, "fi");
        await expect(search).toHaveAttribute("aria-expanded", "true");
        const options = within(canvas.getByRole("listbox")).getAllByRole(
            "option"
        );
        await expect(options.map((option) => option.textContent)).toEqual([
            "Firetype",
            "Fightingtype",
        ]);

        // the highlight moves with the arrow keys (the active option is
        // filled), and Enter turns it into a chip and empties the box
        await userEvent.keyboard("{ArrowDown}{ArrowDown}");
        await expect(getComputedStyle(options[1]).backgroundColor).not.toBe(
            getComputedStyle(options[0]).backgroundColor
        );

        await userEvent.keyboard("{Enter}");
        await expect(canvas.queryByRole("listbox")).toBeNull();
        await expect(search).toHaveValue("");
        await expect(
            canvas.getByRole("button", { name: "Remove filter Type Fighting" })
        ).toBeVisible();
    },
};

export const SuggestsPokemon: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(
            canvas.getByRole("combobox", { name: "Search Pokémon" }),
            "mew"
        );
        const options = within(canvas.getByRole("listbox")).getAllByRole(
            "option"
        );
        await expect(options).toHaveLength(2);
        // each shows its number, name and types
        await expect(options[0]).toHaveTextContent("#0150");
        await expect(options[0]).toHaveTextContent("mewtwo");
        await expect(options[0]).toHaveTextContent("psychic");

        await userEvent.click(options[1]);
        await expect(
            canvas.getByRole("combobox", { name: "Search Pokémon" })
        ).toHaveValue("mew");
    },
};

export const NoMatches: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(
            canvas.getByRole("combobox", { name: "Search Pokémon" }),
            "zzz"
        );
        await expect(canvas.getByRole("status")).toHaveTextContent(
            "No matches for “zzz”"
        );
        // nothing to pick: no listbox, and the combobox reads as collapsed
        await expect(canvas.queryByRole("listbox")).toBeNull();
        await expect(
            canvas.getByRole("combobox", { name: "Search Pokémon" })
        ).toHaveAttribute("aria-expanded", "false");
    },
};

export const ChangesSortAndView: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const sort = canvas.getByRole("combobox", { name: /Sort/ });
        await userEvent.selectOptions(sort, "Name Z–A");
        // the select and its leading icon follow the choice
        await expect(sort).toHaveValue("name:desc");
        await expect(
            canvasElement.querySelector("svg.lucide-arrow-down-z-a")
        ).not.toBeNull();

        await userEvent.click(canvas.getByRole("radio", { name: "List view" }));
        await expect(
            canvas.getByRole("radio", { name: "List view" })
        ).toBeChecked();
    },
};

export const FiltersByCategory: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const shown = canvas.getByText("shown");
        await userEvent.click(canvas.getByRole("radio", { name: "Legendary" }));
        await expect(shown).toHaveTextContent("1 shown");
        await expect(
            canvas.getByRole("button", { name: "Remove filter Only Legendary" })
        ).toBeVisible();

        await userEvent.click(canvas.getByRole("radio", { name: "All" }));
        await expect(canvas.getByRole("radio", { name: "All" })).toBeChecked();
    },
};

export const ClearsEverything: Story = {
    args: {
        initialFilters: {
            ...EMPTY_FILTERS,
            text: "saur",
            types: ["grass"],
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("3")).toBeVisible();
        await userEvent.click(
            canvas.getByRole("button", { name: "Clear all" })
        );
        await expect(
            canvas.queryByRole("button", { name: "Clear all" })
        ).toBeNull();
        await expect(
            canvas.getByRole("combobox", { name: "Search Pokémon" })
        ).toHaveValue("");
    },
};

export const TypePopover: Story = {
    play: async ({ canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole("button", { name: "Type" })
        );
        const dialog = await screen.findByRole("dialog", {
            name: "Filter by type",
        });
        await userEvent.click(
            within(dialog).getByRole("button", { name: "Fire" })
        );
        // the choice shows on the trigger's badge and as a chip
        await expect(
            within(canvasElement).getByRole("button", { name: /Type\s*1/ })
        ).toBeVisible();
        await expect(
            within(canvasElement).getByRole("button", {
                name: "Remove filter Type Fire",
            })
        ).toBeVisible();
    },
};
