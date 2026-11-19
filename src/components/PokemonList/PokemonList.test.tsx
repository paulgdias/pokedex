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

// measured on the grid's row wrappers: the card itself lifts on hover, which
// would move it off its neighbours' top edge
const columns = (screen: Screen) => {
    const rows = [
        ...screen.container.querySelectorAll<HTMLElement>(".pokemonCard"),
    ].map((c) => c.closest<HTMLElement>('[role="row"]') as HTMLElement);
    const top = rows[0].getBoundingClientRect().top;
    return rows.filter((r) => r.getBoundingClientRect().top === top).length;
};

// virtualizing, scrolling to the top, the empty and loading states and the
// scroll button switch are covered by the stories; Enter is PokemonCard's
describe("PokemonList", () => {
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

        const narrow = await setup({ pokemon: makeDex(40), width: 500 });
        await expect.element(card(narrow, "mon-1")).toBeVisible();
        expect(columns(narrow)).toBe(2);
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
        expect(root.classList.contains("-mr-5")).toBe(false);
    });
});
