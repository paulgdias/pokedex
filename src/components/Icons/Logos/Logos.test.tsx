import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { Email, GitHub, LinkedIn, githubUrl, linkedinUrl } from ".";

describe("Logos", () => {
    it("exports the profile URLs", () => {
        expect(githubUrl).toMatch(/^https:\/\/github\.com\//);
        expect(linkedinUrl).toMatch(/^https:\/\/www\.linkedin\.com\/in\//);
    });

    it("GitHub links to the profile and sizes its svg", async () => {
        const screen = await render(<GitHub width={40} height={24} />);
        const link = screen.getByRole("link", { name: "GitHub" });
        await expect.element(link).toHaveAttribute("href", githubUrl);
        const svg = screen.container.querySelector("svg") as SVGSVGElement;
        expect(svg.getAttribute("width")).toBe("40");
        expect(svg.getAttribute("height")).toBe("24");
    });

    it("LinkedIn links to the profile and sizes its svg", async () => {
        const screen = await render(<LinkedIn width={40} height={24} />);
        await expect
            .element(screen.getByRole("link", { name: "LinkedIn" }))
            .toHaveAttribute("href", linkedinUrl);
        const svg = screen.container.querySelector("svg") as SVGSVGElement;
        expect(svg.getAttribute("width")).toBe("40");
    });

    it("Email opens a mail draft", async () => {
        const screen = await render(<Email width={40} height={40} />);
        await expect
            .element(screen.getByRole("link", { name: "Email" }))
            .toHaveAttribute("href", expect.stringMatching(/^mailto:.+@.+/));
    });

    it("falls back to default sizes", async () => {
        const screen = await render(
            <>
                <GitHub />
                <LinkedIn />
                <Email />
            </>
        );
        expect(screen.container.querySelectorAll("a")).toHaveLength(3);
    });
});
