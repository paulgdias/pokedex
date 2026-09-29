import { expect, test } from "@playwright/test";

import { mockPokeApi } from "./mocks";

test.beforeEach(async ({ page }) => {
    await mockPokeApi(page);
});

const shown = (page: import("@playwright/test").Page) =>
    page.getByText(/\d+ shown/);
const firstCard = (page: import("@playwright/test").Page) =>
    page.getByRole("link", { name: /^Navigate to / }).first();

test("search filters immediately and writes q to the URL after the debounce", async ({
    page,
}) => {
    await page.goto("/pokedex");
    await expect(shown(page)).toContainText("22 shown");

    await page.getByRole("combobox", { name: "Search Pokémon" }).fill("pika");
    await expect(shown(page)).toContainText("1 shown");
    await expect(page).toHaveURL(/q=pika/);

    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(shown(page)).toContainText("22 shown");
    await expect(page).not.toHaveURL(/q=/);
});

test("the type filter narrows the list and writes type to the URL", async ({
    page,
}) => {
    await page.goto("/pokedex");
    await page.getByRole("button", { name: /^Type/ }).click();
    const dialog = page.getByRole("dialog", { name: "Filter by type" });
    await dialog.getByRole("button", { name: "Fire" }).click();
    await page.keyboard.press("Escape");

    // charmander, charmeleon, charizard, cyndaquil
    await expect(shown(page)).toContainText("4 shown");
    await expect(page).toHaveURL(/type=fire/);
});

test("the category toggle shows legendary and mythical pokémon", async ({
    page,
}) => {
    await page.goto("/pokedex");
    const category = page.getByLabel("Category");

    await category.getByText("Legendary").click();
    await expect(shown(page)).toContainText("2 shown");
    await expect(page).toHaveURL(/only=legendary/);

    await category.getByText("Mythical").click();
    await expect(shown(page)).toContainText("1 shown");
    await expect(page).toHaveURL(/only=mythical/);
});

test("the generation sidebar filters by generation", async ({ page }) => {
    await page.goto("/pokedex");
    await page.getByRole("link", { name: /Johto/ }).click();
    // chikorita, cyndaquil, totodile, tyranitar
    await expect(shown(page)).toContainText("4 shown");
    await expect(page).toHaveURL(/gen=2/);
});

test("sorting reorders the list and writes sort to the URL", async ({
    page,
}) => {
    await page.goto("/pokedex");
    await expect(firstCard(page)).toHaveAccessibleName("Navigate to bulbasaur");

    await page.getByLabel("Sort").selectOption({ label: "Name Z–A" });
    await expect(firstCard(page)).toHaveAccessibleName("Navigate to wartortle");
    await expect(page).toHaveURL(/sort=name(:|%3A)desc/);

    await page.getByLabel("Sort").selectOption({ label: "Number Desc" });
    await expect(firstCard(page)).toHaveAccessibleName("Navigate to rayquaza");
});

test("filter chips can be removed one by one or all at once", async ({
    page,
}) => {
    await page.goto("/pokedex?type=fire&only=legendary&q=zzz");
    await expect(page.getByText("Nothing matches these filters")).toBeVisible();

    await page.getByRole("button", { name: /Remove filter .*zzz/i }).click();
    await expect(page).not.toHaveURL(/q=/);
    await expect(page).toHaveURL(/type=fire/);

    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(page).not.toHaveURL(/type=/);
    await expect(page).not.toHaveURL(/only=/);
    await expect(shown(page)).toContainText("22 shown");
});

test("a shared URL restores the search, filter and sort", async ({ page }) => {
    await page.goto("/pokedex?type=grass&sort=name:desc");
    // treecko, chikorita, venusaur, ivysaur, bulbasaur
    await expect(shown(page)).toContainText("5 shown");
    await expect(firstCard(page)).toHaveAccessibleName("Navigate to venusaur");
});
