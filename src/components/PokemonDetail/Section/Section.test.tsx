import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { makeInfo } from "../../__fixtures__/pokemon";
import Section, { InfoSection } from ".";

// the labelled region is covered by the stories; the surface override by the
// Panel tests
describe("Section", () => {
    it("names each section by its own heading", async () => {
        const screen = await render(
            <>
                <Section title="One">first</Section>
                <Section title="Two">second</Section>
            </>
        );
        const named = (name: string) =>
            screen.getByRole("region", { name }).element().textContent;
        await expect.poll(() => named("One")).toBe("Onefirst");
        expect(named("Two")).toBe("Twosecond");
    });

    it("lets className override its padding", async () => {
        const screen = await render(
            <Section title="Stats" className="p-0">
                x
            </Section>
        );
        const section = screen.getByRole("region");
        await expect.element(section).toHaveClass("p-0");
        await expect.element(section).not.toHaveClass("p-5");
    });
});

// the loading, error and loaded states are covered by the stories
describe("InfoSection", () => {
    it("prefers data over an error from a refetch", async () => {
        const screen = await render(
            <InfoSection
                title="Facts"
                query={{ isError: true, data: makeInfo() }}
            >
                {(info) => <p>{info.genus}</p>}
            </InfoSection>
        );
        await expect.element(screen.getByText("Seed Pokémon")).toBeVisible();
    });
});
