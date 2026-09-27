import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { PokemonDetails } from "@customTypes/PokemonTypes";

import EvolutionChain from ".";
import {
    DITTO,
    EEVEE_LINE,
    MEOWTH_LINE,
    bulbasaur,
    chain,
    ivysaur,
    makePokemon,
    venusaur,
    venusaurGmax,
    venusaurMega,
} from "../__fixtures__/pokemon";
import TestRouter from "../__fixtures__/router";

const setup = async (
    pokemon: PokemonDetails,
    { previous, at = "/pokedex/x?y=1" }: { previous?: string; at?: string } = {}
) => {
    const screen = await render(
        <TestRouter initialEntries={[at]}>
            <EvolutionChain pokemon={pokemon} previous={previous} />
        </TestRouter>
    );
    return screen;
};

type Screen = Awaited<ReturnType<typeof render>>;

const lane = (screen: Screen, heading: string) =>
    screen.getByRole("heading", { name: heading }).element()
        .parentElement as HTMLElement;

const names = (root: ParentNode) =>
    [...root.querySelectorAll("a, [aria-current]")].map(
        (node) =>
            node.querySelector(".capitalize")?.textContent ?? node.textContent
    );

describe("EvolutionChain visibility", () => {
    it("is hidden for a species that neither evolves nor has other forms", async () => {
        const screen = await setup({ ...DITTO, evolutions: [DITTO] });
        expect(screen.getByRole("heading").query()).toBeNull();
    });

    it("is hidden with no chain data at all", async () => {
        const screen = await setup({ ...DITTO, evolutions: [] });
        expect(screen.getByRole("heading").query()).toBeNull();
    });

    it("is shown for a lone species that has Mega forms", async () => {
        const lone = [
            { ...makePokemon({ id: 6, name: "charizard" }) },
            makePokemon({
                id: 10034,
                name: "charizard-mega-x",
                speciesId: 6,
                isDefault: false,
                form: "mega",
            }),
        ];
        const [charizard] = chain(lone);

        const screen = await setup(charizard);

        await expect
            .element(screen.getByRole("heading", { name: "Evolution chain" }))
            .toBeVisible();
        await expect
            .element(screen.getByText("Mega Charizard X"))
            .toBeVisible();
    });
});

describe("EvolutionChain stages", () => {
    it("lists the stages in order with the way each is reached", async () => {
        const screen = await setup(ivysaur);
        const region = screen.getByRole("region", { name: "Evolution chain" });
        const root = region.element();

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
        const current = screen
            .getByRole("region", { name: "Evolution chain" })
            .element()
            .querySelectorAll('[aria-current="page"]');
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

    it("shows types and padded numbers", async () => {
        const screen = await setup(ivysaur);
        await expect.element(screen.getByText("#0001")).toBeVisible();
        expect(
            screen.getByText("poison").elements().length
        ).toBeGreaterThanOrEqual(3);
    });

    it("draws a thumbnail only for pokémon with artwork", async () => {
        const noArt = chain([bulbasaur, { ...ivysaur, sprite: "" }]);
        const screen = await setup(noArt[0]);
        const images = screen
            .getByRole("region", { name: "Evolution chain" })
            .element()
            .querySelectorAll("img");
        expect(images).toHaveLength(1);
    });

    it("renders branching evolutions side by side", async () => {
        const screen = await setup(EEVEE_LINE[1]);
        const root = screen
            .getByRole("region", { name: "Evolution chain" })
            .element();
        expect(names(root)).toEqual(["eevee", "vaporeon", "jolteon"]);
        expect(root.textContent).toContain("Use Water Stone");
        expect(root.textContent).toContain("Use Thunder Stone");
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
            screen
                .getByRole("region", { name: "Evolution chain" })
                .element()
                .querySelectorAll(".rounded-full.bg-chip")
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
    it("adds one lane per regional variant", async () => {
        const screen = await setup(MEOWTH_LINE[0]);
        const headings = screen
            .getByRole("heading", { level: 3 })
            .elements()
            .map((heading) => heading.textContent);
        expect(headings).toEqual(["Standard", "Alola", "Galar"]);
    });

    it("puts each regional form in its own lane", async () => {
        const screen = await setup(MEOWTH_LINE[0]);
        expect(names(lane(screen, "Standard")).slice(0, 2)).toEqual([
            "meowth",
            "persian",
        ]);
        expect(names(lane(screen, "Alola"))).toEqual([
            "meowth-alola",
            "persian-alola",
        ]);
        expect(names(lane(screen, "Galar"))).toEqual([
            "meowth-galar",
            "perrserker",
        ]);
    });

    it("uses the evolution row that belongs to the lane", async () => {
        const screen = await setup(MEOWTH_LINE[0]);
        expect(lane(screen, "Standard").textContent).toContain("Lv. 28");
        expect(lane(screen, "Alola").textContent).toContain("High friendship");
        expect(lane(screen, "Galar").textContent).toContain("Lv. 28");
    });

    it("marks the current regional form in its lane only", async () => {
        const screen = await setup(MEOWTH_LINE[1]);
        const current = screen
            .getByRole("region", { name: "Evolution chain" })
            .element()
            .querySelectorAll('[aria-current="page"]');
        expect(current).toHaveLength(1);
        expect(lane(screen, "Alola").contains(current[0])).toBe(true);
    });
});

describe("EvolutionChain navigation", () => {
    const at = (screen: Screen) => screen.getByTestId("location");

    it("goes to another stage's page, remembering the current location", async () => {
        const screen = await setup(ivysaur);

        await screen.getByRole("link", { name: /venusaur #0003/ }).click();

        await expect
            .element(at(screen))
            .toHaveAttribute("data-pathname", "/pokedex/venusaur");
        await expect
            .element(at(screen))
            .toHaveAttribute("data-previous", "/pokedex/x?y=1");
        await expect
            .element(at(screen))
            .toHaveAttribute("data-pokemon", "venusaur");
    });

    it("prefers an explicit `previous` (the list the user came from)", async () => {
        const screen = await setup(ivysaur, { previous: "/pokedex?q=saur" });

        await screen.getByRole("link", { name: /bulbasaur/ }).click();

        await expect
            .element(at(screen))
            .toHaveAttribute("data-previous", "/pokedex?q=saur");
    });

    it("goes to an alternate form's page", async () => {
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
