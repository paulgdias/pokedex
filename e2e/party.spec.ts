import { expect, type Page, test } from "@playwright/test";

import { mockPokeApi } from "./mocks";

// the URL state (threats, removing members, repeated ids) is covered by
// src/pages/Party.test.tsx and the Party component tests; this checks it
// survives a real reload and browser history
test.beforeEach(async ({ page }) => {
    await mockPokeApi(page);
});

const pick = async (page: Page, n: number, name: string) => {
    await page.getByRole("combobox", { name: `Slot ${n} Pokémon` }).fill(name);
    await page.getByRole("option", { name: new RegExp(name) }).click();
};

test("a party is written to the URL and restored from it", async ({ page }) => {
    await page.goto("/party");
    await pick(page, 1, "bulbasaur");
    await pick(page, 2, "charmander");

    await expect(page).toHaveURL(
        /party=1(,|%2C)4(,|%2C)0(,|%2C)0(,|%2C)0(,|%2C)0/
    );

    await page.reload();
    await expect(
        page.getByRole("button", { name: "Remove bulbasaur" })
    ).toBeVisible();
    await expect(
        page.getByRole("button", { name: "Remove charmander" })
    ).toBeVisible();
    await expect(
        page.getByRole("region", { name: "Defensive profile" })
    ).toBeVisible();

    // leaving and coming back with the browser restores it too
    await page.getByRole("link", { name: "Compare", exact: true }).click();
    await expect(page).toHaveURL(/\/compare/);
    await page.goBack();
    await expect(
        page.getByRole("button", { name: "Remove charmander" })
    ).toBeVisible();
});
