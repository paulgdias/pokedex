import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { PokemonType } from "@utils/search";

import TypeFilter from ".";

const setup = async (types: PokemonType[] = [], resultCount = 7) => {
    const onChange = vi.fn();
    const screen = await render(
        <TypeFilter
            types={types}
            resultCount={resultCount}
            onChange={onChange}
        />
    );
    return { screen, onChange };
};

const open = async (screen: Awaited<ReturnType<typeof render>>) => {
    await screen.getByRole("button", { name: /^Type/ }).click();
    return page.getByRole("dialog", { name: "Filter by type" });
};

// the type list, the pressed states and the count badge are covered by the
// stories
describe("TypeFilter", () => {
    it("adds a type to the selection", async () => {
        const { screen, onChange } = await setup(["fire"]);
        const dialog = await open(screen);

        await dialog.getByRole("button", { name: "Water" }).click();

        expect(onChange).toHaveBeenCalledExactlyOnceWith(["fire", "water"]);
    });

    it("removes a type that is already selected", async () => {
        const { screen, onChange } = await setup(["fire", "water"]);
        const dialog = await open(screen);

        await dialog.getByRole("button", { name: "Fire" }).click();

        expect(onChange).toHaveBeenCalledExactlyOnceWith(["water"]);
    });

    it("resets the selection", async () => {
        const { screen, onChange } = await setup(["fire", "water"]);
        const dialog = await open(screen);

        await dialog.getByRole("button", { name: "Reset" }).click();

        expect(onChange).toHaveBeenCalledExactlyOnceWith([]);
    });

    it("closes with the result count in its confirm button", async () => {
        const { screen } = await setup(["fire"], 12);
        const dialog = await open(screen);

        await dialog.getByRole("button", { name: "Show 12 results" }).click();

        await expect.element(dialog).not.toBeInTheDocument();
    });

    it("closes on Escape", async () => {
        const { screen } = await setup();
        const dialog = await open(screen);

        await userEvent.keyboard("{Escape}");

        await expect.element(dialog).not.toBeInTheDocument();
    });
});
