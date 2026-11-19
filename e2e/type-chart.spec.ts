import { expect, test } from "@playwright/test";

import { mockPokeApi, type Requests } from "./mocks";

let requests: Requests;

// opening the tooltip on focus as well as hover is react-aria's
// TooltipTrigger; the hover test checks the page's own content and wiring
test.beforeEach(async ({ page }) => {
    requests = await mockPokeApi(page);
});

const cell = (
    page: import("@playwright/test").Page,
    attacker: string,
    defender: string
) =>
    page.locator(
        `td[data-attacker="${attacker}"][data-defender="${defender}"]`
    );

test("the type chart renders every matchup without loading the dex", async ({
    page,
}) => {
    await page.goto("/types");
    await expect(
        page.getByRole("heading", { level: 1, name: "Type chart" })
    ).toBeVisible();

    await expect(page.locator("td[data-attacker]")).toHaveCount(18 * 18);
    await expect(cell(page, "fire", "grass")).toHaveText(/2×/);
    await expect(cell(page, "fire", "water")).toHaveText(/½×/);
    await expect(cell(page, "electric", "ground")).toHaveText(/0×/);
    await expect(cell(page, "normal", "normal")).toHaveText(/1×/);

    // /types needs the chart only, never the ~960 KB dex
    expect(requests.count("getPokedex")).toBe(0);
    expect(requests.count("getTypeEfficacy")).toBe(1);
});

test("hovering a type header explains its matchups", async ({ page }) => {
    await page.goto("/types");
    // react-aria opens hover tooltips only after a real pointer interaction
    // on the page; a fresh automated page has had none, so click first
    await page.getByRole("heading", { level: 1 }).click();
    await page.getByRole("button", { name: "Attacking fire" }).hover();
    await expect(page.getByRole("tooltip")).toContainText(/fire attacking/i);
});
