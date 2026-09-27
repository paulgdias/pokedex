import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import Section, { InfoSection } from ".";
import { makeInfo } from "../../__fixtures__/pokemon";

describe("Section", () => {
    it("labels the region with its heading", async () => {
        const screen = await render(
            <Section title="Stats">
                <p>content</p>
            </Section>
        );
        const region = screen.getByRole("region", { name: "Stats" });
        await expect.element(region).toBeVisible();
        await expect
            .element(screen.getByRole("heading", { name: "Stats" }))
            .toBeVisible();
    });

    it("gives each section its own heading id", async () => {
        const screen = await render(
            <>
                <Section title="One">a</Section>
                <Section title="Two">b</Section>
            </>
        );
        const ids = [...screen.container.querySelectorAll("h2")].map(
            (heading) => heading.id
        );
        expect(new Set(ids).size).toBe(2);
    });

    it("merges a className over the defaults", async () => {
        const screen = await render(
            <Section title="Stats" className="p-0 bg-red-500">
                x
            </Section>
        );
        const section = screen.getByRole("region").element();
        expect(section.classList.contains("bg-red-500")).toBe(true);
        expect(section.classList.contains("bg-surface")).toBe(false);
        expect(section.classList.contains("p-5")).toBe(false);
    });
});

describe("InfoSection", () => {
    it("shows a busy placeholder until the data arrives", async () => {
        const screen = await render(
            <InfoSection title="Facts" query={{ isError: false }}>
                {() => <p>loaded</p>}
            </InfoSection>
        );
        await expect
            .element(screen.getByLabelText("Loading"))
            .toHaveAttribute("aria-busy", "true");
        expect(screen.getByText("loaded").query()).toBeNull();
    });

    it("shows an error message when the query failed", async () => {
        const screen = await render(
            <InfoSection title="Facts" query={{ isError: true }}>
                {() => <p>loaded</p>}
            </InfoSection>
        );
        await expect
            .element(screen.getByText("Couldn’t load this section."))
            .toBeVisible();
    });

    it("hands the data to its children once loaded", async () => {
        const screen = await render(
            <InfoSection
                title="Facts"
                query={{ isError: false, data: makeInfo({ genus: "Flame" }) }}
            >
                {(info) => <p>{info.genus}</p>}
            </InfoSection>
        );
        await expect.element(screen.getByText("Flame")).toBeVisible();
        expect(screen.getByLabelText("Loading").query()).toBeNull();
    });

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
