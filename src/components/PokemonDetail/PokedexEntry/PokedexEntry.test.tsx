import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { makeInfo } from "../../__fixtures__/pokemon";
import PokedexEntry from ".";

// the genus, the entry, switching games and "No entry available." are covered
// by the stories; the line-wrap cleanup by the formatFlavorText tests
describe("PokedexEntry", () => {
    it("leaves out the genus line when the species has none", async () => {
        const screen = await render(
            <PokedexEntry info={makeInfo({ genus: "" })} />
        );
        // only the entry text, no empty genus paragraph above it
        expect(
            [...screen.container.querySelectorAll("p")].map(
                (paragraph) => paragraph.textContent
            )
        ).toEqual(["A strange seed was planted on its back at birth."]);
    });
});
