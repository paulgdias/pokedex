import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { PokemonDetails } from "@customTypes/PokemonTypes";

import { makeDex } from "../__fixtures__/pokemon";
import TestRouter from "../__fixtures__/router";
import PokemonList from ".";

type Props = Parameters<typeof PokemonList>[0];

const Frame = ({ width = 820, ...props }: Props & { width?: number }) => (
    <TestRouter initialEntries={["/pokedex?q=mon"]}>
        <div
            className="flex flex-col"
            style={{ height: 560, width, padding: 16 }}
        >
            <PokemonList {...props} />
        </div>
    </TestRouter>
);

const setup = async (props: Props & { width?: number }) =>
    render(<Frame {...props} />);

type Screen = Awaited<ReturnType<typeof render>>;

const card = (screen: Screen, name: string) =>
    screen.getByLabelText(`Pokemon Card for ${name}`, { exact: true });

const columns = (screen: Screen) => {
    const cards = [
        ...screen.container.querySelectorAll<HTMLElement>(".pokemonCard"),
    ];
    const top = cards[0].getBoundingClientRect().top;
    return cards.filter((c) => c.getBoundingClientRect().top === top).length;
};

describe("PokemonList", () => {
    it("shows the first cards and virtualizes the rest", async () => {
        const screen = await setup({ pokemon: makeDex(60) });
        await expect.element(card(screen, "mon-1")).toBeVisible();
        expect(card(screen, "mon-60").query()).toBeNull();
        expect(
            screen.container.querySelectorAll(".pokemonCard").length
        ).toBeLessThan(30);
    });

    it("renders each pokémon as a link card with its data", async () => {
        const screen = await setup({ pokemon: makeDex(4) });
        await expect
            .element(screen.getByRole("link", { name: "Navigate to mon-1" }))
            .toHaveAttribute("href", "/pokedex/mon-1");
        expect(screen.getByRole("link").elements().length).toBe(4);
    });

    it("flags legendary and mythical pokémon on their cards", async () => {
        const dex: PokemonDetails[] = [
            { ...makeDex(1)[0], name: "myth", isMythical: true },
            { ...makeDex(2)[1], name: "legend", isLegendary: true },
        ];
        const screen = await setup({ pokemon: dex });
        await expect
            .element(screen.getByRole("img", { name: "Mythical" }))
            .toBeVisible();
        await expect
            .element(screen.getByRole("img", { name: "Legendary" }))
            .toBeVisible();
    });

    it("fits the number of columns to the width", async () => {
        const wide = await setup({ pokemon: makeDex(40), width: 1000 });
        await expect.element(card(wide, "mon-1")).toBeVisible();
        expect(columns(wide)).toBe(4);
        await wide.unmount();

        const narrow = await setup({ pokemon: makeDex(40), width: 460 });
        await expect.element(card(narrow, "mon-1")).toBeVisible();
        expect(columns(narrow)).toBe(2);
    });

    it("uses fewer columns than the layout allows when there are few pokémon", async () => {
        const screen = await setup({ pokemon: makeDex(2), width: 1000 });
        await expect.element(card(screen, "mon-1")).toBeVisible();
        expect(columns(screen)).toBe(2);
    });

    it("renders nothing for an empty list", async () => {
        const screen = await setup({ pokemon: [] });
        expect(screen.getByRole("grid").query()).toBeNull();
        expect(screen.getByRole("button").query()).toBeNull();
    });

    it("shows aria-hidden placeholders instead of cards while loading", async () => {
        const screen = await setup({ pokemon: makeDex(6), isLoading: true });
        await expect
            .poll(
                () =>
                    screen.container.querySelectorAll(
                        '[role="gridcell"] > [aria-hidden="true"]'
                    ).length
            )
            .toBeGreaterThan(0);
        expect(screen.getByLabelText(/Pokemon Card for/).query()).toBeNull();
    });

    it("keeps an empty list while loading blank", async () => {
        const screen = await setup({ pokemon: [], isLoading: true });
        expect(screen.container.querySelectorAll(".pokemonCard")).toHaveLength(
            0
        );
    });

    it("navigates to a pokémon, remembering the list's filters", async () => {
        const screen = await setup({ pokemon: makeDex(6) });

        await card(screen, "mon-3").click();

        await expect
            .element(screen.getByTestId("location"))
            .toHaveAttribute("data-pathname", "/pokedex/mon-3");
        await expect
            .element(screen.getByTestId("location"))
            .toHaveAttribute("data-previous", "/pokedex?q=mon");
    });

    it("navigates on Enter from the keyboard", async () => {
        const screen = await setup({ pokemon: makeDex(6) });
        (card(screen, "mon-2").element() as HTMLElement).focus();

        await (await import("vitest/browser")).userEvent.keyboard("{Enter}");

        await expect
            .element(screen.getByTestId("location"))
            .toHaveAttribute("data-pathname", "/pokedex/mon-2");
    });

    it("prefers an explicit `previous`", async () => {
        const screen = await setup({
            pokemon: makeDex(6),
            previous: "/pokedex?type=fire",
        });

        await card(screen, "mon-1").click();

        await expect
            .element(screen.getByTestId("location"))
            .toHaveAttribute("data-previous", "/pokedex?type=fire");
    });

    it("scrolls down to later pokémon", async () => {
        const screen = await setup({ pokemon: makeDex(60) });
        const grid = screen.getByRole("grid").element();

        grid.scrollTop = grid.scrollHeight;

        await expect.element(card(screen, "mon-60")).toBeVisible();
    });

    it("has a button that scrolls back to the top", async () => {
        const screen = await setup({ pokemon: makeDex(60) });
        const grid = screen.getByRole("grid").element();
        grid.scrollTop = grid.scrollHeight;
        await expect.element(card(screen, "mon-60")).toBeVisible();

        await screen.getByRole("button", { name: "Go to Top of Page" }).click();

        await expect.poll(() => grid.scrollTop).toBe(0);
    });

    it("hides the scroll button when scrollToPosition is off", async () => {
        const screen = await setup({
            pokemon: makeDex(60),
            scrollToPosition: false,
        });
        await expect.element(card(screen, "mon-1")).toBeVisible();
        expect(screen.getByRole("button").query()).toBeNull();
    });

    it("returns to the top when the list changes", async () => {
        const screen = await setup({ pokemon: makeDex(60) });
        const grid = screen.getByRole("grid").element();
        grid.scrollTop = grid.scrollHeight;
        await expect.element(card(screen, "mon-60")).toBeVisible();

        await screen.rerender(<Frame pokemon={makeDex(59)} />);

        await expect.poll(() => grid.scrollTop).toBe(0);
    });

    it("merges className over its defaults", async () => {
        const screen = await setup({ pokemon: makeDex(4), className: "-mr-0" });
        const root = screen.container.querySelector(".flex-1") as HTMLElement;
        expect(root.classList.contains("-mr-0")).toBe(true);
        expect(root.classList.contains("-mr-4")).toBe(false);
    });
});
