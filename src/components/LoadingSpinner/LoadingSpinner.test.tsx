import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import LoadingSpinner from ".";

describe("LoadingSpinner", () => {
    it("spins a 52px pokéball that fills the viewport height", async () => {
        const screen = await render(<LoadingSpinner />);
        const svg = screen.container.querySelector("svg") as SVGSVGElement;
        const wrapper = svg.closest("div") as HTMLElement;

        expect(svg.getAttribute("width")).toBe("52");
        expect(svg.getAttribute("height")).toBe("52");
        expect(getComputedStyle(wrapper).animationName).toBe("spin");
        expect(wrapper.getBoundingClientRect().height).toBe(window.innerHeight);
    });
});
