import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { typeEfficacyQueryOptions } from "@api/pokedex";
import { DEX, EFFICACY } from "@components/__fixtures__/pokemon";
import TestRouter from "@components/__fixtures__/router";
import { TypeEfficacy } from "@customTypes/PokemonTypes";

import Party from "./Party";

type Screen = Awaited<ReturnType<typeof render>>;

/** The type chart request, answered here instead of by PokeAPI. */
const efficacyRequest = () =>
    vi.spyOn(
        typeEfficacyQueryOptions as unknown as {
            queryFn: () => Promise<TypeEfficacy>;
        },
        "queryFn"
    );

const setup = async (search = "") => {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    const screen = await render(
        <QueryClientProvider client={client}>
            <TestRouter dex={DEX} initialEntries={[`/party${search}`]}>
                <Party />
            </TestRouter>
        </QueryClientProvider>
    );
    await expect
        .element(screen.getByRole("heading", { level: 1 }))
        .toHaveTextContent("Party Analyzer");
    return screen;
};

const location = (screen: Screen) =>
    screen.getByTestId("location").element() as HTMLElement;

/** The current query string, decoded (`URLSearchParams` encodes commas). */
const search = (screen: Screen) =>
    decodeURIComponent(location(screen).dataset.search ?? "");

const loaded = async (query = "") => {
    efficacyRequest().mockResolvedValue(EFFICACY);
    const screen = await setup(query);
    await expect
        .element(screen.getByRole("heading", { name: "Threat analysis" }))
        .toBeVisible();
    return screen;
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe("Party page URL state", () => {
    it("restores the party and threats from the URL", async () => {
        const screen = await loaded("?party=1,4,0,0,0,0&threats=fire");
        await expect
            .element(screen.getByRole("button", { name: "Remove bulbasaur" }))
            .toBeVisible();
        await expect
            .element(screen.getByRole("button", { name: "Remove charmander" }))
            .toBeVisible();
        expect(screen.getByRole("combobox").elements()).toHaveLength(4);
        await expect
            .element(screen.getByRole("button", { name: "Remove fire threat" }))
            .toBeVisible();
        await expect
            .element(screen.getByText("Fire → Bulbasaur: 2× (super effective)"))
            .toBeInTheDocument();
    });

    it("ignores a party param that is not six slots", async () => {
        const screen = await loaded("?party=1,4");
        expect(screen.getByRole("combobox").elements()).toHaveLength(6);
        await expect
            .element(
                screen.getByText("Add Pokémon to see the defensive profile")
            )
            .toBeVisible();
    });

    it("puts a Pokémon repeated in the URL in one slot only", async () => {
        const screen = await loaded("?party=1,1,4,0,0,0&threats=fire,fire");
        expect(
            screen.getByRole("button", { name: "Remove bulbasaur" }).elements()
        ).toHaveLength(1);
        expect(screen.getByRole("combobox").elements()).toHaveLength(4);
        expect(
            screen
                .getByRole("button", { name: "Remove fire threat" })
                .elements()
        ).toHaveLength(1);
    });

    it("writes a picked Pokémon to its slot in the URL, replacing the entry", async () => {
        const screen = await loaded("?party=1,0,0,0,0,0");
        await screen
            .getByRole("combobox", { name: "Slot 3 Pokémon" })
            .fill("char");
        await screen.getByRole("option", { name: /charmander/ }).click();

        await expect
            .element(screen.getByRole("button", { name: "Remove charmander" }))
            .toBeVisible();
        expect(search(screen)).toBe("?party=1,0,4,0,0,0");
        expect(location(screen).dataset.navigationType).toBe("REPLACE");
    });

    it("drops the party param once the last member is removed", async () => {
        const screen = await loaded("?party=0,0,7,0,0,0&threats=fire");
        await screen.getByRole("button", { name: "Remove squirtle" }).click();

        await expect
            .element(screen.getByRole("combobox", { name: "Slot 3 Pokémon" }))
            .toBeVisible();
        // the other param is left alone
        expect(search(screen)).toBe("?threats=fire");
        expect(location(screen).dataset.navigationType).toBe("REPLACE");
    });

    it("adds and removes threat types in the URL", async () => {
        const screen = await loaded("?party=1,0,0,0,0,0&threats=fire");
        await screen.getByRole("button", { name: /Add a threat type/ }).click();
        await screen.getByRole("option", { name: "water" }).click();

        await expect
            .element(
                screen.getByRole("button", { name: "Remove water threat" })
            )
            .toBeVisible();
        expect(search(screen)).toBe("?party=1,0,0,0,0,0&threats=fire,water");
        expect(location(screen).dataset.navigationType).toBe("REPLACE");

        await screen
            .getByRole("button", { name: "Remove fire threat" })
            .click();
        await screen
            .getByRole("button", { name: "Remove water threat" })
            .click();
        await expect
            .element(screen.getByText("Add a threat type to see"))
            .toBeVisible();
        expect(search(screen)).toBe("?party=1,0,0,0,0,0");
    });
});

describe("Party page type chart states", () => {
    it("shows the slots and a loading message while the type chart loads", async () => {
        efficacyRequest().mockReturnValue(
            new Promise(() => {
                // never settles: the chart stays loading
            })
        );
        const screen = await setup("?party=1,0,0,0,0,0");

        await expect
            .element(screen.getByRole("status"))
            .toHaveTextContent("Loading…");
        await expect
            .element(screen.getByRole("button", { name: "Remove bulbasaur" }))
            .toBeVisible();
        expect(
            screen.getByRole("heading", { name: "Defensive profile" }).query()
        ).toBeNull();
    });

    it("shows an error in place of the analysis and can try again", async () => {
        const request = efficacyRequest().mockRejectedValue(
            new Error("offline")
        );
        const screen = await setup("?party=1,0,0,0,0,0");

        await expect
            .element(
                screen.getByText("Couldn't load type data. Please try again.")
            )
            .toBeVisible();
        expect(
            screen.getByRole("heading", { name: "Defensive profile" }).query()
        ).toBeNull();

        request.mockResolvedValue(EFFICACY);
        await screen.getByRole("button", { name: "Try again" }).click();
        await expect
            .element(screen.getByRole("heading", { name: "Defensive profile" }))
            .toBeVisible();
        expect(
            screen
                .getByText("Couldn't load type data. Please try again.")
                .query()
        ).toBeNull();
    });
});
