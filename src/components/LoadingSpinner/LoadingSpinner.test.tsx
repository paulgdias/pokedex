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

    it("is announced as a loading status", async () => {
        const screen = await render(<LoadingSpinner />);
        await expect
            .element(screen.getByRole("status", { name: "Loading" }))
            .toBeInTheDocument();
    });

    it("lets className override the full-height default", async () => {
        const screen = await render(<LoadingSpinner className="h-auto" />);
        const wrapper = screen.getByRole("status").element();

        expect(wrapper).toHaveClass("h-auto");
        expect(wrapper).not.toHaveClass("h-screen");
    });
});
