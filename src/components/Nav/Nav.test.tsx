import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import { PokemonDetails } from "@customTypes/PokemonTypes";

import { DEX, makePokemon } from "../__fixtures__/pokemon";
import TestRouter from "../__fixtures__/router";
import Nav from ".";

type Screen = Awaited<ReturnType<typeof render>>;

const setup = async (
    at: string,
    { dex = DEX, width = 1280 }: { dex?: PokemonDetails[]; width?: number } = {}
) => {
    await page.viewport(width, 900);
    const screen = await render(
        <TestRouter initialEntries={[at]} dex={dex}>
            <div className="flex flex-col lg:flex-row">
                <Nav />
            </div>
        </TestRouter>
    );
    await expect
        .element(screen.getByRole("navigation", { name: "Primary" }))
        .toBeVisible();
    return screen;
};

const link = (screen: Screen, name: string | RegExp) =>
    screen.getByRole("link", { name });

afterEach(async () => {
    await page.viewport(414, 896);
});

describe("Nav links", () => {
    it("offers Home, Pokédex, Compare and Type chart", async () => {
        const screen = await setup("/types");
        const names = screen
            .getByRole("navigation", { name: "Primary" })
            .getByRole("link")
            .elements()
            .map((item) => item.textContent);
        expect(names).toEqual(["Home", "Pokédex", "Compare", "Type chart"]);
    });

    it("marks the current page", async () => {
        const screen = await setup("/compare");
        await expect
            .element(link(screen, "Compare"))
            .toHaveAttribute("aria-current", "page");
        await expect
            .element(link(screen, "Pokédex"))
            .not.toHaveAttribute("aria-current");
    });

    it("only marks Home on exactly /", async () => {
        const home = await setup("/");
        await expect
            .element(link(home, "Home"))
            .toHaveAttribute("aria-current", "page");
        await home.unmount();

        const other = await setup("/compare");
        await expect
            .element(link(other, "Home"))
            .not.toHaveAttribute("aria-current");
    });

    it("keeps the Pokédex highlighted on a pokémon's page", async () => {
        const screen = await setup("/pokedex/bulbasaur");
        await expect
            .element(link(screen, "Pokédex"))
            .toHaveAttribute("aria-current", "page");
    });

    it("keeps the query string on the link to the page you are on", async () => {
        const screen = await setup("/pokedex?q=saur&type=grass");
        await expect
            .element(link(screen, "Pokédex"))
            .toHaveAttribute("href", "/pokedex?q=saur&type=grass");
    });

    it("drops the query string on links to other pages", async () => {
        const screen = await setup("/pokedex?q=saur");
        await expect
            .element(link(screen, "Compare"))
            .toHaveAttribute("href", "/compare");
        await expect.element(link(screen, "Home")).toHaveAttribute("href", "/");
    });

    it("navigates when a link is clicked", async () => {
        const screen = await setup("/pokedex?q=saur");

        await link(screen, "Type chart").click();

        await expect
            .element(screen.getByTestId("location"))
            .toHaveAttribute("data-pathname", "/types");
        await expect
            .element(link(screen, "Type chart"))
            .toHaveAttribute("aria-current", "page");
    });

    it("has a theme toggle", async () => {
        const screen = await setup("/");
        await expect
            .element(screen.getByRole("radio", { name: "Dark theme" }))
            .toBeVisible();
    });
});

describe("Nav layout", () => {
    it("shows the sidebar on wide screens, without the top bar", async () => {
        const screen = await setup("/", { width: 1280 });
        expect(
            getComputedStyle(screen.container.querySelector("aside") as Element)
                .display
        ).toBe("flex");
        expect(
            getComputedStyle(
                screen.container.querySelector("header") as Element
            ).display
        ).toBe("none");
        await expect.element(link(screen, "Home")).toHaveTextContent("Home");
    });

    it("shows a compact top bar on narrow screens, with icon-only named links", async () => {
        const screen = await setup("/", { width: 600 });
        expect(
            getComputedStyle(
                screen.container.querySelector("header") as Element
            ).display
        ).toBe("flex");
        expect(
            getComputedStyle(screen.container.querySelector("aside") as Element)
                .display
        ).toBe("none");
        const home = link(screen, "Home");
        await expect.element(home).toBeVisible();
        expect(home.element().textContent).toBe("");
    });

    it("has a theme toggle in the top bar too", async () => {
        const screen = await setup("/", { width: 600 });
        await expect
            .element(screen.getByRole("radio", { name: "Light theme" }))
            .toBeVisible();
    });
});

describe("Nav generations", () => {
    it("lists generations with counts on the Pokédex page", async () => {
        const screen = await setup("/pokedex");
        await expect.element(screen.getByText("Generations")).toBeVisible();
        await expect
            .element(link(screen, /Every region/))
            .toHaveTextContent(String(DEX.length));
        await expect.element(link(screen, /Kanto/)).toHaveTextContent("8");
        await expect.element(link(screen, /Johto/)).toHaveTextContent("1");
        await expect.element(link(screen, /Hoenn/)).toHaveTextContent("1");
        await expect.element(link(screen, /Kalos/)).toHaveTextContent("0");
    });

    it("is not shown outside the Pokédex", async () => {
        const screen = await setup("/compare");
        expect(screen.getByText("Generations").query()).toBeNull();
    });

    it("marks All when no generation is filtered", async () => {
        const screen = await setup("/pokedex");
        await expect
            .element(link(screen, /Every region/))
            .toHaveAttribute("aria-current", "true");
        await expect
            .element(link(screen, /Kanto/))
            .not.toHaveAttribute("aria-current");
    });

    it("marks the filtered generation", async () => {
        const screen = await setup("/pokedex?gen=2");
        await expect
            .element(link(screen, /Johto/))
            .toHaveAttribute("aria-current", "true");
        await expect
            .element(link(screen, /Every region/))
            .not.toHaveAttribute("aria-current");
    });

    it("does not mark any generation on a pokémon's page", async () => {
        const screen = await setup("/pokedex/bulbasaur?gen=1");
        await expect
            .element(link(screen, /Every region/))
            .not.toHaveAttribute("aria-current");
        await expect
            .element(link(screen, /Kanto/))
            .not.toHaveAttribute("aria-current");
        await expect.element(link(screen, /Kanto/)).toHaveTextContent("8");
    });

    it("links to the list with the generation, keeping the other filters", async () => {
        const screen = await setup(
            "/pokedex?q=a&type=fire,water&sort=name:desc"
        );

        const href = (await link(screen, /Johto/)
            .element()
            .getAttribute("href")) as string;
        const params = new URLSearchParams(href.split("?")[1]);
        expect(href.startsWith("/pokedex?")).toBe(true);
        expect(params.get("gen")).toBe("2");
        expect(params.get("q")).toBe("a");
        expect(params.get("type")).toBe("fire,water");
        expect(params.get("sort")).toBe("name:desc");
    });

    it("links All to the list without a generation", async () => {
        const screen = await setup("/pokedex?gen=2");
        await expect
            .element(link(screen, /Every region/))
            .toHaveAttribute("href", "/pokedex");
    });

    it("moves the filter when a generation is picked", async () => {
        const screen = await setup("/pokedex?type=fire");

        await link(screen, /Johto/).click();

        await expect
            .element(screen.getByTestId("location"))
            .toHaveAttribute("data-search", "?type=fire&gen=2");
        await expect
            .element(link(screen, /Johto/))
            .toHaveAttribute("aria-current", "true");
    });

    it("ignores an invalid generation in the URL", async () => {
        const screen = await setup("/pokedex?gen=99");
        await expect
            .element(link(screen, /Every region/))
            .toHaveAttribute("aria-current", "true");
    });

    it("counts pokémon per generation from the loader data", async () => {
        const dex = [
            makePokemon({ id: 1, generationId: 4 }),
            makePokemon({ id: 2, name: "b", generationId: 4 }),
        ];
        const screen = await setup("/pokedex", { dex });
        await expect.element(link(screen, /Sinnoh/)).toHaveTextContent("2");
        await expect
            .element(link(screen, /Every region/))
            .toHaveTextContent("2");
    });
});
