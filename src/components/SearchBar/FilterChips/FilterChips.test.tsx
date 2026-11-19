import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { EMPTY_FILTERS, PokedexFilters } from "@utils/search";

import FilterChips from ".";

const setup = async (filters: Partial<PokedexFilters>) => {
    const onChange = vi.fn();
    const onClearAll = vi.fn();
    const screen = await render(
        <FilterChips
            filters={{ ...EMPTY_FILTERS, ...filters }}
            onChange={onChange}
            onClearAll={onClearAll}
        />
    );
    return { screen, onChange, onClearAll };
};

// the chip labels and the empty state are covered by the stories
describe("FilterChips", () => {
    it("removes only the clicked type", async () => {
        const { screen, onChange } = await setup({
            types: ["fire", "water", "grass"],
        });

        await screen
            .getByRole("button", { name: "Remove filter Type Water" })
            .click();

        expect(onChange).toHaveBeenCalledExactlyOnceWith({
            types: ["fire", "grass"],
        });
    });

    it.each([
        [
            "Remove filter Gen I · Kanto",
            { generation: 1 },
            { generation: null },
        ],
        [
            "Remove filter Only Legendary",
            { category: "legendary" as const },
            { category: null },
        ],
        ["Remove filter Search “abc”", { text: "abc" }, { text: "" }],
    ])("%s clears just that filter", async (name, filters, patch) => {
        const { screen, onChange } = await setup(filters);

        await screen.getByRole("button", { name }).click();

        expect(onChange).toHaveBeenCalledExactlyOnceWith(patch);
    });

    it("clears everything through onClearAll", async () => {
        const { screen, onChange, onClearAll } = await setup({
            generation: 3,
            types: ["ice"],
        });

        await screen.getByRole("button", { name: "Clear all" }).click();

        expect(onClearAll).toHaveBeenCalledOnce();
        expect(onChange).not.toHaveBeenCalled();
    });
});
