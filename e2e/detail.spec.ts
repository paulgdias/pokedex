import { expect, test } from "@playwright/test";

import { mockPokeApi } from "./mocks";

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

test("the arrow keys step through the dex, one history entry per press", async ({
    page,
}) => {
    await mockPokeApi(page);
    await page.goto("/pokedex/bulbasaur");
    await page.getByRole("heading", { level: 1, name: "Bulbasaur" }).waitFor();

    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL("/pokedex/ivysaur");
    // wait for the page to settle on ivysaur, so the next key steps back
    // from it rather than from bulbasaur
    await expect(
        page.getByRole("button", { name: "Previous: bulbasaur" })
    ).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page).toHaveURL("/pokedex/bulbasaur");

    // a single press is a step of its own, so browser Back retraces it
    await page.goBack();
    await expect(page).toHaveURL("/pokedex/ivysaur");
});

test("holding an arrow key adds one history entry and requests only the pokémon it stops on", async ({
    page,
}) => {
    await page.clock.install({ time: CLOCK_START });
    const requests = await mockPokeApi(page);
    await page.goto("/pokedex/bulbasaur");
    await expect.poll(() => requests.infoIds).toEqual([1]);
    // frozen, so the debounce cannot fire until the test lets it, however
    // slow the machine is
    await page.clock.pauseAt(CLOCK_PAUSE);
    const before = await page.evaluate(() => history.length);

    // Playwright marks repeated `down` calls as auto-repeat, like a held key.
    // Each stop is awaited, so every repeat steps from a known pokémon.
    for (const [stop, next] of [
        ["ivysaur", "venusaur"],
        ["venusaur", "charmander"],
        ["charmander", "charmeleon"],
        ["charmeleon", "charizard"],
    ]) {
        await page.keyboard.down("ArrowRight");
        await expect(page).toHaveURL(`/pokedex/${stop}`);
        await expect(
            page.getByRole("button", { name: `Next: ${next}` })
        ).toBeVisible();
    }
    await page.keyboard.up("ArrowRight");

    // the first press adds an entry and the repeats replace it, so browser
    // Back does not have to walk every stop
    expect(await page.evaluate(() => history.length)).toBe(before + 1);

    // only charmeleon, where it rests, is requested, not every one passed
    await page.clock.runFor(DEBOUNCE_MS);
    await expect.poll(() => requests.infoIds).toEqual([1, 5]);
});
