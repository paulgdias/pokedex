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

describe("FilterChips", () => {
    it("renders nothing without active filters", async () => {
        const { screen } = await setup({});
        expect(screen.container.innerHTML).toBe("");
    });

    it("ignores whitespace-only search text", async () => {
        const { screen } = await setup({ text: "   " });
        expect(screen.container.innerHTML).toBe("");
    });

    it("shows one chip per filter with a readable label", async () => {
        const { screen } = await setup({
            text: " pika ",
            generation: 2,
            types: ["fire", "water"],
            category: "mythical",
        });
        const names = screen
            .getByRole("button")
            .elements()
            .map((button) => button.getAttribute("aria-label") ?? "Clear all");
        expect(names).toEqual([
            "Remove filter Gen II · Johto",
            "Remove filter Type Fire",
            "Remove filter Type Water",
            "Remove filter Only Mythical",
            "Remove filter Search “pika”",
            "Clear all",
        ]);
    });

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
