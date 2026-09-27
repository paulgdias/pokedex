import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { makePokemon } from "../__fixtures__/pokemon";
import PokemonCard from "./index";

const bulbasaur = makePokemon();
const charmander = makePokemon({
    _id: 4,
    name: "charmander",
    types: ["fire"],
});

// the card's own subtree, without the render container
const cardHtml = (screen: Awaited<ReturnType<typeof render>>) =>
    screen.container.innerHTML;

describe("PokemonCard", () => {
    it("shows the name, padded number and one pill per type", async () => {
        const screen = await render(<PokemonCard pokemon={bulbasaur} />);
        const card = screen.getByLabelText("Pokemon Card for bulbasaur");
        await expect.element(card).toHaveTextContent("bulbasaur");
        await expect.element(card).toHaveTextContent("#0001");
        await expect.element(card).toHaveTextContent("grass");
        await expect.element(card).toHaveTextContent("poison");
    });

    it("renders a single type pill for a single-type pokémon", async () => {
        const screen = await render(<PokemonCard pokemon={charmander} />);
        const card = screen.getByLabelText("Pokemon Card for charmander");
        await expect.element(card).toHaveTextContent("fire");
        await expect.element(card).not.toHaveTextContent("poison");
    });

    it("labels legendary and mythical badges, mythical winning", async () => {
        const legendary = await render(
            <PokemonCard pokemon={bulbasaur} isLegendary />
        );
        await expect
            .element(legendary.getByRole("img", { name: "Legendary" }))
            .toBeVisible();
        await legendary.unmount();

        const both = await render(
            <PokemonCard pokemon={bulbasaur} isLegendary isMythical />
        );
        await expect
            .element(both.getByRole("img", { name: "Mythical" }))
            .toBeVisible();
        expect(both.getByRole("img", { name: "Legendary" }).query()).toBeNull();
    });

    it("has no badge for an ordinary pokémon", async () => {
        const screen = await render(<PokemonCard pokemon={bulbasaur} />);
        expect(screen.getByTitle("Legendary").query()).toBeNull();
        expect(screen.getByTitle("Mythical").query()).toBeNull();
    });

    it("falls back to the number watermark without a sprite", async () => {
        const screen = await render(
            <PokemonCard pokemon={makePokemon({ sprite: "" })} />
        );
        expect(screen.getByRole("img").query()).toBeNull();
        expect(cardHtml(screen)).toContain('aria-hidden="true"');
        // drawn from the attribute, so it is not text in the document
        expect(cardHtml(screen)).toContain(`data-number="${bulbasaur._id}"`);
    });

    it("uses the sprite override when given", async () => {
        const screen = await render(
            <PokemonCard pokemon={bulbasaur} sprite="/override.png" />
        );
        await expect
            .element(screen.getByAltText("bulbasaur"))
            .toHaveAttribute("src", "/override.png");
    });

    it("is inert without navigateCallback", async () => {
        const screen = await render(<PokemonCard pokemon={bulbasaur} />);
        expect(screen.getByRole("link").query()).toBeNull();
        await expect
            .element(screen.getByLabelText("Pokemon Card for bulbasaur"))
            .toHaveAttribute("tabindex", "-1");
    });

    it("links to the detail page and calls navigateCallback on click", async () => {
        const navigate = vi.fn();
        const screen = await render(
            <PokemonCard pokemon={bulbasaur} navigateCallback={navigate} />
        );
        await expect
            .element(
                screen.getByRole("link", { name: "Navigate to bulbasaur" })
            )
            .toHaveAttribute("href", "/pokedex/bulbasaur");
        await screen.getByLabelText("Pokemon Card for bulbasaur").click();
        expect(navigate).toHaveBeenCalledTimes(1);
        expect(navigate.mock.calls[0][1]).toBe(bulbasaur);
    });

    it("calls navigateCallback on Enter only", async () => {
        const navigate = vi.fn();
        const screen = await render(
            <PokemonCard pokemon={bulbasaur} navigateCallback={navigate} />
        );
        const card = screen.getByLabelText("Pokemon Card for bulbasaur");
        await card.element().focus();
        await card.element().dispatchEvent(
            new KeyboardEvent("keydown", {
                code: "Space",
                bubbles: true,
            })
        );
        expect(navigate).not.toHaveBeenCalled();
        await card.element().dispatchEvent(
            new KeyboardEvent("keydown", {
                code: "Enter",
                bubbles: true,
            })
        );
        expect(navigate).toHaveBeenCalledTimes(1);
    });

    it("matches the snapshot for the default variant", async () => {
        const screen = await render(<PokemonCard pokemon={bulbasaur} />);
        expect(cardHtml(screen)).toMatchSnapshot();
    });

    it("matches the snapshot for the large, pixelated, legendary variant", async () => {
        const screen = await render(
            <PokemonCard
                pokemon={bulbasaur}
                size="large"
                pixelated
                isLegendary
            />
        );
        expect(cardHtml(screen)).toMatchSnapshot();
    });
});
