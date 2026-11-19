import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import Pokeball from ".";

// the rendered size and the viewBox are covered by the stories
describe("Pokeball", () => {
    it("sizes the image to fill the svg", async () => {
        const screen = await render(<Pokeball width={52} height={40} />);
        const image = screen.container.querySelector("svg image");
        expect(image?.getAttribute("width")).toBe("52");
        expect(image?.getAttribute("height")).toBe("40");
    });
});
