import { expect, type Page, test } from "@playwright/test";

import { mockPokeApi } from "./mocks";

// the filter, sort and suggestion rules are covered by the utils/search and
// utils/sort tests, and the controls' callbacks by the SearchBar tests; these
// check the page wires them to the URL and the list
test.beforeEach(async ({ page }) => {
    await mockPokeApi(page);
});

const shown = (page: Page) => page.getByText(/\d+ shown/);
const firstCard = (page: Page) =>
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

test("search suggestions come from the whole dex, not the filtered list", async ({
    page,
}) => {
    await page.goto("/pokedex?type=fire");
    await expect(shown(page)).toContainText("4 shown");

    // pikachu is not a fire type, but a name search still finds it
    await page.getByRole("combobox", { name: "Search Pokémon" }).fill("pika");
    await expect(page.getByRole("option", { name: /pikachu/ })).toBeVisible();
});

test("the sidebar and the type filter narrow the list, the heading and the URL", async ({
    page,
}) => {
    await page.goto("/pokedex");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText("All regions");
    await expect(page.getByText("National Dex · 22 Pokémon")).toBeVisible();

    await page.getByRole("link", { name: /Johto/ }).click();
    await expect(page).toHaveURL(/gen=2/);
    await expect(heading).toHaveText("Johto");
    // chikorita, cyndaquil, totodile, tyranitar
    await expect(page.getByText("Generation II · 4 Pokémon")).toBeVisible();

    await page.getByRole("button", { name: /^Type/ }).click();
    await page
        .getByRole("dialog", { name: "Filter by type" })
        .getByRole("button", { name: "Fire" })
        .click();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/type=fire/);
    await expect(page).toHaveURL(/gen=2/);
    // the count follows every filter, not just the generation: cyndaquil
    await expect(heading).toHaveText("Johto");
    await expect(page.getByText("Generation II · 1 Pokémon")).toBeVisible();
    await expect(shown(page)).toContainText("1 shown");
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
