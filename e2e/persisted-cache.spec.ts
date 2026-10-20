import { expect, test } from "@playwright/test";

import { mockPokeApi, type Requests } from "./mocks";

let requests: Requests;

test.beforeEach(async ({ page }) => {
    requests = await mockPokeApi(page);
});

/** Whether the persister has written the query cache to IndexedDB yet. */
const isPersisted = () =>
    new Promise<boolean>((resolve) => {
        const open = indexedDB.open("pokedex-cache");
        open.onerror = () => resolve(false);
        open.onsuccess = () => {
            const db = open.result;
            if (!db.objectStoreNames.contains("keyval")) {
                resolve(false);
                return;
            }
            const get = db
                .transaction("keyval")
                .objectStore("keyval")
                .get("REACT_QUERY_OFFLINE_CACHE");
            get.onsuccess = () => resolve(Boolean(get.result));
            get.onerror = () => resolve(false);
        };
    });

test("a reload reads the dex from the persisted cache instead of refetching it", async ({
    page,
}) => {
    await page.goto("/pokedex");
    await expect(page.getByText(/\d+ shown/)).toBeVisible();
    expect(requests.count("getPokedex")).toBe(1);
    // the persister writes on a 1 s throttle
    await expect.poll(() => page.evaluate(isPersisted)).toBe(true);

    await page.reload();
    await expect(page.getByText(/\d+ shown/)).toBeVisible();

    expect(requests.count("getPokedex")).toBe(1);
});
