import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import ThemeToggle from ".";

const radio = (screen: Awaited<ReturnType<typeof render>>, name: string) =>
    screen.getByRole("radio", { name });

describe("ThemeToggle", () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.dataset.theme = "light";
    });
    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it("starts on the system preference when nothing is saved", async () => {
        const screen = await render(<ThemeToggle />);
        await expect.element(radio(screen, "System theme")).toBeChecked();
    });

    it("saves the choice and applies it to the document", async () => {
        const screen = await render(<ThemeToggle />);

        await radio(screen, "Dark theme").click();

        expect(localStorage.getItem("theme")).toBe("dark");
        expect(document.documentElement.dataset.theme).toBe("dark");
        await expect.element(radio(screen, "Dark theme")).toBeChecked();
    });

    it("resolves the system option from prefers-color-scheme", async () => {
        vi.spyOn(window, "matchMedia").mockImplementation(
            (query) =>
                ({
                    matches: query.includes("dark"),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                }) as unknown as MediaQueryList
        );
        const screen = await render(<ThemeToggle />);

        await radio(screen, "Light theme").click();
        expect(document.documentElement.dataset.theme).toBe("light");

        await radio(screen, "System theme").click();
        expect(localStorage.getItem("theme")).toBe("system");
        expect(document.documentElement.dataset.theme).toBe("dark");
    });

    it("ignores an invalid saved value", async () => {
        localStorage.setItem("theme", "sepia");
        const screen = await render(<ThemeToggle />);
        await expect.element(radio(screen, "System theme")).toBeChecked();
    });

    it("still applies the choice when storage is blocked", async () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("blocked");
        });
        const screen = await render(<ThemeToggle />);

        await radio(screen, "Dark theme").click();

        expect(localStorage.getItem("theme")).toBeNull();
        expect(document.documentElement.dataset.theme).toBe("light");
    });
});
