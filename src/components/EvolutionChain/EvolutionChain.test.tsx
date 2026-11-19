import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import { PokemonDetails } from "@customTypes/PokemonTypes";

import {
    bulbasaur,
    chain,
    ivysaur,
    MEOWTH_LINE,
    makePokemon,
    venusaur,
    venusaurGmax,
    venusaurMega,
} from "../__fixtures__/pokemon";
import TestRouter from "../__fixtures__/router";
import EvolutionChain from ".";

const setup = async (
    pokemon: PokemonDetails,
    { previous }: { previous?: string } = {}
) =>
    render(
        <TestRouter initialEntries={["/pokedex/x?y=1"]}>
            <EvolutionChain pokemon={pokemon} previous={previous} />
        </TestRouter>
    );

type Screen = Awaited<ReturnType<typeof render>>;

const section = (screen: Screen) =>
    screen.getByRole("region", { name: "Evolution chain" }).element();

const lane = (screen: Screen, heading: string) =>
    screen.getByRole("heading", { name: heading }).element()
        .parentElement as HTMLElement;

const names = (root: ParentNode) =>
    [...root.querySelectorAll("a, [aria-current]")].map(
        (node) =>
            node.querySelector(".capitalize")?.textContent ?? node.textContent
    );

// how lanes, stages and branches are built is covered by the evolution util;
// the hidden section, the branches, the lane labels, the card's number and
// types, the accent border and the dashed forms box are covered by the stories
describe("EvolutionChain visibility", () => {
    it("is shown for a lone species that has Mega forms", async () => {
        const [charizard] = chain([
            makePokemon({ id: 6, name: "charizard" }),
            makePokemon({
                id: 10034,
                name: "charizard-mega-x",
                speciesId: 6,
                isDefault: false,
                form: "mega",
            }),
        ]);

        const screen = await setup(charizard);

        await expect
            .element(screen.getByText("Mega Charizard X"))
            .toBeVisible();
    });

    it("is shown for a lone species that has a regional form", async () => {
        const [zapdos] = chain([
            makePokemon({ id: 145, name: "zapdos" }),
            makePokemon({
                id: 10171,
                name: "zapdos-galar",
                speciesId: 145,
                isDefault: false,
                form: "galar",
            }),
        ]);

        const screen = await setup(zapdos);

        expect(names(lane(screen, "Galar"))).toEqual(["zapdos-galar"]);
    });
});

describe("EvolutionChain stages", () => {
    it("lists the stages in order with the way each is reached", async () => {
        const screen = await setup(ivysaur);
        const root = section(screen);

        expect(names(root).slice(0, 3)).toEqual([
            "bulbasaur",
            "ivysaur",
            "venusaur",
        ]);
        const pills = [...root.querySelectorAll(".rounded-full.bg-chip")].map(
            (pill) => pill.textContent
        );
        expect(pills).toEqual(["Evolves by Lv. 16", "Evolves by Lv. 32"]);
    });

    it("marks the current pokémon instead of linking to it", async () => {
        const screen = await setup(ivysaur);
        const current = section(screen).querySelectorAll(
            '[aria-current="page"]'
        );
        expect(current).toHaveLength(1);
        expect(current[0].textContent).toContain("ivysaur");
        expect(current[0].tagName).toBe("DIV");
        expect(
            screen.getByRole("link", { name: /ivysaur/ }).query()
        ).toBeNull();
    });

    it("links other stages to their pages", async () => {
        const screen = await setup(ivysaur);
        await expect
            .element(screen.getByRole("link", { name: /bulbasaur/ }))
            .toHaveAttribute("href", "/pokedex/bulbasaur");
    });

    it("draws a thumbnail only for pokémon with artwork", async () => {
        const noArt = chain([bulbasaur, { ...ivysaur, sprite: "" }]);
        const screen = await setup(noArt[0]);
        expect(section(screen).querySelectorAll("img")).toHaveLength(1);
    });

    it("has no connector pill when the method is unknown", async () => {
        const silent = chain([
            makePokemon({ id: 1, name: "a", evolutionChainId: 9 }),
            makePokemon({
                id: 2,
                name: "b",
                evolutionChainId: 9,
                speciesId: 2,
                evolvesFromId: 1,
                evolutionMethods: [],
            }),
        ]);
        const screen = await setup(silent[0]);
        expect(
            section(screen).querySelectorAll(".rounded-full.bg-chip")
        ).toHaveLength(0);
    });
});

describe("EvolutionChain other forms", () => {
    it("lists Mega and Gigantamax forms under their species", async () => {
        const screen = await setup(ivysaur);
        const box = screen.getByText("Other forms").element().parentElement;
        expect(box?.textContent).toContain("Mega Venusaur");
        expect(box?.textContent).toContain("Mega Evolution");
        expect(box?.textContent).toContain("Gigantamax Venusaur");
    });

    it("marks the current form and links the rest", async () => {
        const screen = await setup(venusaurGmax);
        const box = screen.getByText("Other forms").element().parentElement;
        const current = box?.querySelector('[aria-current="page"]');
        expect(current?.textContent).toContain("Gigantamax Venusaur");
        expect(box?.querySelector("a")?.getAttribute("href")).toBe(
            "/pokedex/venusaur-mega"
        );
    });

    it("falls back to the whole form name when it does not extend the base name", async () => {
        const odd = chain([
            makePokemon({ id: 25, name: "pikachu" }),
            makePokemon({
                id: 10080,
                name: "gmax-pika",
                speciesId: 25,
                isDefault: false,
                form: "gmax",
            }),
        ]);
        const screen = await setup(odd[0]);
        await expect
            .element(screen.getByText("Gmax-pika Pikachu"))
            .toBeVisible();
    });
});

describe("EvolutionChain lanes", () => {
    it("renders each lane's own stages under its heading", async () => {
        const screen = await setup(MEOWTH_LINE[0]);
        expect(names(lane(screen, "Alola"))).toEqual([
            "meowth-alola",
            "persian-alola",
        ]);
        expect(names(lane(screen, "Galar"))).toEqual([
            "meowth-galar",
            "perrserker",
        ]);
    });
});

describe("EvolutionChain layout", () => {
    // stories render at desktop width, where the stages run across
    it("stacks the stages vertically below md", async () => {
        await page.viewport(414, 896);
        const screen = await setup(ivysaur);
        const [first, second] = names(section(screen)).map((name) =>
            screen
                .getByText(name as string, { exact: true })
                .element()
                .closest("a, [aria-current]")
                ?.getBoundingClientRect()
        );
        expect(second?.top).toBeGreaterThanOrEqual(first?.bottom ?? Infinity);
        expect(second?.left).toBe(first?.left);
    });
});

// the fallback to the current location is covered by useNavigateToPokemon
describe("EvolutionChain navigation", () => {
    const at = (screen: Screen) => screen.getByTestId("location");

    it("goes to another stage's page with that pokémon", async () => {
        const screen = await setup(ivysaur);

        await screen.getByRole("link", { name: /venusaur #0003/ }).click();

        await expect
            .element(at(screen))
            .toHaveAttribute("data-pathname", "/pokedex/venusaur");
        await expect
            .element(at(screen))
            .toHaveAttribute("data-pokemon", venusaur.name);
    });

    it("passes `previous` (the list the user came from) along", async () => {
        const screen = await setup(ivysaur, { previous: "/pokedex?q=saur" });

        await screen.getByRole("link", { name: /bulbasaur/ }).click();

        await expect
            .element(at(screen))
            .toHaveAttribute("data-previous", "/pokedex?q=saur");
    });

    it("goes to an alternate form's page with that form", async () => {
        const screen = await setup(venusaur);

        await screen.getByRole("link", { name: /Mega Venusaur/ }).click();

        await expect
            .element(at(screen))
            .toHaveAttribute("data-pathname", "/pokedex/venusaur-mega");
        await expect
            .element(at(screen))
            .toHaveAttribute("data-pokemon", venusaurMega.name);
    });
});
