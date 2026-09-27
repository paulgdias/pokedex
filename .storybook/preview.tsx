import type { Preview } from "@storybook/react-vite";

import "../src/styles/index.css";

type Theme = "light" | "dark";

// `npm test` runs every story once per theme: each Vitest project sets this
// variable (see `vitest.config.mts`); in the Storybook UI the toolbar wins
const initialTheme: Theme =
    import.meta.env.VITE_STORYBOOK_THEME === "dark" ? "dark" : "light";

const preview: Preview = {
    initialGlobals: { theme: initialTheme },
    globalTypes: {
        theme: {
            description: "color theme (data-theme on <html>)",
            toolbar: {
                title: "Theme",
                icon: "circlehollow",
                items: [
                    { value: "light", title: "Light", icon: "sun" },
                    { value: "dark", title: "Dark", icon: "moon" },
                ],
                dynamicTitle: true,
            },
        },
    },
    decorators: [
        (Story, { globals }) => {
            // set during render, before the story paints and axe runs; the app
            // does the same on <html> (public/index.html and `useTheme`)
            document.documentElement.dataset.theme = globals.theme;
            return <Story />;
        },
    ],
    parameters: {
        // the addon reports every violation (Accessibility panel); the
        // pass/fail bar is the score check in `vitest.setup.ts`
        a11y: { test: "todo" },
        layout: "centered",
        options: {
            // sidebar sections, in the order components are used
            storySort: {
                order: [
                    "Introduction",
                    "Layout",
                    "Pokedex",
                    "PokemonDetail",
                    "Shared",
                ],
            },
        },
    },
};

export default preview;
