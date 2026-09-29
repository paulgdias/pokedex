import { expect, test } from "@playwright/test";

import { mockPokeApi } from "./mocks";

test.beforeEach(async ({ page }) => {
    await mockPokeApi(page);
});

test("three pokémon can be picked and compared side by side", async ({
    page,
}) => {
    await page.goto("/compare");
    await expect(
        page.getByText(
            "Add two or three Pokémon to compare their stats side by side."
        )
    ).toBeVisible();

    const picker = page.getByRole("combobox", {
        name: "Add a Pokémon to compare",
    });
    for (const name of ["bulbasaur", "charmander", "squirtle"]) {
        await picker.fill(name);
        await page.getByRole("option", { name: new RegExp(name) }).click();
    }

    await expect(page).toHaveURL(/ids=1(,|%2C)4(,|%2C)7/);
    // full: the picker goes away
    await expect(picker).toHaveCount(0);

    const table = page.getByRole("table", { name: /Stats compared for/ });
    await expect(table).toContainText("bulbasaur");
    await expect(table).toContainText("charmander");
    await expect(table).toContainText("squirtle");
    // Height, Weight and Abilities load per pokémon; "…" is the placeholder
    await expect(table).not.toContainText("…");
    // the best value in each stat row is marked for screen readers
    await expect(table.getByText("(highest)").first()).toBeAttached();

    await page.getByRole("button", { name: "Remove charmander" }).click();
    await expect(table).not.toContainText("charmander");
    await expect(picker).toBeVisible();
});

test("a deep link is deduplicated and unknown ids are dropped", async ({
    page,
}) => {
    await page.goto("/compare?ids=1,1,4,99999");
    const table = page.getByRole("table", { name: /Stats compared for/ });
    await expect(table).toContainText("bulbasaur");
    await expect(table).toContainText("charmander");
    await expect(table.getByRole("link", { name: "bulbasaur" })).toHaveCount(1);
});

test("one pokémon is not enough to compare", async ({ page }) => {
    await page.goto("/compare?ids=25");
    await expect(
        page.getByText("Add at least one more Pokémon to compare.")
    ).toBeVisible();
});

test("the Compare button on a detail page seeds the comparison", async ({
    page,
}) => {
    await page.goto("/pokedex/pikachu");
    // the page's own button, not the sidebar link
    await page
        .getByRole("main")
        .getByRole("button", { name: "Compare" })
        .click();
    await expect(page).toHaveURL(/\/compare\?ids=25/);
    await expect(
        page.getByText("Add at least one more Pokémon to compare.")
    ).toBeVisible();
});
