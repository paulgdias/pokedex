/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";

// Keeps the suite honest as components are added: each one lives in its own
// folder (`Name/index.tsx`) with `Name.test.tsx`, `Name.stories.tsx` and
// `Name.mdx` (its docs page), and its stories drive the UI with a `play` function.

const files = Object.keys(import.meta.glob("../**/*.{ts,tsx}")).map((path) =>
    path.replace("../", "")
);
const docs = Object.keys(import.meta.glob("../**/*.mdx")).map((path) =>
    path.replace("../", "")
);
const stories = import.meta.glob<Record<string, unknown>>(
    "../**/*.stories.tsx",
    { eager: true }
);

const isSupport = (file: string) =>
    /\.(test|stories)\.tsx?$/.test(file) ||
    /^(__fixtures__|__tests__)\//.test(file);

const sources = files.filter((file) => !isSupport(file));
/** `Nav/index.tsx` -> `Nav`; the component's name is its folder's. */
const components = sources.filter(
    (file) => file.endsWith("/index.tsx") || file === "index.tsx"
);
/** helpers that are not components, e.g. `PokemonList/utils.ts` */
const helpers = sources.filter((file) => !components.includes(file));

const nameOf = (file: string) => file.split("/").slice(-2, -1)[0];
const dirOf = (file: string) => file.slice(0, file.lastIndexOf("/"));

describe("component folder structure", () => {
    it("finds the components", () => {
        expect(components.length).toBeGreaterThanOrEqual(22);
    });

    it.each(components)("%s has a test file next to it", (file) => {
        expect(files).toContain(`${dirOf(file)}/${nameOf(file)}.test.tsx`);
    });

    it.each(components)("%s has a stories file next to it", (file) => {
        expect(files).toContain(`${dirOf(file)}/${nameOf(file)}.stories.tsx`);
    });

    it.each(components)("%s has a docs page next to it", (file) => {
        expect(docs).toContain(`${dirOf(file)}/${nameOf(file)}.mdx`);
    });

    it.each(helpers)("%s has a test file next to it", (file) => {
        expect(files).toContain(file.replace(/\.tsx?$/, ".test.ts"));
    });

    it("has no component outside a folder", () => {
        // a flat `Name.tsx` would sit beside its siblings instead of in `Name/`
        expect(helpers.filter((file) => file.endsWith(".tsx"))).toEqual([]);
    });
});

describe("component stories", () => {
    it.each(components)(
        "%s has a story with a play function that asserts",
        (file) => {
            const path = `../${dirOf(file)}/${nameOf(file)}.stories.tsx`;
            const module = stories[path];
            expect(module, `${path} exists`).toBeDefined();

            const played = Object.entries(module)
                .filter(([name]) => name !== "default")
                .map(
                    ([, story]) =>
                        story as { play?: (...args: never[]) => unknown }
                )
                .filter(({ play }) => typeof play === "function");

            expect(played.length).toBeGreaterThan(0);
            for (const { play } of played) {
                // an interaction test must check something, not just render
                expect(String(play)).toMatch(/expect\(/);
            }
        }
    );

    it("every story in a stories file has a play function", () => {
        for (const [path, module] of Object.entries(stories)) {
            for (const [name, story] of Object.entries(module)) {
                if (name === "default") {
                    continue;
                }
                expect(
                    typeof (story as { play?: unknown }).play,
                    `${path} > ${name}`
                ).toBe("function");
            }
        }
    });
});

describe("util folder structure", () => {
    const utils = Object.keys(
        import.meta.glob("../../utils/**/*.{ts,tsx}")
    ).map((path) => path.replace("../../utils/", ""));
    const modules = utils.filter((file) => /^[^/]+\/index\.tsx?$/.test(file));

    it("finds the utils", () => {
        expect(modules.length).toBeGreaterThanOrEqual(12);
    });

    it.each(modules)("%s has a test file next to it", (file) => {
        const dir = file.split("/")[0];
        expect(
            utils.some((other) => other.startsWith(`${dir}/${dir}.test.`))
        ).toBe(true);
    });

    it("has no util outside a folder", () => {
        expect(utils.filter((file) => !file.includes("/"))).toEqual([]);
    });
});
