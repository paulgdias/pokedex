---

inclusion: fileMatch
fileMatchPattern: ".storybook/**"
---

# Storybook Guide

Storybook uses Vite (not Rspack) for its build, sharing aliases and plugins from `tsconfigAliases.cjs` and `@tailwindcss/vite` via `viteFinal` in `.storybook/main.ts`.

## Configuration files

| File                | Purpose                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `main.ts`           | Story globs, addon registration, `viteFinal` for aliases and `react-virtualized` pre-bundling |
| `preview.tsx`       | Global decorator (theme), `globalTypes` toolbar, story sort order, a11y parameter             |
| `vitest.setup.ts`   | Per-story axe score assertion (runs in `afterEach`)                                           |
| `a11yScore.ts`      | `MIN_A11Y_SCORE` (0.5) and the `getA11yScore` helper                                          |
| `a11yReporter.ts`   | Custom Vitest reporter that prints every story's axe score after the run, labelled by project |
| `Introduction.mdx`  | The Storybook UI's intro page                                                                 |
| `preview-head.html` | Injected into the Storybook iframe `<head>`                                                   |

## Addons

- `@storybook/addon-a11y` — runs axe on every story; results appear in the Accessibility panel. The score check in `vitest.setup.ts` turns it into a hard pass/fail gate.
- `@storybook/addon-docs` — used only as the MDX engine. **Autodocs is not enabled.** Every component has a hand-written `ComponentName.mdx` docs page.
- `@storybook/addon-vitest` — runs every story as a Vitest test.

## Dual-theme test runs

`vitest.config.mts` defines `storybook-light` and `storybook-dark` Vitest projects. Each sets `VITE_STORYBOOK_THEME` to `"light"` or `"dark"`. `preview.tsx` reads this variable to pick the initial theme, and the global decorator writes it to `document.documentElement.dataset.theme` before each story paints.

In the Storybook UI, the toolbar's Theme menu switches the theme interactively instead.

When running via the Storybook UI's Vitest panel (`VITEST_STORYBOOK=1`), only the `light` project is registered to avoid duplicate runs.

## Accessibility scoring

After each story runs, `vitest.setup.ts` reads the axe report from `task.meta.reports` and computes a score: `passes / (passes + violations)`. A score below `MIN_A11Y_SCORE` (50%) fails the test. The score and violation ids are written to `task.meta.a11y` for `a11yReporter.ts` to aggregate and print at the end of the run.

The a11y parameter in `preview.tsx` is set to `{ test: "todo" }`, which tells the addon to report violations without blocking the Storybook UI — the Vitest gate in `vitest.setup.ts` is the enforcement point.

## Writing docs pages (MDX)

Each component's `ComponentName.mdx` must include:
- `<Meta of={Stories} />` — links the page to the stories file
- A short description of the component
- `<ArgTypes of={Stories} />` for props (or `<ArgTypes of={Component} />` when the story's `component` is a wrapper; hand-write an HTML `<table>` when the props type lives in `src/types/`, as with `PokemonCard`)
- A `<Canvas>` block per story

**Storybook's MDX engine has no GFM.** Markdown `| pipe |` tables render as plain text. Use HTML `<table>` elements for any tabular content in MDX files.

## Story sidebar order

Stories are sorted in `preview.tsx` via `storySort.order`:
1. Introduction
2. Layout
3. Pokedex
4. PokemonDetail
5. Shared

## Adding or editing `.storybook/` files

- Path aliases (`@components`, `@utils`, etc.) and `react-virtualized` deep imports are configured in `viteFinal` in `main.ts`. Add new deep imports to `optimizeDeps.include` there if Vite re-optimises mid-run.
- The global `theme` decorator in `preview.tsx` is the single place that applies `data-theme`. Do not apply it in individual stories.
- `MIN_A11Y_SCORE` in `a11yScore.ts` is the shared threshold for both `vitest.setup.ts` and `a11yReporter.ts`. Change it in one place.
