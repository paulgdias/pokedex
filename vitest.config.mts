import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

import tsconfigAliases from "./tsconfigAliases.cjs";

// real Chromium: react-virtualized measures its container, and axe needs
// real styles to judge color contrast
const browser = (name: string) => ({
    enabled: true,
    headless: true,
    provider: playwright(),
    instances: [{ browser: "chromium" as const, name: `${name}-chromium` }],
});

export default defineConfig({
    plugins: [react(), tailwindcss()],
    // aliases come from `paths` in tsconfig.json
    resolve: { alias: tsconfigAliases() },
    // pre-bundled up front: a dependency found mid-run makes Vite re-optimize and
    // reload, which leaves two copies of React in the page
    optimizeDeps: {
        include: [
            "react-virtualized/dist/es/AutoSizer",
            "react-virtualized/dist/es/Grid",
            "react-virtualized/dist/es/List",
            "react-aria-components",
            "react-router",
            "lucide-react",
            "tailwind-merge",
            "react-error-boundary",
            "react-aria",
            "sonner",
            "graphql-request",
            "@tanstack/react-query",
            "@tanstack/react-query-persist-client",
            "@tanstack/query-async-storage-persister",
            "@uidotdev/usehooks",
            "react/jsx-dev-runtime",
            "storybook/test",
        ],
    },
    test: {
        fileParallelism: false,
        reporters: ["default", "./.storybook/a11yReporter.ts"],
        coverage: {
            provider: "v8",
            include: [
                "src/components/**",
                "src/utils/**",
                "api/src/pokeapiProxy.js",
            ],
            exclude: [
                "**/*.stories.*",
                "**/*.test.*",
                "src/components/__fixtures__/**",
            ],
            reporter: ["text", "html"],
            thresholds: {
                statements: 90,
                branches: 90,
                functions: 90,
                lines: 90,
            },
        },
        projects: [
            {
                extends: true,
                test: {
                    name: "unit",
                    include: ["src/**/*.test.{ts,tsx}"],
                    setupFiles: ["./vitest.setup.ts"],
                    browser: browser("unit"),
                },
            },
            // the Express PokeAPI proxy: plain Node, no browser
            {
                extends: false,
                test: {
                    name: "api",
                    environment: "node",
                    include: ["api/src/**/*.test.js"],
                },
            },
            // every story runs in both themes; `.storybook/preview.tsx` reads
            // the variable to pick the theme. The Storybook UI's Vitest addon
            // sets VITEST_STORYBOOK, and the plugin then forces the same
            // project name on every project that uses it, so there only the
            // light one is registered
            ...(process.env.VITEST_STORYBOOK
                ? (["light"] as const)
                : (["light", "dark"] as const)
            ).map((theme) => ({
                extends: true as const,
                plugins: [storybookTest({ configDir: ".storybook" })],
                test: {
                    name: `storybook-${theme}`,
                    env: { VITE_STORYBOOK_THEME: theme },
                    setupFiles: [".storybook/vitest.setup.ts"],
                    browser: browser(`storybook-${theme}`),
                },
            })),
        ],
    },
});
