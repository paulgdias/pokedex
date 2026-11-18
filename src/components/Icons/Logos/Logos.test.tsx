import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { Email, GitHub, LinkedIn } from ".";

// the links (href, target, rel) are covered by the story
describe.each([
    ["GitHub", GitHub],
    ["LinkedIn", LinkedIn],
    ["Email", Email],
])("%s logo", (name, Logo) => {
    const svgOf = (screen: Awaited<ReturnType<typeof render>>) =>
        screen.getByRole("link", { name }).element().querySelector("svg");

    it("is 32px square by default", async () => {
        const screen = await render(<Logo />);
        expect(svgOf(screen)?.getAttribute("width")).toBe("32");
        expect(svgOf(screen)?.getAttribute("height")).toBe("32");
    });

    it("takes its size from the props", async () => {
        const screen = await render(<Logo width={40} height={24} />);
        expect(svgOf(screen)?.getAttribute("width")).toBe("40");
        expect(svgOf(screen)?.getAttribute("height")).toBe("24");
    });
});
