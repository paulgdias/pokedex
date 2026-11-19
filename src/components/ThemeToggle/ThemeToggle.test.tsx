import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import ThemeToggle from ".";

// resolving, storing and blocked storage are useTheme's (useTheme.test.tsx);
// the selection a viewer sees is covered by the stories
describe("ThemeToggle", () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.dataset.theme = "light";
    });
    afterEach(() => localStorage.clear());

    it.each([
        ["Light theme", "light", "dark"],
        ["System theme", "system", "light"],
        ["Dark theme", "dark", "light"],
    ])("%s sets the %s preference", async (name, preference, before) => {
        localStorage.setItem("theme", before);
        const screen = await render(<ThemeToggle />);

        await screen.getByRole("radio", { name }).click();

        expect(localStorage.getItem("theme")).toBe(preference);
    });

    it("keeps the choice when the selected option is pressed again", async () => {
        const screen = await render(<ThemeToggle />);
        const dark = screen.getByRole("radio", { name: "Dark theme" });

        await dark.click();
        await dark.click();

        await expect.element(dark).toBeChecked();
        expect(localStorage.getItem("theme")).toBe("dark");
    });
});
