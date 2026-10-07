import { afterEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import { PokemonDetails } from "@customTypes/PokemonTypes";
import { SortState } from "@customTypes/SortingTypes";

import {
    bulbasaur,
    DEX,
    makeDex,
    makePokemon,
} from "../../__fixtures__/pokemon";
import TestRouter from "../../__fixtures__/router";
import PokemonTable from ".";

type Screen = Awaited<ReturnType<typeof render>>;

const setup = async ({
    pokemon = DEX,
    sort = { key: "id", direction: "asc" },
    previous,
}: {
    pokemon?: PokemonDetails[];
    sort?: SortState;
    previous?: string;
} = {}) => {
    const onSortChange = vi.fn();
    const table = (list: PokemonDetails[]) => (
        <TestRouter initialEntries={["/pokedex?view=list"]}>
            <div className="flex flex-col" style={{ height: 560, width: 900 }}>
                <PokemonTable
                    pokemon={list}
                    sort={sort}
                    onSortChange={onSortChange}
                    previous={previous}
                />
            </div>
        </TestRouter>
    );
    const screen = await render(table(pokemon));
    return { screen, onSortChange, table };
};

const header = (screen: Screen, name: string) =>
    screen.getByRole("columnheader", { name, exact: true });

afterEach(async () => {
    await page.viewport(414, 896);
});

describe("PokemonTable structure", () => {
    it("is a labelled table with a row per pokémon plus the header", async () => {
        const { screen } = await setup();
        const table = screen.getByRole("table", { name: "Pokémon" });
        await expect
            .element(table)
            .toHaveAttribute("aria-rowcount", String(DEX.length + 1));
    });

    it("shows number, name link, types and total in each row", async () => {
        const { screen } = await setup({ pokemon: [bulbasaur] });
        const link = screen.getByRole("link", { name: "bulbasaur" });
        await expect
            .element(link)
            .toHaveAttribute("href", "/pokedex/bulbasaur");
        const row = link.element().closest('[role="row"]') as HTMLElement;
        expect(row.getAttribute("aria-rowindex")).toBe("2");
        const cells = [...row.querySelectorAll('[role="cell"]')].map(
            (cell) => cell.textContent
        );
        expect(cells[0]).toBe("#0001");
        expect(cells[2]).toBe("grasspoison");
        expect(cells.at(-1)).toBe("318");
    });

    it("shows the six stats in order, with a dash when one is missing", async () => {
        const { screen } = await setup({
            pokemon: [makePokemon({ stats: [10, 20], statTotal: 30 })],
        });
        const row = screen.getByRole("row").elements()[1];
        const cells = [...row.querySelectorAll('[role="cell"]')].map(
            (cell) => cell.textContent
        );
        expect(cells.slice(3, 9)).toEqual(["10", "20", "—", "—", "—", "—"]);
    });

    it("draws a thumbnail only for pokémon with artwork", async () => {
        const { screen } = await setup({
            pokemon: [
                bulbasaur,
                makePokemon({ id: 2, name: "blank", sprite: "" }),
            ],
        });
        const rows = screen.getByRole("row").elements().slice(1);
        expect(rows[0].querySelectorAll("img")).toHaveLength(1);
        expect(rows[1].querySelectorAll("img")).toHaveLength(0);
    });

    it("hides the stat columns on small screens and shows them from md up", async () => {
        const { screen } = await setup();
        const hp = screen.getByRole("columnheader", {
            name: "HP",
            includeHidden: true,
        });
        expect(getComputedStyle(hp.element()).display).toBe("none");

        await page.viewport(1024, 800);

        await expect.element(header(screen, "HP")).toBeVisible();
        await expect.element(header(screen, "Spe")).toBeVisible();
    });

    it("virtualizes long lists", async () => {
        const { screen } = await setup({ pokemon: makeDex(120) });
        await expect
            .element(screen.getByRole("link", { name: "mon-1", exact: true }))
            .toBeVisible();
        expect(
            screen.getByRole("link", { name: "mon-120", exact: true }).query()
        ).toBeNull();
    });
});

describe("PokemonTable sorting", () => {
    it("marks only the sorted column, with its direction", async () => {
        const { screen } = await setup({
            sort: { key: "name", direction: "desc" },
        });
        await expect
            .element(header(screen, "Pokémon"))
            .toHaveAttribute("aria-sort", "descending");
        await expect
            .element(header(screen, "#"))
            .toHaveAttribute("aria-sort", "none");
        await expect
            .element(header(screen, "Pokémon"))
            .toHaveTextContent("Pokémon");
    });

    it("shows a direction arrow only on the sorted column", async () => {
        const { screen } = await setup({
            sort: { key: "id", direction: "asc" },
        });
        expect(
            header(screen, "#").element().querySelector("svg.lucide-arrow-up")
        ).not.toBeNull();
        expect(
            header(screen, "Pokémon").element().querySelector("svg")
        ).toBeNull();
    });

    it("flips an ascending column to descending", async () => {
        const { screen, onSortChange } = await setup({
            sort: { key: "id", direction: "asc" },
        });
        await header(screen, "#").getByRole("button").click();
        expect(onSortChange).toHaveBeenLastCalledWith({
            key: "id",
            direction: "desc",
        });
    });

    it("flips a descending column back to ascending", async () => {
        const { screen, onSortChange } = await setup({
            sort: { key: "id", direction: "desc" },
        });
        await header(screen, "#").getByRole("button").click();
        expect(onSortChange).toHaveBeenLastCalledWith({
            key: "id",
            direction: "asc",
        });
    });

    it("starts text columns ascending", async () => {
        const { screen, onSortChange } = await setup();
        await header(screen, "Pokémon").getByRole("button").click();
        expect(onSortChange).toHaveBeenLastCalledWith({
            key: "name",
            direction: "asc",
        });
        await header(screen, "Types").getByRole("button").click();
        expect(onSortChange).toHaveBeenLastCalledWith({
            key: "type",
            direction: "asc",
        });
    });

    it("starts numeric columns descending", async () => {
        const { screen, onSortChange } = await setup();
        await header(screen, "Total").getByRole("button").click();
        expect(onSortChange).toHaveBeenLastCalledWith({
            key: "total",
            direction: "desc",
        });
    });

    it("flips a descending numeric column to ascending", async () => {
        const { screen, onSortChange } = await setup({
            sort: { key: "total", direction: "desc" },
        });
        await header(screen, "Total").getByRole("button").click();
        expect(onSortChange).toHaveBeenLastCalledWith({
            key: "total",
            direction: "asc",
        });
    });

    it("sorts by each stat column", async () => {
        await page.viewport(1024, 800);
        const { screen, onSortChange } = await setup();
        const expected = [
            ["HP", "hp"],
            ["Atk", "attack"],
            ["Def", "defense"],
            ["SpA", "specialAttack"],
            ["SpD", "specialDefense"],
            ["Spe", "speed"],
        ];
        for (const [label, key] of expected) {
            await header(screen, label).getByRole("button").click();
            expect(onSortChange).toHaveBeenLastCalledWith({
                key,
                direction: "desc",
            });
        }
    });
});

describe("PokemonTable navigation and scrolling", () => {
    it("opens a pokémon from its name link, remembering the list", async () => {
        const { screen } = await setup();

        await screen.getByRole("link", { name: "mewtwo" }).click();

        await expect
            .element(screen.getByTestId("location"))
            .toHaveAttribute("data-pathname", "/pokedex/mewtwo");
        await expect
            .element(screen.getByTestId("location"))
            .toHaveAttribute("data-previous", "/pokedex?view=list");
    });

    it("prefers an explicit `previous`", async () => {
        const { screen } = await setup({ previous: "/pokedex?gen=1" });

        await screen.getByRole("link", { name: "mew", exact: true }).click();

        await expect
            .element(screen.getByTestId("location"))
            .toHaveAttribute("data-previous", "/pokedex?gen=1");
    });

    it("scrolls back to the top from the button", async () => {
        const { screen } = await setup({ pokemon: makeDex(80) });
        const list = screen.getByRole("rowgroup").element();
        list.scrollTop = list.scrollHeight;
        await expect
            .element(screen.getByRole("link", { name: "mon-80", exact: true }))
            .toBeVisible();

        await screen.getByRole("button", { name: "Go to Top of Page" }).click();

        await expect.poll(() => list.scrollTop).toBe(0);
    });

    it("scrolls to the top when the list changes", async () => {
        const { screen, table } = await setup({ pokemon: makeDex(80) });
        const list = screen.getByRole("rowgroup").element();
        list.scrollTop = list.scrollHeight;
        await expect
            .element(screen.getByRole("link", { name: "mon-80", exact: true }))
            .toBeVisible();

        await screen.rerender(table(makeDex(79)));

        await expect.poll(() => list.scrollTop).toBe(0);
    });
});
