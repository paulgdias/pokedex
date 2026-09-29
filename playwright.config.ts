import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
    testDir: "./e2e",
    // one shared dev server; every test gets its own context (and so its own
    // IndexedDB), so tests are independent and can run in parallel
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: [["list"], ["html", { open: "never" }]],
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: "on-first-retry",
        // AutoSizer renders nothing at 0 height; 1280 is above the `lg`
        // breakpoint, so the generation sidebar exists
        viewport: { width: 1280, height: 800 },
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: {
        // a dedicated port, so a `npm run dev` / `dev:proxy` server on :3000
        // (which would bypass the PokeAPI mocks) is never picked up
        command: `npm run dev -- --port ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
