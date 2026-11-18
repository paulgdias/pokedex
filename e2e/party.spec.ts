import { expect, type Page, test } from "@playwright/test";

import { mockPokeApi } from "./mocks";

test.beforeEach(async ({ page }) => {
    await mockPokeApi(page);
});

const slot = (page: Page, n: number) =>
    page.getByRole("combobox", { name: `Slot ${n} Pokémon` });

const pick = async (page: Page, n: number, name: string) => {
    await slot(page, n).fill(name);
    await page.getByRole("option", { name: new RegExp(name) }).click();
};

test("the Nav links to the Party Analyzer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Party", exact: true }).click();

    await expect(page).toHaveURL(/\/party$/);
    await expect(
        page.getByRole("heading", { level: 1, name: "Party Analyzer" })
    ).toBeVisible();
    await expect(
        page.getByRole("list", { name: "Party" }).getByRole("listitem")
    ).toHaveCount(6);
});

test("a party is written to the URL and restored from it", async ({ page }) => {
    await page.goto("/party");
    await pick(page, 1, "bulbasaur");
    await pick(page, 2, "charmander");

    await expect(page).toHaveURL(
        /party=1(,|%2C)4(,|%2C)0(,|%2C)0(,|%2C)0(,|%2C)0/
    );
    // a picked pokémon is not offered again
    await slot(page, 3).fill("bulba");
    await expect(page.getByRole("option", { name: /bulbasaur/ })).toHaveCount(
        0
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

test("a threat type adds a column to the threat grid", async ({ page }) => {
    await page.goto("/party?party=1,4,0,0,0,0");
    const threats = page.getByRole("region", { name: "Threat analysis" });
    await expect(threats.getByRole("table")).toHaveCount(0);

    await threats.getByRole("button", { name: /Add a threat type/ }).click();
    await page.getByRole("option", { name: "fire", exact: true }).click();

    await expect(page).toHaveURL(/threats=fire/);
    const grid = threats.getByRole("table");
    await expect(grid).toBeVisible();
    await expect(
        grid.getByText("Fire → Bulbasaur: 2× (super effective)")
    ).toBeAttached();
    await expect(
        grid.getByText("Fire → Charmander: 1× (neutral)")
    ).toBeAttached();

    await threats.getByRole("button", { name: "Remove fire threat" }).click();
    await expect(grid).toHaveCount(0);
    await expect(page).not.toHaveURL(/threats=/);
});

test("removing a member empties its slot", async ({ page }) => {
    await page.goto("/party?party=1,4,0,0,0,0");
    await page.getByRole("button", { name: "Remove charmander" }).click();

    await expect(slot(page, 2)).toBeVisible();
    await expect(
        page.getByRole("button", { name: "Remove bulbasaur" })
    ).toBeVisible();
    await expect(page).toHaveURL(
        /party=1(,|%2C)0(,|%2C)0(,|%2C)0(,|%2C)0(,|%2C)0/
    );
});
