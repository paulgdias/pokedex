import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { bulbasaur } from "@components/__fixtures__/pokemon";
import TestRouter from "@components/__fixtures__/router";

import { useNavigateToPokemon } from ".";

const Go = ({ previous }: { previous?: string }) => {
    const navigateToPokemon = useNavigateToPokemon(previous);
    return (
        <button
            type="button"
            onClick={(event) => navigateToPokemon(event, bulbasaur)}
        >
            go
        </button>
    );
};

const setup = async (at: string, previous?: string) => {
    const screen = await render(
        <TestRouter initialEntries={[at]}>
            <Go previous={previous} />
        </TestRouter>
    );
    await screen.getByRole("button", { name: "go" }).click();
    return screen.getByTestId("location");
};

describe("useNavigateToPokemon", () => {
    it("goes to the pokémon's page", async () => {
        const location = await setup("/pokedex");
        await expect
            .element(location)
            .toHaveAttribute("data-pathname", "/pokedex/bulbasaur");
    });

    it("passes the pokémon in router state", async () => {
        const location = await setup("/pokedex");
        await expect
            .element(location)
            .toHaveAttribute("data-pokemon", "bulbasaur");
    });

    it("remembers the current path and query for the way back", async () => {
        const location = await setup("/pokedex?q=saur&type=grass");
        await expect
            .element(location)
            .toHaveAttribute("data-previous", "/pokedex?q=saur&type=grass");
    });

    it("prefers an explicit previous location", async () => {
        const location = await setup("/pokedex/ivysaur", "/pokedex?gen=1");
        await expect
            .element(location)
            .toHaveAttribute("data-previous", "/pokedex?gen=1");
    });

    it("falls back to the current location for an empty previous", async () => {
        const location = await setup("/compare?a=1", "");
        await expect
            .element(location)
            .toHaveAttribute("data-previous", "/compare?a=1");
    });
});
