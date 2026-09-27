import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import Pokeball from ".";

describe("Pokeball", () => {
    it("is 32px square by default", async () => {
        const screen = await render(<Pokeball />);
        const svg = screen.container.querySelector("svg") as SVGSVGElement;
        expect(svg.getAttribute("width")).toBe("32");
        expect(svg.getAttribute("height")).toBe("32");
        expect(svg.getAttribute("viewBox")).toBe("0 0 32 32");
    });

    it("takes its size from the props", async () => {
        const screen = await render(<Pokeball width={52} height={40} />);
        const svg = screen.container.querySelector("svg") as SVGSVGElement;
        expect(svg.getAttribute("width")).toBe("52");
        expect(svg.getAttribute("height")).toBe("40");
        expect(svg.querySelector("image")?.getAttribute("width")).toBe("52");
    });
});
