import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { TypeEfficacy } from "@customTypes/PokemonTypes";
import { TYPE_ORDER } from "@utils/stats";

import {
    bulbasaur,
    CHARMANDER,
    DEX,
    DITTO,
    EFFICACY,
    makePokemon,
    PIKACHU,
} from "../../__fixtures__/pokemon";
import ReplacementSuggestions from ".";

type Screen = Awaited<ReturnType<typeof render>>;

const summary = (screen: Screen) =>
    screen.container.querySelector("p")?.textContent?.replace(/\s+/g, " ");

const candidateNames = (screen: Screen) =>
    screen
        .getByRole("listitem")
        .elements()
        .map((item) => item.querySelector(".font-display")?.textContent);

/** electric hits water and flying in EFFICACY: a net +1 for bulbasaur's slot */
const electric = (id: number, generationId = 1) =>
    makePokemon({ id, name: `zap-${id}`, types: ["electric"], generationId });

describe("ReplacementSuggestions", () => {
    it("suggests same-generation Pokémon for the weakest contributor", async () => {
        const screen = await render(
            <ReplacementSuggestions
                party={[bulbasaur, CHARMANDER]}
                allPokemon={[...DEX, PIKACHU]}
                efficacy={EFFICACY}
            />
        );
        await expect
            .element(
                screen.getByRole("heading", { name: "Suggested replacement" })
            )
            .toBeVisible();
        // bulbasaur only adds water, which charmander does not hit
        expect(summary(screen)).toMatch(
            /^bulbasaur \(slot 1\) adds .* These Kanto Pokémon in its place/
        );
        // squirtle would close fire but lose water, so only pikachu gains
        expect(candidateNames(screen)).toEqual(["pikachu"]);
        await expect.element(screen.getByText("#0025")).toBeVisible();
        expect(screen.container.querySelector("img")?.getAttribute("alt")).toBe(
            ""
        );
    });

    it("names the member's real slot when earlier slots are empty", async () => {
        const screen = await render(
            <ReplacementSuggestions
                party={[null, null, bulbasaur, null, CHARMANDER, null]}
                allPokemon={[...DEX, PIKACHU]}
                efficacy={EFFICACY}
            />
        );
        expect(summary(screen)).toMatch(/^bulbasaur \(slot 3\)/);
    });

    it("shows at most three candidates", async () => {
        const screen = await render(
            <ReplacementSuggestions
                party={[bulbasaur, CHARMANDER]}
                allPokemon={[
                    bulbasaur,
                    CHARMANDER,
                    ...[100, 101, 102, 103].map((id) => electric(id)),
                ]}
                efficacy={EFFICACY}
            />
        );
        expect(candidateNames(screen)).toEqual([
            "zap-100",
            "zap-101",
            "zap-102",
        ]);
    });

    it("leaves the region out when the generation is unknown", async () => {
        const party = [
            makePokemon({
                id: 500,
                name: "leafy",
                types: ["grass"],
                generationId: 99,
            }),
            makePokemon({
                id: 501,
                name: "flamy",
                types: ["fire"],
                generationId: 99,
            }),
        ];
        const screen = await render(
            <ReplacementSuggestions
                party={party}
                allPokemon={[...party, electric(502, 99)]}
                efficacy={EFFICACY}
            />
        );
        expect(summary(screen)).toContain("These Pokémon in its place");
    });

    it("renders nothing with fewer than two members", async () => {
        const screen = await render(
            <ReplacementSuggestions
                party={[bulbasaur, null, null, null, null, null]}
                allPokemon={DEX}
                efficacy={EFFICACY}
            />
        );
        expect(screen.container.textContent).toBe("");
    });

    it("renders nothing when no candidate has a net gain", async () => {
        // squirtle trades bulbasaur's water for fire: no gain
        const screen = await render(
            <ReplacementSuggestions
                party={[bulbasaur, CHARMANDER]}
                allPokemon={DEX}
                efficacy={EFFICACY}
            />
        );
        expect(screen.container.textContent).toBe("");
    });

    it("renders nothing when the party covers every type", async () => {
        const efficacy: TypeEfficacy = {
            normal: Object.fromEntries(TYPE_ORDER.map((type) => [type, 2])),
        };
        const screen = await render(
            <ReplacementSuggestions
                party={[
                    DITTO,
                    makePokemon({
                        id: 143,
                        name: "snorlax",
                        types: ["normal"],
                    }),
                ]}
                allPokemon={DEX}
                efficacy={efficacy}
            />
        );
        expect(screen.container.textContent).toBe("");
    });
});
