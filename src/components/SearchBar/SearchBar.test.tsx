import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { EMPTY_FILTERS, PokedexFilters } from "@utils/search";
import { DEFAULT_SORT } from "@utils/sort";

import { DEX, makeDex } from "../__fixtures__/pokemon";
import SearchBarHarness from "../__fixtures__/SearchBarHarness";

type Props = Parameters<typeof SearchBarHarness>[0];

const setup = async (props: Props = {}) => {
    const spies = {
        onFiltersChange: vi.fn(),
        onTextChange: vi.fn(),
        onClearAll: vi.fn(),
        onSortChange: vi.fn(),
        onViewChange: vi.fn(),
    };
    const screen = await render(<SearchBarHarness {...spies} {...props} />);
    const search = screen.getByRole("combobox", { name: "Search Pokémon" });
    return { screen, search, ...spies };
};

const withFilters = (filters: Partial<PokedexFilters>) => ({
    initialFilters: { ...EMPTY_FILTERS, ...filters },
});

// the sort and generation selects also contain <option>s
const suggestions = (screen: Awaited<ReturnType<typeof render>>) =>
    screen.getByRole("listbox", { name: "Suggestions" }).getByRole("option");

const optionTexts = (screen: Awaited<ReturnType<typeof render>>) =>
    suggestions(screen)
        .elements()
        .map((option) => option.textContent);

describe("SearchBar search box", () => {
    it("reports every change and reflects the text", async () => {
        const { search, onTextChange } = await setup();

        await search.fill("mew");

        expect(onTextChange).toHaveBeenLastCalledWith("mew");
        await expect.element(search).toHaveValue("mew");
    });

    it("shows no suggestions until something is typed", async () => {
        const { screen, search } = await setup();
        await search.click();
        expect(screen.getByRole("listbox").query()).toBeNull();
        await expect.element(search).toHaveAttribute("aria-expanded", "false");
    });

    it("suggests filters (types, generations, categories) for two or more characters", async () => {
        const { screen, search } = await setup();

        await search.fill("f");
        // one character: no filter suggestions, only names containing it
        expect(optionTexts(screen).some((text) => text?.includes("type"))).toBe(
            false
        );

        await search.fill("fi");
        expect(optionTexts(screen)).toEqual(["Firetype", "Fightingtype"]);

        await search.fill("kan");
        expect(optionTexts(screen)).toEqual(["KantoGen I"]);

        await search.fill("gen 2");
        expect(optionTexts(screen)).toEqual(["JohtoGen II"]);

        await search.fill("myth");
        expect(optionTexts(screen)).toEqual(["Mythicalonly"]);
    });

    it("does not re-suggest filters that are already applied", async () => {
        const { screen, search } = await setup(
            withFilters({
                types: ["fire"],
                generation: 1,
                category: "legendary",
            })
        );
        await search.fill("fi");
        expect(optionTexts(screen)).toEqual(["Fightingtype"]);
        await search.fill("kan");
        expect(suggestions(screen).query()).toBeNull();
        await search.fill("leg");
        expect(suggestions(screen).query()).toBeNull();
    });

    it("suggests pokémon by name or number, with number and types", async () => {
        const { screen, search } = await setup();

        await search.fill("mew");
        expect(optionTexts(screen)).toEqual([
            "#0150mewtwopsychic",
            "#0151mewpsychic",
        ]);

        await search.fill("#7");
        expect(optionTexts(screen)).toEqual(["#0007squirtlewater"]);
    });

    it("caps pokémon suggestions at five", async () => {
        const { screen, search } = await setup({ pokemon: makeDex(10) });
        await search.fill("mon");
        expect(suggestions(screen).elements()).toHaveLength(5);
    });

    it("says when nothing matches", async () => {
        const { screen, search } = await setup();
        await search.fill("zzz");
        await expect
            .element(screen.getByText("No matches for “zzz”"))
            .toBeVisible();
    });

    it("applies a filter suggestion and clears the text", async () => {
        const { screen, search, onFiltersChange } = await setup();
        await search.fill("fi");

        await page.getByRole("option", { name: /Fire/ }).click();

        expect(onFiltersChange).toHaveBeenCalledExactlyOnceWith({
            types: ["fire"],
            text: "",
        });
        await expect.element(search).toHaveValue("");
        expect(screen.getByRole("listbox").query()).toBeNull();
    });

    it("picking a pokémon searches its name and drops the other filters", async () => {
        const { search, onFiltersChange } = await setup(
            withFilters({
                generation: 1,
                types: ["water"],
                category: "mythical",
            })
        );
        await search.fill("mew");

        await page.getByRole("option", { name: /mewtwo/ }).click();

        expect(onFiltersChange).toHaveBeenCalledExactlyOnceWith({
            text: "mewtwo",
            generation: null,
            category: null,
            types: [],
        });
    });

    it("walks the suggestions with the arrow keys and stays in range", async () => {
        const { screen, search } = await setup();
        await search.fill("mew");

        await userEvent.keyboard("{ArrowDown}");
        await expect
            .element(search)
            .toHaveAttribute("aria-activedescendant", "pokedex-suggestion-0");

        await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
        await expect
            .element(search)
            .toHaveAttribute("aria-activedescendant", "pokedex-suggestion-1");
        expect(
            screen
                .getByRole("option")
                .elements()[1]
                .getAttribute("aria-selected")
        ).toBe("true");

        await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
        expect(search.element().hasAttribute("aria-activedescendant")).toBe(
            false
        );
    });

    it("picks the highlighted suggestion with Enter", async () => {
        const { search, onFiltersChange } = await setup();
        await search.fill("mew");

        await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");

        expect(onFiltersChange).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({ text: "mew" })
        );
    });

    it("Enter without a highlighted suggestion just closes the list", async () => {
        const { screen, search, onFiltersChange } = await setup();
        await search.fill("mew");

        await userEvent.keyboard("{Enter}");

        expect(onFiltersChange).not.toHaveBeenCalled();
        expect(screen.getByRole("listbox").query()).toBeNull();
    });

    it("closes the list on Escape (the browser also clears a search field)", async () => {
        const { screen, search } = await setup();
        await search.fill("mew");
        await expect.element(screen.getByRole("listbox")).toBeVisible();

        await userEvent.keyboard("{Escape}");

        expect(screen.getByRole("listbox").query()).toBeNull();
        await expect.element(search).toHaveAttribute("aria-expanded", "false");
    });

    it("ArrowDown reopens a list that was closed by picking nothing", async () => {
        const { screen, search } = await setup(withFilters({ text: "mew" }));
        expect(screen.getByRole("listbox").query()).toBeNull();
        (search.element() as HTMLElement).focus();
        await userEvent.keyboard("{ArrowDown}");
        await expect.element(screen.getByRole("listbox")).toBeVisible();
    });

    it("closes the list when the box loses focus", async () => {
        const { screen, search } = await setup();
        await search.fill("mew");

        await userEvent.tab();

        expect(screen.getByRole("listbox").query()).toBeNull();
    });

    it("reopens on focus when there is text", async () => {
        const { screen, search } = await setup(withFilters({ text: "mew" }));
        expect(screen.getByRole("listbox").query()).toBeNull();

        await search.click();

        await expect.element(screen.getByRole("listbox")).toBeVisible();
    });

    it("clears the text from the clear button, only when there is text", async () => {
        const { screen, search, onTextChange } = await setup();
        expect(
            screen.getByRole("button", { name: "Clear search" }).query()
        ).toBeNull();

        await search.fill("mew");
        await screen.getByRole("button", { name: "Clear search" }).click();

        expect(onTextChange).toHaveBeenLastCalledWith("");
        await expect.element(search).toHaveValue("");
    });
});

describe("SearchBar toolbar", () => {
    it("shows the result count", async () => {
        const { screen } = await setup(withFilters({ category: "legendary" }));
        await expect
            .element(screen.getByText("shown"))
            .toHaveTextContent("1 shown");
    });

    it("offers the four sorts and reports the chosen one", async () => {
        const { screen, onSortChange } = await setup();
        const select = screen.getByRole("combobox", { name: /Sort/ });
        const options = select.getByRole("option").elements();
        expect(options.map((option) => option.textContent)).toEqual([
            "Number Asc",
            "Number Desc",
            "Name A–Z",
            "Name Z–A",
        ]);

        await userEvent.selectOptions(select, "Name Z–A");

        expect(onSortChange).toHaveBeenCalledExactlyOnceWith({
            key: "name",
            direction: "desc",
        });
    });

    it("adds an option for a sort chosen elsewhere (list-view headers)", async () => {
        const { screen } = await setup({
            initialSort: { key: "total", direction: "desc" },
        });
        const select = screen.getByRole("combobox", { name: /Sort/ });
        await expect.element(select).toHaveValue("total:desc");
        expect(select.getByRole("option").elements()[0].textContent).toBe(
            "Total stats High–Low"
        );
    });

    it("mirrors the active sort in its icon", async () => {
        const az = await setup({
            initialSort: { key: "name", direction: "asc" },
        });
        expect(
            az.screen.container.querySelector("svg.lucide-arrow-down-a-z")
        ).not.toBeNull();
        await az.screen.unmount();

        const other = await setup({
            initialSort: { key: "total", direction: "asc" },
        });
        expect(
            other.screen.container.querySelector("svg.lucide-arrow-up-down")
        ).not.toBeNull();
    });

    it("ignores a sort value it does not know", async () => {
        const { screen, onSortChange } = await setup({
            initialSort: DEFAULT_SORT,
        });
        const select = screen
            .getByRole("combobox", { name: /Sort/ })
            .element() as HTMLSelectElement;
        const stray = document.createElement("option");
        stray.value = "bogus:asc";
        select.append(stray);

        await userEvent.selectOptions(select, "bogus:asc");

        expect(onSortChange).not.toHaveBeenCalled();
    });

    it("switches between card and list view", async () => {
        const { screen, onViewChange } = await setup();
        await expect
            .element(screen.getByRole("radio", { name: "Card view" }))
            .toBeChecked();

        await screen.getByRole("radio", { name: "List view" }).click();

        expect(onViewChange).toHaveBeenCalledExactlyOnceWith("list");
        await expect
            .element(screen.getByRole("radio", { name: "List view" }))
            .toBeChecked();
    });

    it("filters by category and back to all", async () => {
        const { screen, onFiltersChange } = await setup();
        await expect
            .element(screen.getByRole("radio", { name: "All" }))
            .toBeChecked();

        await screen.getByRole("radio", { name: "Mythical" }).click();
        expect(onFiltersChange).toHaveBeenLastCalledWith({
            category: "mythical",
        });

        await screen.getByRole("radio", { name: "All" }).click();
        expect(onFiltersChange).toHaveBeenLastCalledWith({ category: null });
    });

    it("picks a generation from the dropdown (small screens) and resets it", async () => {
        const { screen, onFiltersChange } = await setup();
        const gen = screen.getByRole("combobox", { name: "Gen", exact: true });
        await expect.element(gen).toHaveValue("0");

        await userEvent.selectOptions(gen, "9");
        expect(onFiltersChange).toHaveBeenLastCalledWith({ generation: 9 });

        await userEvent.selectOptions(gen, "0");
        expect(onFiltersChange).toHaveBeenLastCalledWith({ generation: null });
    });

    it("selects the current generation in the dropdown", async () => {
        const { screen } = await setup(withFilters({ generation: 3 }));
        await expect
            .element(screen.getByRole("combobox", { name: "Gen", exact: true }))
            .toHaveValue("3");
    });

    it("opens the type filter and applies a type", async () => {
        const { screen, onFiltersChange } = await setup();
        await screen.getByRole("button", { name: "Type" }).click();

        await page
            .getByRole("dialog", { name: "Filter by type" })
            .getByRole("button", { name: "Ghost" })
            .click();

        expect(onFiltersChange).toHaveBeenCalledExactlyOnceWith({
            types: ["ghost"],
        });
    });

    it("lists active filters as chips and clears them all", async () => {
        const { screen, onClearAll } = await setup(
            withFilters({ generation: 1, types: ["grass"] })
        );
        await expect
            .element(
                screen.getByRole("button", { name: "Remove filter Type Grass" })
            )
            .toBeVisible();

        await screen.getByRole("button", { name: "Clear all" }).click();

        expect(onClearAll).toHaveBeenCalledOnce();
        expect(
            screen.getByRole("button", { name: "Clear all" }).query()
        ).toBeNull();
    });

    it("keeps the suggestions independent of the current filters", async () => {
        const { screen, search } = await setup({
            ...withFilters({ types: ["water"] }),
            pokemon: DEX,
        });
        await search.fill("mew");
        expect(optionTexts(screen)).toHaveLength(2);
    });
});
