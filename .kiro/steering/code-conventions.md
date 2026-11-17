# Code Conventions

## Formatting and linting

Biome 2 handles linting, formatting, and import organisation. There is no ESLint or Prettier.

- **Indentation**: 4 spaces for TS/JS/TSX, 2 for JSON (`.editorconfig`)
- **Quotes**: double quotes for JS/JSX, `jsxQuoteStyle: "double"`
- **Semicolons**: always
- **Line width**: 80 characters
- **Trailing commas**: ES5 style
- **Import order**: Node built-ins → blank line → third-party packages → blank line → workspace aliases (`@api`, `@components`, `@styles`, `@customTypes`, `@utils`) → blank line → relative paths

Run `npm run biome:check:fix` to apply all safe fixes. The pre-commit hook runs Biome on staged files; the pre-push hook runs `npm run verify`.

## TypeScript

- Strict mode. No `any` (`noExplicitAny` is an error).
- `const` over `let`; `var` is banned.
- Use `useConst` (Biome enforces `useConst: "error"`).
- Types go in `src/types/` (PascalCase filenames), imported via `@customTypes/...`.
- Inline prop types are preferred over separate `Props` type aliases for simple components.
- No `namespace`.
- `as const` assertions use `useAsConstAssertion` (enforced).

## React

- Functional components only. No class components.
- React 19: `ref` is a plain prop — no `forwardRef`.
- Default-export page components (they are lazy-loaded by the router).
- Named exports for all other components.
- PascalCase component names and filenames.
- Multi-file components are folders with `index.tsx` (never a flat `ComponentName.tsx` alongside siblings).
- `memo` on page-level list components where re-render cost is high (e.g. `Pokedex` is `memo`-wrapped).

## Styling

- Tailwind CSS utility classes inline on JSX elements.
- Wrap with `twMerge` (from `tailwind-merge`) wherever a `className` prop can override defaults.
- Never hardcode hex values; use the design tokens defined in `src/styles/index.css` (`@theme` block): `bg-paper`, `bg-surface`, `text-ink`, `text-muted`, `shadow-hover`, etc.
- Dark mode is handled by token overrides under `[data-theme="dark"]` in `src/styles/index.css` — not by Tailwind's `dark:` variant.
- Shared Tailwind class strings (type colour mappings, etc.) live in `src/styles/*.ts`, not inlined repeatedly.

## Accessible components

Use React Aria Components for all interactive controls (buttons, comboboxes, toggles, tabs). Do not use plain `<button>` or `<input>` where a React Aria equivalent exists.

Apply Aria state variants (pressed, disabled, selected, hovered, etc.) through `tailwindcss-react-aria-components` class prefixes rather than conditional logic.

All `a11y` Biome rules are enabled as errors. Where a rule genuinely cannot apply (e.g. roving tabindex patterns, `aria-activedescendant`, virtualised row wrappers), suppress it inline:

```tsx
// biome-ignore lint/a11y/useKeyWithClickEvents: handled by aria-activedescendant
```

## Path aliases

Always use path aliases for cross-folder imports. Never use `../..` to reach a sibling top-level folder.

| Alias            | Resolves to        |
| ---------------- | ------------------ |
| `@api/*`         | `src/api/*`        |
| `@components/*`  | `src/components/*` |
| `@styles/*`      | `src/styles/*`     |
| `@customTypes/*` | `src/types/*`      |
| `@utils/*`       | `src/utils/*`      |

Aliases are declared once in `tsconfig.json` (`paths`). Rspack, Vitest, and Storybook all read from `tsconfigAliases.cjs`, so a new alias only needs a `tsconfig.json` edit.

## Imports

- Import `react-virtualized` by deep path (`react-virtualized/dist/es/Grid`), not the barrel export, to avoid bundling the entire library.
- The Sonner `Toaster` is lazy-loaded in `Layout.tsx`; keep it that way.
- Rspack splits `react`, `react-dom`, and `react-router` into a `framework` chunk. Keep the entry chunk under its size budget.

## URL state

All Pokédex filter, sort, and view state is stored in URL search parameters. The helpers for reading and writing these params live in `src/utils/search/`, `src/utils/sort/`, and `src/utils/view/`.

URL writes always use `{ replace: true, preventScrollReset: true }`.

The `Nav` component preserves the query string on its links. When navigating to a detail page, pass `{ pokemon, previous: pathname + search }` in router state via `useNavigateToPokemon` so back navigation returns to the exact same filtered list.

## Sort semantics

The default sort is `id:asc` (Bulbasaur #1 first). Each comparator defines natural ascending order; descending reverses it. Ties always fall back to ascending `id`, regardless of sort direction.

## Theme

Theme is applied as `data-theme="light|dark"` on `<html>`. It is set before first paint by an inline script in `public/index.html` and managed by `src/utils/useTheme/`. The user's preference is stored in `localStorage` under the key `theme`. Always use CSS tokens; never check the theme in component logic.

## Icons

The icons directory is `src/components/Icons/` — keep that exact casing. Imports use `@components/Icons/...`. Lucide React icons are imported individually, not from the barrel.

## Working agreements

- Run `npm run verify` before considering work done. It runs Biome, type-check, production build, and tests with coverage in that order.
- `npm run verify:full` additionally runs the Playwright e2e suite.
- Do not push unless asked.
- A change that affects how the app looks (components, pages, styles) includes screenshots.
