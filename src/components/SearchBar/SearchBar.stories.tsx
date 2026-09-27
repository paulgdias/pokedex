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
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const search = canvas.getByRole("combobox", { name: "Search Pokémon" });
        await expect(search).toHaveAttribute("aria-expanded", "false");

        await userEvent.type(search, "fi");
        await expect(args.onTextChange).toHaveBeenLastCalledWith("fi");
        await expect(search).toHaveAttribute("aria-expanded", "true");
        const options = within(canvas.getByRole("listbox")).getAllByRole(
            "option"
        );
        await expect(options.map((option) => option.textContent)).toEqual([
            "Firetype",
            "Fightingtype",
        ]);

        await userEvent.keyboard("{ArrowDown}{ArrowDown}");
        await expect(search).toHaveAttribute(
            "aria-activedescendant",
            "pokedex-suggestion-1"
        );
        await expect(options[1]).toHaveAttribute("aria-selected", "true");

        await userEvent.keyboard("{Enter}");
        // picking applies the filter and clears the text
        await expect(args.onFiltersChange).toHaveBeenLastCalledWith({
            types: ["fighting"],
            text: "",
        });
        await expect(canvas.queryByRole("listbox")).toBeNull();
        await expect(
            canvas.getByRole("button", { name: "Remove filter Type Fighting" })
        ).toBeVisible();
    },
};

export const SuggestsPokemon: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(
            canvas.getByRole("combobox", { name: "Search Pokémon" }),
            "mew"
        );
        const options = within(canvas.getByRole("listbox")).getAllByRole(
            "option"
        );
        await expect(options).toHaveLength(2);
        await expect(options[0]).toHaveTextContent("#0150");
        await expect(options[0]).toHaveTextContent("mewtwo");

        await userEvent.click(options[1]);
        await expect(args.onFiltersChange).toHaveBeenLastCalledWith({
            text: "mew",
            generation: null,
            category: null,
            types: [],
        });
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
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.selectOptions(
            canvas.getByRole("combobox", { name: /Sort/ }),
            "Name Z–A"
        );
        await expect(args.onSortChange).toHaveBeenLastCalledWith({
            key: "name",
            direction: "desc",
        });

        await userEvent.click(canvas.getByRole("radio", { name: "List view" }));
        await expect(args.onViewChange).toHaveBeenLastCalledWith("list");
        await expect(
            canvas.getByRole("radio", { name: "List view" })
        ).toBeChecked();
    },
};

export const FiltersByCategory: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("radio", { name: "Legendary" }));
        await expect(args.onFiltersChange).toHaveBeenLastCalledWith({
            category: "legendary",
        });
        await expect(canvas.getByText("1")).toBeVisible();

        await userEvent.click(canvas.getByRole("radio", { name: "All" }));
        await expect(args.onFiltersChange).toHaveBeenLastCalledWith({
            category: null,
        });
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
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("3")).toBeVisible();
        await userEvent.click(
            canvas.getByRole("button", { name: "Clear all" })
        );
        await expect(args.onClearAll).toHaveBeenCalledTimes(1);
        await expect(
            canvas.queryByRole("button", { name: "Clear all" })
        ).toBeNull();
        await expect(
            canvas.getByRole("combobox", { name: "Search Pokémon" })
        ).toHaveValue("");
    },
};

export const TypePopover: Story = {
    play: async ({ args, canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole("button", { name: "Type" })
        );
        const dialog = await screen.findByRole("dialog", {
            name: "Filter by type",
        });
        await userEvent.click(
            within(dialog).getByRole("button", { name: "Fire" })
        );
        await expect(args.onFiltersChange).toHaveBeenLastCalledWith({
            types: ["fire"],
        });
    },
};
