import { expect, test } from "@playwright/test";

import { mockPokeApi } from "./mocks";

test.beforeEach(async ({ page }) => {
    await mockPokeApi(page);
});

test("switching to list view keeps the filters and shows every match", async ({
    page,
}) => {
    await page.goto("/pokedex?type=fire");
    await expect(page.getByText(/\d+ shown/)).toContainText("4 shown");

    await page.getByRole("radio", { name: "List view" }).click();
    await expect(page).toHaveURL(/view=list/);
    await expect(page).toHaveURL(/type=fire/);

    // one header row plus a row per match
    const table = page.getByRole("table", { name: "Pokémon" });
    await expect(table).toHaveAttribute("aria-rowcount", "5");
    await expect(
        table.getByRole("link", { name: "charmander" })
    ).toBeVisible();

    await page.getByRole("radio", { name: "Card view" }).click();
    await expect(page).not.toHaveURL(/view=/);
    await expect(page).toHaveURL(/type=fire/);
    await expect(
        page.getByRole("link", { name: "Navigate to charmander" })
    ).toBeVisible();
});

test("a column header sorts the table", async ({ page }) => {
    await page.goto("/pokedex?view=list");
    const attack = page.getByRole("columnheader", { name: "Atk" });

    // numeric columns start with the highest value
    await attack.getByRole("button").click();
    await expect(attack).toHaveAttribute("aria-sort", "descending");
    await expect(page).toHaveURL(/sort=attack(:|%3A)desc/);
    const firstRow = page
        .getByRole("table", { name: "Pokémon" })
        .getByRole("row")
        .nth(1);
    await expect(firstRow).toContainText("rayquaza");

    await attack.getByRole("button").click();
    await expect(attack).toHaveAttribute("aria-sort", "ascending");
});

test("opening a row from the list and going Back keeps the list view", async ({
    page,
}) => {
    await page.goto("/pokedex?view=list&type=water");
    await page
        .getByRole("table", { name: "Pokémon" })
        .getByRole("link", { name: "squirtle" })
        .click();
    await expect(page).toHaveURL("/pokedex/squirtle");

    await page.getByRole("button", { name: "Back to Pokémon" }).click();
    await expect(page).toHaveURL(/view=list/);
    await expect(page).toHaveURL(/type=water/);
    await expect(page.getByRole("table", { name: "Pokémon" })).toBeVisible();
});
