import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { POKEMON_TYPES, PokemonType } from "@utils/search";

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

describe("TypeFilter", () => {
    it("is closed until the button is pressed", async () => {
        const { screen } = await setup();
        expect(page.getByRole("dialog").query()).toBeNull();

        const dialog = await open(screen);
        await expect.element(dialog).toBeVisible();
    });

    it("lists all 18 types, capitalised, none pressed", async () => {
        const { screen } = await setup();
        const dialog = await open(screen);

        for (const type of POKEMON_TYPES) {
            await expect
                .element(
                    dialog.getByRole("button", {
                        name: type[0].toUpperCase() + type.slice(1),
                        exact: true,
                    })
                )
                .toHaveAttribute("aria-pressed", "false");
        }
    });

    it("marks the selected types as pressed", async () => {
        const { screen } = await setup(["ghost", "dark"]);
        const dialog = await open(screen);

        await expect
            .element(dialog.getByRole("button", { name: "Ghost" }))
            .toHaveAttribute("aria-pressed", "true");
        await expect
            .element(dialog.getByRole("button", { name: "Fire" }))
            .toHaveAttribute("aria-pressed", "false");
    });

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

    it("shows a count badge only when types are selected", async () => {
        const none = await setup([]);
        expect(
            none.screen.getByRole("button", { name: "Type" }).query()
        ).not.toBeNull();
        await none.screen.unmount();

        const some = await setup(["fire", "ice", "dark"]);
        await expect
            .element(some.screen.getByRole("button", { name: "Type 3" }))
            .toBeVisible();
    });
});
