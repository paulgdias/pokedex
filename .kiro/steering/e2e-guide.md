---

inclusion: fileMatch
fileMatchPattern: "e2e/**"
---

# End-to-End Test Guide

E2E tests use Playwright Test against Chromium only. Specs live in `e2e/*.spec.ts`.

## Setup

`playwright.config.ts` starts its own dev server on **port 3100** (`npm run dev -- --port 3100`). This is intentional: a `npm run dev` or `npm run dev:proxy` server already running on port 3000 cannot interfere with or bypass the mocks. `reuseExistingServer` is true outside CI, so a server already on 3100 is reused.

Each test runs in its own browser context, so the **IndexedDB cache starts empty** for every test. Tests are fully independent and run in parallel (`fullyParallel: true`).

The viewport is 1280×800 — above the `lg` breakpoint, so the generation sidebar is visible and `AutoSizer` has non-zero height.

## PokeAPI mock

PokeAPI is **always mocked** in E2E. No test ever contacts the real API.

Call `mockPokeApi(page)` before the first `page.goto`. It:
- Intercepts all requests to `https://graphql.pokeapi.co/v1beta2` and answers from the 22-Pokémon `DEX` fixture defined in `e2e/mocks.ts`.
- Stubs all sprite/cry requests to `https://raw.githubusercontent.com/` with a 1×1 transparent PNG.
- Sets `localStorage.theme = "light"` via `addInitScript` so screenshots and colour-contrast checks are stable across runs.
- Returns a `Requests` object with `count(operationName)` and `infoIds[]` for asserting which operations were called and with which Pokémon ids.

The three intercepted operations and their responses:

| Operation         | Response source                                                             |
| ----------------- | --------------------------------------------------------------------------- |
| `getPokedex`      | `dexResponse()` — all 22 Pokémon from `DEX`                                 |
| `getPokemonInfo`  | `infoResponse(id)` — deterministic data keyed on `id`                       |
| `getTypeEfficacy` | `efficacyResponse()` — 18 types, mostly neutral with a few special matchups |

Any other operation receives `{ errors: [{ message: "unmocked <operation>" }] }`.

## The mock dex (`DEX`)

`DEX` in `e2e/mocks.ts` has 22 Pokémon covering:
- Three Kanto starters and their full lines (Bulbasaur, Charmander, Squirtle)
- Pikachu, Gengar, Ditto, Snorlax, Dragonite
- Mewtwo (legendary), Mew (mythical)
- Three Johto starters, Tyranitar
- Treecko, Rayquaza (legendary)

Import `DEX` in specs when you need to assert on Pokémon names, ids, or stats without hardcoding them.

## Timing-sensitive tests

The detail page debounces its info request by 300ms (`INFO_DEBOUNCE_MS` in `src/pages/Pokemon.tsx`). Tests that assert on when requests fire must not race the real clock.

Pattern:
```ts
await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
// ... navigate and interact ...
await page.clock.pauseAt(new Date("2026-01-01T00:00:10Z")); // freeze
// ... do fast interactions ...
await page.clock.runFor(400); // advance past the debounce
await expect
    .poll(() => requests.infoIds)
    .toEqual([
        /* expected */
    ]);
```

Use `expect.poll` rather than `expect` directly when asserting on async side effects like `infoIds`.

## URL encoding

URL search parameters are percent-encoded. `sort=name:desc` appears in the URL as `sort=name%3Adesc`. When writing URL assertions, match both forms:

```ts
await expect(page).toHaveURL(/(sort=name(:|%3A)desc)/);
```

## Navigation between Pokémon

After pressing ←/→ to navigate between Pokémon, wait for the adjacent-Pokémon buttons before the next keypress. This ensures the new page has fully rendered and the next key applies to the correct Pokémon:

```ts
await page.keyboard.press("ArrowRight");
await expect(page).toHaveURL("/pokedex/ivysaur");
await expect(
    page.getByRole("button", { name: "Previous: bulbasaur" })
).toBeVisible();
await page.keyboard.press("ArrowLeft");
```

## Spec coverage

| Spec                         | What it covers                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `browse-detail-back.spec.ts` | Browse list → detail → back, filter state preserved                               |
| `search-filter-sort.spec.ts` | Search, type filter, generation filter, sort, URL params                          |
| `card-list-view.spec.ts`     | Card grid ↔ list (table) view toggle                                              |
| `detail.spec.ts`             | Detail page stats, arrow key navigation, debounced info request, held-key history |
| `compare.spec.ts`            | Compare page: add/remove Pokémon, stat highlighting                               |
| `type-chart.spec.ts`         | Type effectiveness matrix                                                         |
| `persisted-cache.spec.ts`    | IndexedDB cache: dex is not re-fetched on reload when cached                      |

## Adding a spec

1. Import `mockPokeApi` and optionally `DEX` from `./mocks`.
2. Call `await mockPokeApi(page)` before `page.goto`.
3. Use `page.clock` for any test that depends on debounce or timeout timing.
4. Each test gets its own context automatically — no manual cache clearing needed.
5. Keep assertions on the `Requests` object (`.count`, `.infoIds`) for network behaviour; use Playwright locators for UI state.
