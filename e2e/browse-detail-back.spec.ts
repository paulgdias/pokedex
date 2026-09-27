import { expect, test } from "@playwright/test";

import { mockPokeApi } from "./mocks";

test.beforeEach(async ({ page }) => {
    await mockPokeApi(page);
});

test("a card opens its detail page and Back restores the filters", async ({
    page,
}) => {
    await page.goto("/pokedex?q=char&type=fire");
    await expect(page.getByText(/\d+ shown/)).toContainText("3 shown");

    await page.getByRole("link", { name: "Navigate to charmander" }).click();
    await expect(page).toHaveURL("/pokedex/charmander");
    await expect(
        page.getByRole("heading", { level: 1, name: "Charmander" })
    ).toBeVisible();

    // the list URL travels in router state, so Back can restore it exactly
    const previous = await page.evaluate(
        () => history.state?.usr?.previous as string
    );
    expect(previous).toContain("q=char");
    expect(previous).toContain("type=fire");

    await page.getByRole("button", { name: "Back to Pokémon" }).click();
    await expect(page).toHaveURL(/\/pokedex\?.*q=char/);
    await expect(page).toHaveURL(/type=fire/);
    await expect(page.getByText(/\d+ shown/)).toContainText("3 shown");
    await expect(
        page.getByRole("button", { name: /Remove filter .*fire/i })
    ).toBeVisible();
});

test("browser Back returns to the same filtered list", async ({ page }) => {
    await page.goto("/pokedex?gen=2");
    await page.getByRole("link", { name: "Navigate to cyndaquil" }).click();
    await expect(page).toHaveURL("/pokedex/cyndaquil");

    await page.goBack();
    await expect(page).toHaveURL(/gen=2/);
    await expect(
        page.getByRole("link", { name: "Navigate to cyndaquil" })
    ).toBeVisible();
    await expect(
        page.getByRole("link", { name: "Navigate to bulbasaur" })
    ).toHaveCount(0);
});

test("a detail URL opened directly falls back to the plain list", async ({
    page,
}) => {
    await page.goto("/pokedex/pikachu");
    await expect(
        page.getByRole("heading", { level: 1, name: "Pikachu" })
    ).toBeVisible();

    // no router state on a direct load, so Back has nothing to restore
    await page.getByRole("button", { name: "Back to Pokémon" }).click();
    await expect(page).toHaveURL(/\/pokedex(\?|$)/);
});

test("an unknown pokémon redirects to the list", async ({ page }) => {
    await page.goto("/pokedex/not-a-pokemon");
    await expect(page).toHaveURL(/\/pokedex(\?|$)/);
    await expect(page.getByText(/\d+ shown/)).toBeVisible();
});
