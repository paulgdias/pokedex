import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
    stories: [
        "./*.mdx",
        "../src/components/**/*.mdx",
        "../src/components/**/*.stories.tsx",
    ],
    addons: [
        "@storybook/addon-a11y",
        // only the MDX engine: docs are hand-written `Name.mdx` files, there
        // are no generated (autodocs) pages
        "@storybook/addon-docs",
        "@storybook/addon-vitest",
    ],
    framework: "@storybook/react-vite",
    // the app builds with Rspack; Storybook reuses the Vitest (Vite) config
    // for its plugins and aliases
    async viteFinal(config) {
        const { default: tailwindcss } = await import("@tailwindcss/vite");
        const { default: tsconfigAliases } = await import(
            "../tsconfigAliases.cjs"
        );
        config.plugins = [...(config.plugins ?? []), tailwindcss()];
        config.resolve = {
            ...config.resolve,
            // aliases come from `paths` in tsconfig.json
            alias: { ...config.resolve?.alias, ...tsconfigAliases() },
        };
        config.optimizeDeps = {
            ...config.optimizeDeps,
            include: [
                ...(config.optimizeDeps?.include ?? []),
                "react-virtualized/dist/es/AutoSizer",
                "react-virtualized/dist/es/Grid",
                "react-virtualized/dist/es/List",
            ],
        };
        return config;
    },
};

export default config;
