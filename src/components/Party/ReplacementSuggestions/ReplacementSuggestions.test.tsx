import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import {
    bulbasaur,
    CHARMANDER,
    DEX,
    EFFICACY,
    makePokemon,
    PIKACHU,
} from "../../__fixtures__/pokemon";
import ReplacementSuggestions from ".";

type Screen = Awaited<ReturnType<typeof render>>;

const summary = (screen: Screen) =>
    screen.container.querySelector("p")?.textContent?.replace(/\s+/g, " ");

describe("ReplacementSuggestions", () => {
    // the candidate cards and the hidden state are covered by the stories;
    // who is weakest and who replaces it is rankReplacements' job
    it("names the member's real slot and its region", async () => {
        const screen = await render(
            <ReplacementSuggestions
                party={[null, null, bulbasaur, null, CHARMANDER, null]}
                allPokemon={[...DEX, PIKACHU]}
                efficacy={EFFICACY}
            />
        );
        expect(summary(screen)).toMatch(
            /^bulbasaur \(slot 3\) adds .* These Kanto Pokémon in its place/
        );
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
        const zap = makePokemon({
            id: 502,
            name: "zap",
            types: ["electric"],
            generationId: 99,
        });
        const screen = await render(
            <ReplacementSuggestions
                party={party}
                allPokemon={[...party, zap]}
                efficacy={EFFICACY}
            />
        );
        expect(summary(screen)).toContain("These Pokémon in its place");
    });
});
