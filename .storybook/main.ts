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
        const path = await import("node:path");
        const root = path.resolve(import.meta.dirname, "..");
        config.plugins = [...(config.plugins ?? []), tailwindcss()];
        config.resolve = {
            ...config.resolve,
            alias: {
                ...config.resolve?.alias,
                "@api": path.resolve(root, "src/api"),
                "@components": path.resolve(root, "src/components"),
                "@styles": path.resolve(root, "src/styles"),
                "@customTypes": path.resolve(root, "src/types"),
                "@utils": path.resolve(root, "src/utils"),
            },
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
