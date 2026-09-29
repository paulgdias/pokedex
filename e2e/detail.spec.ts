import { expect, test } from "@playwright/test";

import { DEX, mockPokeApi } from "./mocks";

// The detail page debounces its info request (`INFO_DEBOUNCE_MS` in
// `src/pages/Pokemon.tsx`). These tests freeze the page clock and advance it
// by hand, so the result does not depend on how fast the machine is.
const CLOCK_START = new Date("2026-01-01T00:00:00Z");
const CLOCK_PAUSE = new Date("2026-01-01T00:00:10Z");
const DEBOUNCE_MS = 400;

test("the detail page shows the stats, and lazy info arrives after", async ({
    page,
}) => {
    await mockPokeApi(page);
    await page.goto("/pokedex/bulbasaur");

    await expect(
        page.getByRole("heading", { level: 1, name: "Bulbasaur" })
    ).toBeVisible();
    await expect(page.getByRole("meter")).toHaveCount(6);
    // abilities come from the debounced info request
    await expect(page.getByRole("region", { name: "Abilities" })).toContainText(
        "Powers up moves."
    );
});

test("the arrow keys step through the dex", async ({ page }) => {
    await mockPokeApi(page);
    await page.goto("/pokedex/bulbasaur");
    await page.getByRole("heading", { level: 1, name: "Bulbasaur" }).waitFor();

    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL("/pokedex/ivysaur");
    // the key handler re-registers after each render, so wait for the page
    // to settle on ivysaur before the next key
    await expect(
        page.getByRole("button", { name: "Previous: bulbasaur" })
    ).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page).toHaveURL("/pokedex/bulbasaur");
});

test("skimming with the arrow keys requests only the pokémon you stop on", async ({
    page,
}) => {
    await page.clock.install({ time: CLOCK_START });
    const requests = await mockPokeApi(page);
    await page.goto("/pokedex/bulbasaur");
    await expect.poll(() => requests.infoIds).toEqual([1]);
    // frozen, so the debounce cannot fire until the test lets it, however
    // slow the machine is
    await page.clock.pauseAt(CLOCK_PAUSE);

    // ivysaur, venusaur, then charmander, faster than the 300 ms debounce
    for (const [stop, next] of [
        ["ivysaur", "venusaur"],
        ["venusaur", "charmander"],
        ["charmander", "charmeleon"],
    ]) {
        await page.keyboard.press("ArrowRight");
        await expect(page).toHaveURL(`/pokedex/${stop}`);
        await expect(
            page.getByRole("button", { name: `Next: ${next}` })
        ).toBeVisible();
    }
    await page.clock.runFor(DEBOUNCE_MS);
    await expect.poll(() => requests.infoIds).toEqual([1, 4]);
});

test("holding an arrow key adds one history entry and fetches only where it stops", async ({
    page,
}) => {
    await page.clock.install({ time: CLOCK_START });
    const requests = await mockPokeApi(page);
    await page.goto("/pokedex/bulbasaur");
    await expect.poll(() => requests.infoIds).toEqual([1]);
    await page.clock.pauseAt(CLOCK_PAUSE);
    const before = await page.evaluate(() => history.length);

    // Playwright marks repeated `down` calls as auto-repeat, like a held key
    for (let repeat = 0; repeat < 12; repeat++) {
        await page.keyboard.down("ArrowRight");
        await page.waitForTimeout(33);
    }
    await page.keyboard.up("ArrowRight");

    // it moved on, and browser Back would not have to walk every stop
    await expect(page).not.toHaveURL("/pokedex/bulbasaur");
    const stop = new URL(page.url()).pathname.split("/").pop();
    const stoppedId = DEX.find((mon) => mon.name === stop)?.id;
    expect(await page.evaluate(() => history.length)).toBeLessThanOrEqual(
        before + 1
    );

    // only the pokémon it rests on is requested, not every one passed
    await page.clock.runFor(DEBOUNCE_MS);
    await expect.poll(() => requests.infoIds).toEqual([1, stoppedId]);
});
